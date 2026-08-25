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
import { SEED_DATA } from "@/config/seedData";
import { GridIcon } from "@/icons";
import { useDialog } from "@/context/DialogContext";
import { optimizeImage } from "@/utils/imageOptimizer";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

// ---- Sortable Item Component ----
function SortableProgramItem({ id, children }: { id: string; children: React.ReactNode }) {
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

interface Program {
    id: string;
    title: string;
    description: string;
    link: string;
    imageUrl: string;
    isActive: boolean;
}

export default function ProgramsManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeProgramId, setActiveProgramId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const defaultPrograms: Program[] = [
        {
            id: '1',
            title: 'Suicide Awareness Training',
            description: 'Distress Centre Niagara provides access to suicide prevention education through their team of LivingWorks-certified trainers. These trainers are qualified to deliver both ASIST (Applied Suicide Intervention Skills Training) and SafeTALK workshops, equipping participants with the skills and confidence to identify and support individuals at risk of suicide.',
            link: 'https://distresscentreniagara.com',
            imageUrl: '',
            isActive: true
        },
        {
            id: '2',
            title: 'Leadership for Life Promotion',
            description: 'Feather Carriers is an Indigenous non-profit life promotion training program based on Indigenous knowledge and clinical experience. Training is provided in year-long teaching circles (cohorts) where participants learn teachings related to life promotion and premature unnatural death.',
            link: '#',
            imageUrl: '',
            isActive: true
        },
        {
            id: '3',
            title: 'Communicating safely online',
            description: '#ChatSafe is an internationally renowned suicide prevention program that aims to empower and equip young people to communicate safely online about self-harm and suicide on social media and other digital platforms. It also empowers their parents or caregivers to support them in communicating safely.',
            link: '#',
            imageUrl: '',
            isActive: true
        }
    ];

    const getBweicDefaultPrograms = (): Program[] => [
        {
            id: 'b1',
            title: 'Healing & Wellness Circle: Winter Gathering',
            description: 'A trauma-informed, culturally safe space for Black women to heal, rest, and reclaim their emotional wellbeing. Our winter gathering focuses on collective care and resilience.',
            link: '#',
            imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
            isActive: true
        },
        {
            id: 'b2',
            title: 'Leadership Development Workshop',
            description: 'Building confidence and capacity through leadership development, financial literacy, and self-advocacy programs that navigate systems with clarity.',
            link: '#',
            imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
            isActive: true
        },
        {
            id: 'b3',
            title: 'The Sovereignty Circle Mentorship',
            description: 'Experience-led mentorship matching for specific professional and life pathways, designed to bridge gaps in care and connection.',
            link: '#',
            imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop',
            isActive: true
        }
    ];

    useEffect(() => {
        loadPrograms();
    }, [currentSite]);

    const loadPrograms = async () => {
        setLoading(true);
        try {
            const data: any = await FirestoreService.getPageContent("programs", currentSite.id);
            if (data && data.programs && data.programs.length > 0) {
                setPrograms(data.programs);
            } else {
                setPrograms(currentSite.id === 'bweic' ? getBweicDefaultPrograms() : defaultPrograms);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load content.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            await FirestoreService.savePageContent("programs", { programs } as any, currentSite.id);
            setSuccessMsg("Changes saved successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, programId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(programId);
        try {
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `programs/${Date.now()}_${cleanName}`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            updateProgram(programId, 'imageUrl', downloadURL);
        } catch (err) {
            console.error(err);
            setError("Failed to upload image.");
        } finally {
            setUploading(null);
        }
    };

    const addProgram = () => {
        const newProgram: Program = {
            id: Date.now().toString(),
            title: "New Program",
            description: "Program description...",
            link: "",
            imageUrl: "",
            isActive: true
        };
        setPrograms([...programs, newProgram]);
    };

    const updateProgram = (id: string, field: keyof Program, value: any) => {
        setPrograms(programs.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const removeProgram = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Program",
            message: "Are you sure you want to delete this program? You will need to save changes to apply this permanently.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (isConfirmed) {
            setPrograms(programs.filter(p => p.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setPrograms((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const seedDefaults = async () => {
        const isConfirmed = await confirm({
            title: "Restore Defaults",
            message: "This will overwrite current items with default data. Are you sure you want to proceed?",
            variant: "warning",
            confirmLabel: "Restore Defaults"
        });

        if (isConfirmed) {
            // @ts-ignore
            const siteData = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
            // @ts-ignore
            if (siteData?.programs?.programs) {
                // @ts-ignore
                const defaults = siteData.programs.programs;
                setPrograms(defaults);
                // Auto-save
                FirestoreService.savePageContent("programs", { programs: defaults } as any, currentSite.id)
                    .then(() => setSuccessMsg("Default data restored and saved."))
                    .catch(() => setError("Failed to save seed data."));
            } else {
                setError("No default seed data found for this site.");
            }
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <PageMeta title="Programs & Services Manager | NSPC Admin" description="Manage Programs Section" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            Programs & Services Manager
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage the list of programs, trainings, and services.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="programs" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={seedDefaults}>Seed Defaults</Button>
                        <Button variant="outline" onClick={addProgram}>+ Add Program</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                <div className="mb-6 p-4 border rounded-lg bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-1">Image Upload Guidelines:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Program Graphics/Logos:</strong> Recommended 800x600 px (4:3) or 800x800 px (1:1).</li>
                        <li><strong>Format:</strong> JPG, PNG, or WebP. Max size: 2MB.</li>
                    </ul>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <SortableContext items={programs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {programs.map((program, index) => (
                                <SortableProgramItem key={program.id} id={program.id}>
                                    <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700 relative group">

                                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                                            <button
                                                onClick={() => updateProgram(program.id, 'isActive', !program.isActive)}
                                                className={`text-xs px-2 py-1 rounded border ${program.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                {program.isActive ? 'Active' : 'Hidden'}
                                            </button>
                                            <button
                                                onClick={() => removeProgram(program.id)}
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
                                                    <Label>Program Title</Label>
                                                    <Input
                                                        type="text"
                                                        value={program.title}
                                                        onChange={(e) => updateProgram(program.id, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>External Link</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="https://..."
                                                        value={program.link}
                                                        onChange={(e) => updateProgram(program.id, 'link', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <RichTextEditor
                                                        label="Description"
                                                        value={program.description}
                                                        onChange={(value) => updateProgram(program.id, 'description', value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Right: Image */}
                                            <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                                                <Label>Program Logo / Image</Label>
                                                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                                                    {program.imageUrl ? (
                                                        <img src={program.imageUrl} alt="Program visual" className="w-full h-full object-contain p-2" />
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No Image</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Image URL"
                                                        value={program.imageUrl}
                                                        onChange={(e) => updateProgram(program.id, 'imageUrl', e.target.value)}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <label className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading === program.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                            {uploading === program.id ? "Uploading..." : "Upload Image"}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, program.id)}
                                                                disabled={uploading === program.id}
                                                            />
                                                        </label>
                                                        <button
                                                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                                            onClick={() => {
                                                                setActiveProgramId(program.id);
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
                                </SortableProgramItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <MediaPickerModal
                    isOpen={showMediaPicker}
                    onClose={() => setShowMediaPicker(false)}
                    onSelect={(url) => {
                        if (activeProgramId) {
                            updateProgram(activeProgramId, 'imageUrl', url);
                        }
                    }}
                />
            </div>
        </>
    );
}
