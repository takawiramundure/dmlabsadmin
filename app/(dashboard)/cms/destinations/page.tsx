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
import { Search, PlusIcon, Trash2Icon, GlobeIcon, ImageIcon } from 'lucide-react';
import SEOEditor from "@/components/form/SEOEditor";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface DestinationItem {
    id: string;
    country: string;
    slug: string;
    flagEmoji?: string;
    heroImage?: string;
    description: string;
    isActive: boolean;
    order: number;
    [key: string]: any;
}

function SortableDestinationItem({ id, children, dragHandle }: { id: string; children: React.ReactNode; dragHandle: React.ReactNode }) {
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

export default function DestinationsManager() {
    const { currentSite } = useSite();
    const [destinations, setDestinations] = useState<DestinationItem[]>([]);
    const [seo, setSeo] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeDestId, setActiveDestId] = useState<string | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    useEffect(() => {
        loadData();
    }, [currentSite]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const data: any = await FirestoreService.getPageContent("destinations", currentSite.id);
            if (data) {
                setDestinations(data.destinations || []);
                setSeo(data.seo || {});
            } else {
                const siteSeed = SEED_DATA[currentSite.id];
                if (siteSeed && siteSeed.destinations) {
                    const seedArray = Array.isArray(siteSeed.destinations) ? siteSeed.destinations : (siteSeed.destinations.destinations || []);
                    setDestinations(seedArray.map((d: any, idx: number) => ({ ...d, id: d.id || `dest-${idx}` })));
                    setSeo(siteSeed.destinations.seo || {});
                } else {
                    setDestinations([]);
                    setSeo({});
                }
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load destinations.");
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
                destinations: destinations.map((d, idx) => ({ ...d, order: idx })),
                seo,
                lastUpdated: new Date().toISOString()
            };
            await FirestoreService.savePageContent("destinations", data as any, currentSite.id);
            setSuccessMsg("Destinations updated successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save destinations.");
        } finally {
            setSaving(false);
        }
    };

    const addDestination = () => {
        const newDest: DestinationItem = {
            id: `dest-${Date.now()}`,
            country: "New Destination",
            slug: "new-destination",
            flagEmoji: "🏳️",
            description: "Country details...",
            isActive: true,
            order: destinations.length
        };
        setDestinations([...destinations, newDest]);
    };

    const updateDest = (id: string, field: string, value: any) => {
        setDestinations(destinations.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const removeDest = (id: string) => {
        if (confirm("Delete this destination?")) {
            setDestinations(destinations.filter(d => d.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setDestinations((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSeedData = async () => {
        const siteSeed = SEED_DATA[currentSite.id];
        if (!siteSeed || !siteSeed.destinations) {
            setError("No seed data found for this site.");
            return;
        }

        if (!confirm(`This will replace current destinations with seed data. Continue?`)) return;

        const seedArray = Array.isArray(siteSeed.destinations) ? siteSeed.destinations : (siteSeed.destinations.destinations || []);
        setDestinations(seedArray.map((d: any, idx: number) => ({ ...d, id: d.id || `seed-${idx}-${Date.now()}` })));
        setSeo(siteSeed.destinations.seo || {});
        setSuccessMsg("Seed data loaded. Don't forget to save!");
    };

    if (loading) return <div className="p-6">Loading Destinations...</div>;

    return (
        <>
            <PageMeta title={`Destinations Manager | ${currentSite.name}`} description="Manage Study Destinations" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Destinations Management</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage the countries and regions displayed on {currentSite.name}.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <VersionHistoryManager documentId="destinations" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={handleSeedData} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            🌱 Load Defaults
                        </Button>
                        <Button variant="outline" onClick={addDestination}><PlusIcon size={18} className="mr-1" /> Add Destination</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* SEO Editor */}
                <div className="mb-8 p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Search size={20} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Destinations Page SEO</h3>
                    </div>
                    <SEOEditor 
                        data={seo} 
                        onChange={(field, value) => setSeo({ ...seo, [field]: value })}
                    />
                </div>

                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
                    <SortableContext items={destinations.map(d => d.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {destinations.map((dest) => (
                                <SortableDestinationItem key={dest.id} id={dest.id} dragHandle={<GridIcon />}>
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 mr-4 flex gap-4">
                                                    <div className="w-16">
                                                        <Label>Flag</Label>
                                                        <Input 
                                                            value={dest.flagEmoji || ""} 
                                                            onChange={(e) => updateDest(dest.id, 'flagEmoji', e.target.value)} 
                                                            className="text-center text-xl"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label>Country Name</Label>
                                                        <Input 
                                                            value={dest.country} 
                                                            onChange={(e) => updateDest(dest.id, 'country', e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => updateDest(dest.id, 'isActive', !dest.isActive)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dest.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
                                                    >
                                                        {dest.isActive ? 'Published' : 'Draft'}
                                                    </button>
                                                    <button 
                                                        onClick={() => removeDest(dest.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2Icon size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>URL Slug</Label>
                                                    <Input 
                                                        value={dest.slug} 
                                                        onChange={(e) => updateDest(dest.id, 'slug', e.target.value)} 
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Region/Category (Optional)</Label>
                                                    <Input 
                                                        value={dest.region || ""} 
                                                        onChange={(e) => updateDest(dest.id, 'region', e.target.value)} 
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Overview Description</Label>
                                                <textarea 
                                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                    value={dest.description} 
                                                    onChange={(e) => updateDest(dest.id, 'description', e.target.value)} 
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                                                <div>
                                                    <Label className="text-[10px]">Universities</Label>
                                                    <Input size="sm" value={dest.stats?.universities || ""} onChange={(e) => updateDest(dest.id, 'stats', { ...dest.stats, universities: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px]">Avg. Tuition</Label>
                                                    <Input size="sm" value={dest.stats?.avgCost || ""} onChange={(e) => updateDest(dest.id, 'stats', { ...dest.stats, avgCost: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px]">Living Exp.</Label>
                                                    <Input size="sm" value={dest.stats?.livingExp || ""} onChange={(e) => updateDest(dest.id, 'stats', { ...dest.stats, livingExp: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px]">Visa Success</Label>
                                                    <Input size="sm" value={dest.stats?.visaSuccess || ""} onChange={(e) => updateDest(dest.id, 'stats', { ...dest.stats, visaSuccess: e.target.value })} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <Label>Highlights (One per line)</Label>
                                                    <textarea 
                                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                        value={Array.isArray(dest.highlights) ? dest.highlights.join('\n') : ""} 
                                                        onChange={(e) => updateDest(dest.id, 'highlights', e.target.value.split('\n').filter(b => b.trim()))} 
                                                        placeholder="Post-study work permit&#10;High quality of life..."
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Admission Requirements (One per line)</Label>
                                                    <textarea 
                                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                                        value={Array.isArray(dest.requirements) ? dest.requirements.join('\n') : ""} 
                                                        onChange={(e) => updateDest(dest.id, 'requirements', e.target.value.split('\n').filter(b => b.trim()))} 
                                                        placeholder="IELTS/TOEFL scores&#10;Academic transcripts..."
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Popular Cities (Comma separated)</Label>
                                                <Input 
                                                    value={Array.isArray(dest.popularCities) ? dest.popularCities.join(', ') : ""} 
                                                    onChange={(e) => updateDest(dest.id, 'popularCities', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                                                    placeholder="Toronto, Vancouver, Montreal..."
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-64 space-y-4">
                                            <Label>Hero/Cover Image</Label>
                                            <div 
                                                className="aspect-video bg-gray-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all overflow-hidden relative group"
                                                onClick={() => { setActiveDestId(dest.id); setShowMediaPicker(true); }}
                                            >
                                                {dest.heroImage || dest.imageUrl ? (
                                                    <>
                                                        <img src={dest.heroImage || dest.imageUrl} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ImageIcon className="text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlusIcon className="text-gray-400 mb-2" />
                                                        <span className="text-[10px] text-gray-500 font-medium">Select Hero Image</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </SortableDestinationItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <MediaPickerModal 
                    isOpen={showMediaPicker} 
                    onClose={() => setShowMediaPicker(false)} 
                    onSelect={(url) => { if (activeDestId) updateDest(activeDestId, 'heroImage', url); }} 
                />
            </div>
        </>
    );
}
