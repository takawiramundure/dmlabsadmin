"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
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
import SEOEditor from "@/components/form/SEOEditor";
import { useDialog } from "@/context/DialogContext";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface ServiceItem {
    id: string;
    title: string;
    description: string;
    fullDescription?: string;
    imageUrl: string;
    beforeImage?: string;
    afterImage?: string;
    icon: string;
    isFeatured?: boolean;
    isActive: boolean;
}

interface ServicesPageContent {
    services: ServiceItem[];
    seo?: {
        title?: string;
        description?: string;
        image?: string;
    };
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
    const [content, setContent] = useState<ServicesPageContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
    const [activeField, setActiveField] = useState<keyof ServiceItem | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const [services, setServices] = useState<ServiceItem[]>([]);

    useEffect(() => {
        loadServices();
    }, [currentSite]);

    const loadServices = async () => {
        setLoading(true);
        try {
            const data: any = await FirestoreService.getPageContent("services", currentSite.id);
            if (data) {
                const sanitizedServices = (data.services || []).map((s: any) => ({
                    ...s,
                    id: s.id || `svc-${Math.random().toString(36).substr(2, 9)}`
                }));
                setContent({ ...data, services: sanitizedServices });
                setServices(sanitizedServices);
            } else {
                const siteSeed = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
                const servicesData = (siteSeed as any)?.services;
                const seedArray = servicesData?.services || servicesData || [];
                const initializedServices = (Array.isArray(seedArray) ? seedArray : []).map((s: any, idx: number) => ({
                    ...s,
                    id: `seed-${idx}-${Date.now()}`
                }));
                
                setContent({
                    services: initializedServices,
                    seo: servicesData?.seo || {}
                });
                setServices(initializedServices);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load services.");
        } finally {
            setLoading(false);
        }
    };

    const handleSeedData = async () => {
        const siteSeed = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
        const servicesData = (siteSeed as any)?.services;
        const defaultServices = servicesData?.services || servicesData || [];
        
        if (!Array.isArray(defaultServices) || defaultServices.length === 0) {
            setError("No seed data found for this site.");
            return;
        }

        const isConfirmed = await confirm({
            title: "Seed Services Data",
            message: `This will overwrite the current services list for "${currentSite.name}" with ${defaultServices.length} seed services. This cannot be undone.`,
            variant: "warning",
            confirmLabel: "Seed Data"
        });
        
        if (!isConfirmed) return;
        
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            const initializedServices = defaultServices.map((s: any, idx: number) => ({
                ...s,
                id: `seed-${idx}-${Date.now()}`
            }));
            const newContent = {
                ...content,
                services: initializedServices,
                seo: servicesData?.seo || content?.seo || {}
            };
            await FirestoreService.savePageContent("services", newContent as any, currentSite.id);
            setContent(newContent);
            setServices(initializedServices);
            setSuccessMsg(`✅ Seeded ${initializedServices.length} services successfully!`);
        } catch (err) {
            console.error(err);
            setError("Failed to seed data: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const handleSEOChange = (field: string, value: string) => {
        setContent(prev => ({
            ...prev!,
            seo: { ...prev?.seo, [field]: value }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            const updatedContent = {
                ...content,
                services,
                seo: content?.seo || {}
            };
            await FirestoreService.savePageContent("services", updatedContent as any, currentSite.id);
            setContent(updatedContent);
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
            id: Date.now().toString(),
            title: "New Service",
            description: "Service details...",
            imageUrl: "",
            icon: "construction",
            isActive: true
        };
        setServices([...services, newService]);
    };

    const updateService = (id: string, field: keyof ServiceItem, value: any) => {
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

    if (loading) return <div className="p-6">Loading Services...</div>;

    return (
        <>
            <PageMeta title={`Services Manager | ${currentSite.name}`} description="Manage High-End Services" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Construction & Woodworking Services</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage the core offerings displayed on the website.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <VersionHistoryManager documentId="services" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={handleSeedData} disabled={saving} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            🌱 Seed Default Data
                        </Button>
                        <Button variant="outline" onClick={addService}>+ Add Service</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* SEO Settings Section */}
                <div className="mb-8 p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Search size={20} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Services Search SEO</h3>
                    </div>
                    <SEOEditor 
                        data={content?.seo || {}} 
                        onChange={handleSEOChange}
                    />
                </div>

                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                    <SortableContext items={services.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {services.map((service, index) => (
                                <SortableServiceItem key={service.id} id={service.id} dragHandle={<GridIcon />}>
                                    <div className="relative">
                                        <div className="absolute top-0 right-0 flex gap-2">
                                             <button onClick={() => updateService(service.id, 'isFeatured', !service.isFeatured)} className={`text-xs px-2 py-1 rounded border ${service.isFeatured ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                 {service.isFeatured ? '★ Featured' : 'Featured?'}
                                             </button>
                                             <button onClick={() => updateService(service.id, 'isActive', !service.isActive)} className={`text-xs px-2 py-1 rounded border ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                 {service.isActive ? 'Published' : 'Draft'}
                                             </button>
                                            <button onClick={() => removeService(service.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Delete</button>
                                        </div>
 
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Short Description (Card view)</Label>
                                                    <textarea className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-24" value={service.description} onChange={(e) => updateService(service.id, 'description', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label>Detailed Professional Narrative (Service page content)</Label>
                                                    <textarea className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-48" value={service.fullDescription || ""} onChange={(e) => updateService(service.id, 'fullDescription', e.target.value)} placeholder="Simulated content for dynamic pages..." />
                                                </div>
                                            </div>
 
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="block text-center text-xs">Main Illustration</Label>
                                                        <div 
                                                            className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center cursor-pointer"
                                                            onClick={() => { setActiveServiceId(service.id); setActiveField('imageUrl'); setShowMediaPicker(true); }}
                                                        >
                                                            {service.imageUrl ? <img src={service.imageUrl} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">Select Main Image</span>}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="block text-center text-xs">Icon/Symbol (e.g. hammer)</Label>
                                                        <Input type="text" value={service.icon} onChange={(e) => updateService(service.id, 'icon', e.target.value)} />
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                                    <Label className="mb-2 block font-bold text-xs uppercase text-gray-400 tracking-wider">Before & After Showcase</Label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <div 
                                                                className="w-full h-32 bg-rose-50 rounded-lg overflow-hidden border border-rose-100 flex items-center justify-center cursor-pointer"
                                                                onClick={() => { setActiveServiceId(service.id); setActiveField('beforeImage'); setShowMediaPicker(true); }}
                                                            >
                                                                {service.beforeImage ? <img src={service.beforeImage} className="w-full h-full object-cover" /> : <span className="text-rose-300 text-xs">Select Before</span>}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div 
                                                                className="w-full h-32 bg-emerald-50 rounded-lg overflow-hidden border border-emerald-100 flex items-center justify-center cursor-pointer"
                                                                onClick={() => { setActiveServiceId(service.id); setActiveField('afterImage'); setShowMediaPicker(true); }}
                                                            >
                                                                {service.afterImage ? <img src={service.afterImage} className="w-full h-full object-cover" /> : <span className="text-emerald-300 text-xs">Select After</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SortableServiceItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <MediaPickerModal isOpen={showMediaPicker} onClose={() => setShowMediaPicker(false)} onSelect={(url) => { if (activeServiceId && activeField) updateService(activeServiceId, activeField, url); }} />
            </div>
        </>
    );
}
