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
import RichTextEditor from "@/components/form/RichTextEditor";
import { SEED_DATA } from "@/config/seedData";
import SEOEditor from "@/components/form/SEOEditor";
import { Search } from 'lucide-react';
import { useDialog } from "@/context/DialogContext";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

// ---- Sortable Item Component ----
function SortableResourceItem({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4">
            {children}
        </div>
    );
}

interface CopingResource {
    id: string;
    title: string;
    subtitle: string;
    content: string; // Supports multi-line
    icon: string; // Ionicons name
    link: string; // Optional link for "Contact Now"
    isActive: boolean;
}

export default function CopingManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [content, setContent] = useState<any>(null);
    const [resources, setResources] = useState<CopingResource[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        loadResources();
    }, [currentSite]);

    const loadResources = async () => {
        setLoading(true);
        try {
            const data: any = await FirestoreService.getPageContent("coping", currentSite.id);
            if (data) {
                setContent(data);
                setResources(data.resources || []);
            } else {
                const siteSeed = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
                const copingData = siteSeed?.coping;
                setContent({
                    seo: copingData?.seo || {},
                    resources: copingData?.resources || []
                });
                setResources(copingData?.resources || []);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load content.");
        } finally {
            setLoading(false);
        }
    };

    const handleSEOChange = (field: string, value: string) => {
        setContent((prev: any) => ({
            ...prev,
            seo: { ...prev?.seo, [field]: value }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            const dataToSave = {
                ...content,
                resources
            };
            await FirestoreService.savePageContent("coping", dataToSave, currentSite.id);
            setContent(dataToSave);
            setSuccessMsg("Changes saved successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const addResource = () => {
        const newResource: CopingResource = {
            id: Date.now().toString(),
            title: "New Resource",
            subtitle: "",
            content: "Description...",
            icon: "help-circle-outline",
            link: "",
            isActive: true
        };
        setResources([...resources, newResource]);
    };

    const updateResource = (id: string, field: keyof CopingResource, value: any) => {
        setResources(resources.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        ));
    };

    const removeResource = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Resource",
            message: "Are you sure you want to delete this resource?",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (isConfirmed) {
            setResources(resources.filter(r => r.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setResources((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <PageMeta title={`Coping with Loss Manager | ${currentSite.name}`} description="Manage Coping Section Resources" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            Coping with Loss Manager
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage the list of programs and support groups.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="coping" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={async () => {
                            const isConfirmed = await confirm({
                                title: "Seed Defaults",
                                message: "This will overwrite current changes with default data. Are you sure?",
                                variant: "warning",
                                confirmLabel: "Seed Data"
                            });

                            if (isConfirmed) {
                                const siteData = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
                                if (siteData?.coping) {
                                    const newData = {
                                        ...content,
                                        resources: siteData.coping.resources || [],
                                        seo: siteData.coping.seo || content?.seo || {}
                                    };
                                    setResources(newData.resources);
                                    setContent(newData);
                                    FirestoreService.savePageContent("coping", newData as any, currentSite.id)
                                        .then(() => setSuccessMsg("Default data seeded and saved!"))
                                        .catch(() => setError("Failed to save seeded data."));
                                }
                            }
                        }}>
                            Seed Defaults
                        </Button>
                        <Button variant="outline" onClick={addResource}>+ Add Resource</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* SEO Settings Section */}
                <div className="mb-8 p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Search size={20} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Page Search SEO</h3>
                    </div>
                    <SEOEditor 
                        data={content?.seo || {}} 
                        onChange={handleSEOChange}
                    />
                </div>

                <div className="mb-6 p-4 bg-gray-50 text-gray-700 rounded-lg text-sm border border-gray-200">
                    <p><strong>Note on Icons:</strong> Use valid <a href="https://ionic.io/ionicons" target="_blank" rel="noreferrer" className="text-blue-600 underline">Ionicons names</a> (e.g., 'heart-outline', 'call-outline', 'people-outline').</p>
                </div>

                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <SortableContext items={resources.map(r => r.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {resources.map((resource, index) => (
                                <SortableResourceItem key={resource.id} id={resource.id}>
                                    <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700 relative group">

                                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                                            <button
                                                onClick={() => updateResource(resource.id, 'isActive', !resource.isActive)}
                                                className={`text-xs px-2 py-1 rounded border ${resource.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                {resource.isActive ? 'Active' : 'Hidden'}
                                            </button>
                                            <button
                                                onClick={() => removeResource(resource.id)}
                                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        <div className="mb-4">
                                            <span className="inline-block px-2 py-1 text-xs font-mono text-gray-500 bg-gray-200 rounded">Item {index + 1}</span>
                                        </div>

                                        <div className="space-y-6" onPointerDown={(e) => e.stopPropagation()}>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label>Title</Label>
                                                        <Input
                                                            type="text"
                                                            value={resource.title}
                                                            onChange={(e) => updateResource(resource.id, 'title', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Subtitle (Optional)</Label>
                                                        <Input
                                                            type="text"
                                                            value={resource.subtitle || ""}
                                                            onChange={(e) => updateResource(resource.id, 'subtitle', e.target.value)}
                                                            placeholder="e.g. (for Indigenous Peoples)"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <Label>Icon Name (Ionicons)</Label>
                                                        <Input
                                                            type="text"
                                                            value={resource.icon}
                                                            onChange={(e) => updateResource(resource.id, 'icon', e.target.value)}
                                                            placeholder="e.g. heart-outline"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Contact Link / Phone</Label>
                                                        <Input
                                                            type="text"
                                                            value={resource.link || ""}
                                                            onChange={(e) => updateResource(resource.id, 'link', e.target.value)}
                                                            placeholder="e.g. tel:555-555-5555 or https://..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Description</Label>
                                                <RichTextEditor
                                                    label=""
                                                    value={resource.content}
                                                    onChange={(value) => updateResource(resource.id, 'content', value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SortableResourceItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </>
    );
}
