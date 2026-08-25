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
import { storage } from "@/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import RichTextEditor from "@/components/form/RichTextEditor";
import MediaPickerModal from "@/components/common/MediaPickerModal";
import { FilePicker } from "@/components/form/FilePicker";
import { GridIcon } from "@/icons";
import { SEED_DATA } from "@/config/seedData";
import SEOEditor from "@/components/form/SEOEditor";
import { Search } from 'lucide-react';
import { useDialog } from "@/context/DialogContext";
import { optimizeImage } from "@/utils/imageOptimizer";
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

interface Resource {
    id: string;
    title: string;
    description: string;
    type: string;
    link: string;
    imageUrl: string;
    isActive: boolean;
}

export default function ResourcesManager() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeResourceId, setActiveResourceId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const getDefaultResources = (): Resource[] => {
        const siteData = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
        return siteData?.resources?.resources || [];
    };

    const [content, setContent] = useState<any>(null);

    useEffect(() => {
        loadResources();
    }, [currentSite]);

    const loadResources = async () => {
        setLoading(true);
        try {
            const data: any = await FirestoreService.getPageContent("resources", currentSite.id);
            if (data) {
                setContent(data);
                setResources(data.resources || []);
            } else {
                const siteSeed = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
                const resourcesData = siteSeed?.resources;
                setContent({
                    seo: resourcesData?.seo || {},
                    resources: resourcesData?.resources || []
                });
                setResources(resourcesData?.resources || []);
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
            await FirestoreService.savePageContent("resources", dataToSave, currentSite.id);
            setContent(dataToSave);
            setSuccessMsg("Changes saved successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, resourceId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(resourceId);
        try {
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `resources/${Date.now()}_${cleanName}`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            updateResource(resourceId, 'imageUrl', downloadURL);
        } catch (err) {
            console.error(err);
            setError("Failed to upload image.");
        } finally {
            setUploading(null);
        }
    };

    const addResource = () => {
        const newResource: Resource = {
            id: Date.now().toString(),
            title: "New Resource",
            description: "Resource description...",
            type: "Guide",
            link: "",
            imageUrl: "",
            isActive: true
        };
        setResources([...resources, newResource]);
    };

    const updateResource = (id: string, field: keyof Resource, value: any) => {
        setResources(resources.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        ));
    };

    const removeResource = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Resource",
            message: "Are you sure you want to delete this resource? You will need to save changes to apply this permanently.",
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
            <PageMeta title={`Resources Manager | ${currentSite.name}`} description="Manage Helpful Resources" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            Helpful Resources Manager
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage the library of guides, toolkits, and documents.
                        </p>
                    </div>
                    <div className="flex gap-3">

                        <VersionHistoryManager documentId="resources" siteId={currentSite.id} />

                        <Button variant="outline" onClick={addResource}>+ Add Resource</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                <div className="mb-6 p-4 border rounded-lg bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-1">Upload Guidelines:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Resource Image/Cover:</strong> Recommended 800x800 px (1:1) or 600x800 px (3:4 portrait).</li>
                        <li><strong>PDF Documents:</strong> For downloadable guides, ensure PDFs are under 10MB.</li>
                        <li><strong>Image Format:</strong> JPG or WebP. Max size: 2MB.</li>
                    </ul>
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

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Left: Content */}
                                            <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                                                <div>
                                                    <Label>Resource Title</Label>
                                                    <Input
                                                        type="text"
                                                        value={resource.title}
                                                        onChange={(e) => updateResource(resource.id, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Type</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g. Guide, Toolkit"
                                                            value={resource.type}
                                                            onChange={(e) => updateResource(resource.id, 'type', e.target.value)}
                                                        />
                                                    </div>
                                                    <div onPointerDown={e => e.stopPropagation()}>
                                                        <FilePicker
                                                            label="External Link / PDF"
                                                            value={resource.link}
                                                            onChange={url => updateResource(resource.id, 'link', url)}
                                                            placeholder="https:// or browse media library"
                                                            description="Link to an external page, or upload a PDF from the media library."
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <RichTextEditor
                                                        label="Description"
                                                        value={resource.description}
                                                        onChange={(value) => updateResource(resource.id, 'description', value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Right: Image */}
                                            <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                                                <Label>Cover Image / Logo</Label>
                                                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                                                    {resource.imageUrl ? (
                                                        <img src={resource.imageUrl} alt="Resource visual" className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No Image</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Image URL"
                                                        value={resource.imageUrl}
                                                        onChange={(e) => updateResource(resource.id, 'imageUrl', e.target.value)}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <label className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading === resource.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                            {uploading === resource.id ? "Uploading..." : "Upload Image"}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, resource.id)}
                                                                disabled={uploading === resource.id}
                                                            />
                                                        </label>
                                                        <button
                                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                                            onClick={() => {
                                                                setActiveResourceId(resource.id);
                                                                setShowMediaPicker(true);
                                                            }}
                                                        >
                                                            <GridIcon className="w-4 h-4 mr-2 text-gray-500" />
                                                            Select from Library
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SortableResourceItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <MediaPickerModal
                    isOpen={showMediaPicker}
                    onClose={() => setShowMediaPicker(false)}
                    onSelect={(url) => {
                        if (activeResourceId) {
                            updateResource(activeResourceId, 'imageUrl', url);
                        }
                    }}
                />
            </div>
        </>
    );
}
