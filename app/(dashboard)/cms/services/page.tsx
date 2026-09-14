"use client";

import { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MediaPickerModal from "@/components/common/MediaPickerModal";
import { SEED_DATA } from "@/config/seedData";
import { GridIcon } from "@/icons";
import { Search, PlusIcon, LayoutIcon, Trash2Icon } from "lucide-react";
import SEOEditor from "@/components/form/SEOEditor";
import { useDialog } from "@/context/DialogContext";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface ServiceItem {
    id: string;
    title: string;
    description?: string;
    shortDescription?: string;
    icon: string;
    imageUrl?: string;
    isActive: boolean;
    order: number;
    [key: string]: any;
}

function SortableServiceItem({ id, children, dragHandle }: { id: string; children: React.ReactNode; dragHandle: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };
    return (
        <div ref={setNodeRef} style={style} className="mb-4">
            <div className="flex gap-4 p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700 relative group">
                <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors">
                    {dragHandle}
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function ServicesManager() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [seo, setSeo] = useState<any>({});
    const [hero, setHero] = useState<any>({ heading: "", content: "" });
    const [banner, setBanner] = useState<any>({ heading: "", subtitle: "", buttonText: "", buttonLink: "" });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        loadData();
    }, [currentSite]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const data: any = await FirestoreService.getPageContent("services", currentSite.id);
            if (data) {
                setServices(data.services || []);
                setSeo(data.seo || {});
                setHero(data.hero || { heading: "Our Expert Services", content: "From your first inquiry..." });
                setBanner(data.banner || { heading: "Not sure which service you need?", subtitle: "Book a free call...", buttonText: "Book Free Call", buttonLink: "/contact" });
            } else {
                // Try to load from seed
                const siteSeed = SEED_DATA[currentSite.id];
                if (siteSeed && siteSeed.services) {
                    const seedArray = Array.isArray(siteSeed.services) ? siteSeed.services : (siteSeed.services.services || []);
                    setServices(seedArray.map((s: any, idx: number) => ({ ...s, id: s.id || `seed-${idx}` })));
                    setSeo(siteSeed.services.seo || {});
                } else {
                    setServices([]);
                    setSeo({});
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load services.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            const data = {
                services: services.map((s, idx) => ({ ...s, order: idx })),
                seo,
                hero,
                banner,
                lastUpdated: new Date().toISOString()
            };
            await FirestoreService.savePageContent("services", data as any, currentSite.id);
            setSuccessMsg("Services updated successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save services.");
        } finally {
            setSaving(false);
        }
    };

    const addService = () => {
        const newService: ServiceItem = {
            id: `svc-${Date.now()}`,
            title: "New Service",
            shortDescription: "Short summary...",
            icon: "GraduationCap",
            isActive: true,
            order: services.length
        };
        setServices([...services, newService]);
    };

    const updateService = (id: string, field: string, value: any) => {
        setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeService = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Service",
            message: "Are you sure you want to delete this service? You will need to save changes to apply this permanently.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (isConfirmed) {
            setServices(services.filter(s => s.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setServices((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSeedData = async () => {
        const siteSeed = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
        if (!siteSeed || !siteSeed.services) {
            setError("No seed data found for this site.");
            return;
        }

        const isConfirmed = await confirm({
            title: "Restore Defaults",
            message: "This will replace current services with seed data. Continue?",
            variant: "warning",
            confirmLabel: "Restore Defaults"
        });

        if (!isConfirmed) return;

        const seedArray = Array.isArray(siteSeed.services) ? siteSeed.services : (siteSeed.services.services || []);
        setServices(seedArray.map((s: any, idx: number) => ({ ...s, id: s.id || `seed-${idx}-${Date.now()}` })));
        setSeo(siteSeed.services.seo || {});
        setSuccessMsg("Seed data loaded. Don't forget to save!");
    };

    if (loading) return <div className="p-6">Loading Services...</div>;

    return (
        <>
            <PageMeta title={`Services Manager | ${currentSite.name}`} description="Manage Site Services" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Services Management</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage the core offerings displayed on {currentSite.name}.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <VersionHistoryManager documentId="services" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={handleSeedData} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            🌱 Load Defaults
                        </Button>
                        <Button variant="outline" onClick={addService}><PlusIcon size={18} className="mr-1" /> Add Service</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* SEO Editor */}
                <div className="mb-8 p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Search size={20} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Services SEO</h3>
                    </div>
                    <SEOEditor 
                        data={seo} 
                        onChange={(field, value) => setSeo({ ...seo, [field]: value })}
                    />
                </div>

                {/* Hero & Banner Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4">
                            <LayoutIcon size={18} className="text-primary" />
                            <h3 className="font-bold">Hero Section</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <Label>Heading</Label>
                                <Input value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })} />
                            </div>
                            <div>
                                <Label>Content</Label>
                                <textarea 
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-20 outline-none"
                                    value={hero.content} 
                                    onChange={(e) => setHero({ ...hero, content: e.target.value })} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-4">
                            <LayoutIcon size={18} className="text-accent" />
                            <h3 className="font-bold">Trust Banner / CTA</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <Label>Heading</Label>
                                <Input value={banner.heading} onChange={(e) => setBanner({ ...banner, heading: e.target.value })} />
                            </div>
                            <div>
                                <Label>Subtitle</Label>
                                <Input value={banner.subtitle} onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Button Text</Label>
                                    <Input value={banner.buttonText} onChange={(e) => setBanner({ ...banner, buttonText: e.target.value })} />
                                </div>
                                <div>
                                    <Label>Button Link</Label>
                                    <Input value={banner.buttonLink} onChange={(e) => setBanner({ ...banner, buttonLink: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                    <SortableContext items={services.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {services.map((service) => (
                                <SortableServiceItem key={service.id} id={service.id} dragHandle={<GridIcon />}>
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 mr-4">
                                                    <Label>Service Title</Label>
                                                    <Input 
                                                        value={service.title} 
                                                        onChange={(e) => updateService(service.id, 'title', e.target.value)} 
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => updateService(service.id, 'isActive', !service.isActive)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${service.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                                                    >
                                                        {service.isActive ? 'Published' : 'Draft'}
                                                    </button>
                                                    <button 
                                                        onClick={() => removeService(service.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2Icon size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Icon Name (Lucide)</Label>
                                                    <Input 
                                                        value={service.icon} 
                                                        onChange={(e) => updateService(service.id, 'icon', e.target.value)} 
                                                        placeholder="e.g. GraduationCap"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Slug (Optional)</Label>
                                                    <Input 
                                                        value={service.slug || ""} 
                                                        onChange={(e) => updateService(service.id, 'slug', e.target.value)} 
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Short Description (for cards)</Label>
                                                <textarea 
                                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-20 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                    value={service.shortDescription || service.description || ""} 
                                                    onChange={(e) => updateService(service.id, 'shortDescription', e.target.value)} 
                                                />
                                            </div>

                                            <div>
                                                <Label>Full Overview (Long Description)</Label>
                                                <textarea 
                                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                    value={service.longDescription || ""} 
                                                    onChange={(e) => updateService(service.id, 'longDescription', e.target.value)} 
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <Label>Benefits (One per line)</Label>
                                                    <textarea 
                                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-40 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                        value={Array.isArray(service.benefits) ? service.benefits.join('\n') : ""} 
                                                        onChange={(e) => updateService(service.id, 'benefits', e.target.value.split('\n').filter(b => b.trim()))} 
                                                        placeholder="Priority Visa Processing&#10;Personalized SOP Reviews..."
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Process Steps (JSON format for now, or simple text list)</Label>
                                                    <p className="text-[10px] text-gray-400 mb-1">Example: {'[{"title":"Step 1", "desc":"..."}]'}</p>
                                                    <textarea 
                                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-40 font-mono focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                        value={typeof service.process === 'string' ? service.process : JSON.stringify(service.process || [], null, 2)} 
                                                        onChange={(e) => {
                                                            try {
                                                                const val = JSON.parse(e.target.value);
                                                                updateService(service.id, 'process', val);
                                                            } catch (err) {
                                                                updateService(service.id, 'process', e.target.value);
                                                            }
                                                        }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-48 space-y-4">
                                            <Label>Preview Image</Label>
                                            <div 
                                                className="aspect-square bg-gray-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all overflow-hidden relative group"
                                                onClick={() => { setActiveServiceId(service.id); setShowMediaPicker(true); }}
                                            >
                                                {service.imageUrl ? (
                                                    <>
                                                        <img src={service.imageUrl} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <LayoutIcon className="text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlusIcon className="text-gray-400 mb-2" />
                                                        <span className="text-[10px] text-gray-500 font-medium">Select Image</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </SortableServiceItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <MediaPickerModal 
                    isOpen={showMediaPicker} 
                    onClose={() => setShowMediaPicker(false)} 
                    onSelect={(url) => { if (activeServiceId) updateService(activeServiceId, 'imageUrl', url); }} 
                />
            </div>
        </>
    );
}
