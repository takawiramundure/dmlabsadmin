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
import { Search, PlusIcon, Trash2Icon, GlobeIcon, LayoutIcon, GraduationCap } from 'lucide-react';
import SEOEditor from "@/components/form/SEOEditor";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface UniversityItem {
    id: string;
    name: string;
    country: string;
    description?: string;
    logo?: string;
    programs?: string[];
    isActive: boolean;
    order: number;
    [key: string]: any;
}

function SortableUniversityItem({ id, children, dragHandle }: { id: string; children: React.ReactNode; dragHandle: React.ReactNode }) {
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

export default function UniversitiesManager() {
    const { currentSite } = useSite();
    const [universities, setUniversities] = useState<UniversityItem[]>([]);
    const [seo, setSeo] = useState<any>({});
    const [hero, setHero] = useState<any>({ heading: "", content: "" });
    const [cta, setCta] = useState<any>({ heading: "", subtitle: "" });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeUnivId, setActiveUnivId] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        loadData();
    }, [currentSite]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const data: any = await FirestoreService.getPageContent("universities", currentSite.id);
            if (data) {
                setUniversities(data.universities || []);
                setSeo(data.seo || {});
                setHero(data.hero || { heading: "Partner Universities", content: "Explore our extensive network..." });
                setCta(data.cta || { heading: "Don't see your dream university?", subtitle: "We partner with hundreds..." });
            } else {
                // Try to load from seed
                const siteSeed = (SEED_DATA as any)[currentSite.id];
                if (siteSeed && siteSeed.universities) {
                    const seedArray = Array.isArray(siteSeed.universities) ? siteSeed.universities : (siteSeed.universities.universities || []);
                    setUniversities(seedArray.map((s: any, idx: number) => ({ ...s, id: s.id || `seed-${idx}` })));
                    setSeo(siteSeed.universities.seo || {});
                } else {
                    setUniversities([]);
                    setSeo({});
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load universities.");
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
                universities: universities.map((s, idx) => ({ ...s, order: idx })),
                seo,
                hero,
                cta,
                lastUpdated: new Date().toISOString()
            };
            await FirestoreService.savePageContent("universities", data as any, currentSite.id);
            setSuccessMsg("Universities updated successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save universities.");
        } finally {
            setSaving(false);
        }
    };

    const addUniversity = () => {
        const newUniv: UniversityItem = {
            id: `univ-${Date.now()}`,
            name: "New University",
            country: "",
            description: "",
            logo: "",
            programs: [],
            isActive: true,
            order: universities.length
        };
        setUniversities([...universities, newUniv]);
    };

    const updateUniversity = (id: string, field: string, value: any) => {
        setUniversities(universities.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeUniversity = (id: string) => {
        if (confirm("Delete this university?")) {
            setUniversities(universities.filter(s => s.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setUniversities((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSeedData = async () => {
        const siteSeed = (SEED_DATA as any)[currentSite.id];
        if (!siteSeed || !siteSeed.universities) {
            setError("No seed data found for this site.");
            return;
        }

        if (!confirm(`This will replace current universities with seed data. Continue?`)) return;

        const seedArray = Array.isArray(siteSeed.universities) ? siteSeed.universities : (siteSeed.universities.universities || []);
        setUniversities(seedArray.map((s: any, idx: number) => ({ ...s, id: s.id || `seed-${idx}-${Date.now()}` })));
        setSeo(siteSeed.universities.seo || {});
        setSuccessMsg("Seed data loaded. Don't forget to save!");
    };

    if (loading) return <div className="p-6">Loading Universities...</div>;

    return (
        <>
            <PageMeta title={`Universities Manager | ${currentSite.name}`} description="Manage Partner Universities" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Partner Universities</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage the institutions partnered with {currentSite.name}.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <VersionHistoryManager documentId="universities" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={handleSeedData} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            🌱 Load Defaults
                        </Button>
                        <Button variant="outline" onClick={addUniversity}><PlusIcon size={18} className="mr-1" /> Add University</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* SEO Editor */}
                <div className="mb-8 p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Search size={20} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Universities SEO</h3>
                    </div>
                    <SEOEditor 
                        data={seo} 
                        onChange={(field, value) => setSeo({ ...seo, [field]: value })}
                    />
                </div>

                {/* Hero & CTA Sections */}
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
                            <h3 className="font-bold">CTA Section</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <Label>Heading</Label>
                                <Input value={cta.heading} onChange={(e) => setCta({ ...cta, heading: e.target.value })} />
                            </div>
                            <div>
                                <Label>Subtitle</Label>
                                <Input value={cta.subtitle} onChange={(e) => setCta({ ...cta, subtitle: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>

                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                    <SortableContext items={universities.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {universities.map((univ) => (
                                <SortableUniversityItem key={univ.id} id={univ.id} dragHandle={<GridIcon />}>
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 mr-4">
                                                    <Label>University Name</Label>
                                                    <Input 
                                                        value={univ.name} 
                                                        onChange={(e) => updateUniversity(univ.id, 'name', e.target.value)} 
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => updateUniversity(univ.id, 'isActive', !univ.isActive)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${univ.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                                                    >
                                                        {univ.isActive ? 'Published' : 'Draft'}
                                                    </button>
                                                    <button 
                                                        onClick={() => removeUniversity(univ.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2Icon size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Country</Label>
                                                    <Input 
                                                        value={univ.country} 
                                                        onChange={(e) => updateUniversity(univ.id, 'country', e.target.value)} 
                                                        placeholder="e.g. Canada"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Popular Programs (Comma separated)</Label>
                                                    <Input 
                                                        value={Array.isArray(univ.programs) ? univ.programs.join(', ') : (univ.programs || "")} 
                                                        onChange={(e) => updateUniversity(univ.id, 'programs', e.target.value.split(',').map(p => p.trim()))} 
                                                        placeholder="e.g. CS, Business, Law"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Description</Label>
                                                <textarea 
                                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                    value={univ.description || ""} 
                                                    onChange={(e) => updateUniversity(univ.id, 'description', e.target.value)} 
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-48 space-y-4">
                                            <Label>Logo</Label>
                                            <div 
                                                className="aspect-square bg-gray-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all overflow-hidden relative group"
                                                onClick={() => { setActiveUnivId(univ.id); setShowMediaPicker(true); }}
                                            >
                                                {univ.logo ? (
                                                    <>
                                                        <img src={univ.logo} className="w-full h-full object-contain p-4" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <LayoutIcon className="text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlusIcon className="text-gray-400 mb-2" />
                                                        <span className="text-[10px] text-gray-500 font-medium">Select Logo</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </SortableUniversityItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <MediaPickerModal 
                    isOpen={showMediaPicker} 
                    onClose={() => setShowMediaPicker(false)} 
                    onSelect={(url) => { if (activeUnivId) updateUniversity(activeUnivId, 'logo', url); }} 
                />
            </div>
        </>
    );
}
