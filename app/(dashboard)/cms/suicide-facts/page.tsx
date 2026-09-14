"use client";

import { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

// ---- Sortable Item Component ----
function SortableFactItem({ id, children }: { id: string; children: React.ReactNode }) {
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

interface Fact {
    id: string;
    text: string;
    source: string;
    color: string;
    hasButton: boolean;
    buttonText: string;
    buttonLink: string;
    hasLink: boolean;
    linkText: string;
    linkUrl: string;
    isActive: boolean;
}

const DEFAULT_FACTS: Fact[] = [
    {
        id: '1',
        text: "12 people die by suicide every day in Canada.",
        source: "(Source: Statistics Canada)",
        color: "green",
        hasButton: false,
        buttonText: "",
        buttonLink: "",
        hasLink: false,
        linkText: "",
        linkUrl: "",
        isActive: true
    },
    {
        id: '2',
        text: "Accurate and responsible coverage of suicide helps prevent harm and promotes help-seeking behaviours.\n\nFor Guidance on reporting suicide responsibly",
        source: "",
        color: "purple",
        hasButton: true,
        buttonText: "Download Guide",
        buttonLink: "#",
        hasLink: false,
        linkText: "",
        linkUrl: "",
        isActive: true
    },
    {
        id: '3',
        text: "For every person who dies by suicide, as many as 135 people can be impacted by the loss.",
        source: "(Source: Cerel et al, 2018)",
        color: "green",
        hasButton: false,
        buttonText: "",
        buttonLink: "",
        hasLink: false,
        linkText: "",
        linkUrl: "",
        isActive: true
    },
    {
        id: '4',
        text: "Research suggests that some populations or groups of people experience higher rates of suicide than others. But it's important to remember that there is no one cause of suicide.",
        source: "",
        color: "purple",
        hasButton: false,
        buttonText: "",
        buttonLink: "",
        hasLink: true,
        linkText: "Learn more",
        linkUrl: "#",
        isActive: true
    },
    {
        id: '5',
        text: "11.8% of people in Canada have had thoughts of suicide at some point in their lives.",
        source: "(Source: Health Canada)",
        color: "green",
        hasButton: false,
        buttonText: "",
        buttonLink: "",
        hasLink: false,
        linkText: "",
        linkUrl: "",
        isActive: true
    },
    {
        id: '6',
        text: "Language matters. Sometimes the words we use can be stigmatizing, even if we don't mean them to be. By choosing our words carefully, we can help break down the shame and stigma that surround suicide, and encourage people to get help when they need it.",
        source: "",
        color: "gray",
        hasButton: false,
        buttonText: "",
        buttonLink: "",
        hasLink: true,
        linkText: "Learn more",
        linkUrl: "#",
        isActive: true
    },
    {
        id: '7',
        text: "Suicide is preventable, and it is important to remember that most people who contemplate suicide are not seeking to end their lives, but rather to escape the overwhelming pain they are experiencing.",
        source: "",
        color: "beige",
        hasButton: false,
        buttonText: "",
        buttonLink: "",
        hasLink: true,
        linkText: "Learn more",
        linkUrl: "#",
        isActive: true
    }
];

export default function SuicideFactsManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [facts, setFacts] = useState<Fact[]>([]);
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
        loadFacts();
    }, [currentSite]);

    const loadFacts = async () => {
        setLoading(true);
        try {
            const data: any = await FirestoreService.getPageContent("suicide_facts", currentSite.id);
            if (data && data.facts && data.facts.length > 0) {
                setFacts(data.facts);
            } else {
                setFacts(DEFAULT_FACTS);
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
            await FirestoreService.savePageContent("suicide_facts", { facts } as any, currentSite.id);
            setSuccessMsg("Changes saved successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleSeedDefaults = async () => {
        const isConfirmed = await confirm({
            title: "Restore Default Facts",
            message: "This will overwrite your current facts with the defaults. Are you sure?",
            variant: "warning",
            confirmLabel: "Restore Defaults"
        });

        if (isConfirmed) {
            setFacts(DEFAULT_FACTS);
            setSuccessMsg("Reset to defaults. Don't forget to click Save Changes!");
        }
    };


    const addFact = () => {
        const newFact: Fact = {
            id: Date.now().toString(),
            text: "New Fact...",
            source: "",
            color: "green",
            hasButton: false,
            buttonText: "Learn More",
            buttonLink: "#",
            hasLink: false,
            linkText: "Learn More",
            linkUrl: "#",
            isActive: true
        };
        setFacts([...facts, newFact]);
    };

    const updateFact = (id: string, field: keyof Fact, value: any) => {
        setFacts(facts.map(f =>
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const removeFact = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Fact",
            message: "Are you sure you want to delete this fact?",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (isConfirmed) {
            setFacts(facts.filter(f => f.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setFacts((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <PageMeta title="Suicide Facts Manager | NSPC Admin" description="Manage Suicide Prevention Facts" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            Suicide Prevention Facts Manager
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage the coloured fact cards on the homepage.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="suicide_facts" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="secondary" onClick={handleSeedDefaults}>Seed Defaults</Button>
                        <Button variant="outline" onClick={addFact}>+ Add Fact</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <SortableContext items={facts.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {facts.map((fact, index) => (
                                <SortableFactItem key={fact.id} id={fact.id}>
                                    <div className={`p-5 border rounded-xl relative group ${fact.isActive ? 'bg-gray-50 border-gray-200 dark:bg-white/[0.02] dark:border-gray-700' : 'bg-gray-100 border-gray-300 opacity-75'}`}>

                                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                                            <button
                                                onClick={() => updateFact(fact.id, 'isActive', !fact.isActive)}
                                                className={`text-xs px-2 py-1 rounded border ${fact.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                {fact.isActive ? 'Active' : 'Hidden'}
                                            </button>
                                            <button
                                                onClick={() => removeFact(fact.id)}
                                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        <div className="mb-4">
                                            <span className="inline-block px-2 py-1 text-xs font-mono text-gray-500 bg-gray-200 rounded">Item {index + 1}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" onPointerDown={(e) => e.stopPropagation()}>
                                            {/* Content Column */}
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Fact Text</Label>
                                                    <textarea
                                                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-white/5"
                                                        rows={4}
                                                        value={fact.text}
                                                        onChange={(e) => updateFact(fact.id, 'text', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Source (Optional)</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. (Source: Statistics Canada)"
                                                        value={fact.source}
                                                        onChange={(e) => updateFact(fact.id, 'source', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Settings Column */}
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Card Color</Label>
                                                    <select
                                                        className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-white/5"
                                                        value={fact.color}
                                                        onChange={(e) => updateFact(fact.id, 'color', e.target.value)}
                                                    >
                                                        <option value="green">Green</option>
                                                        <option value="purple">Purple</option>
                                                        <option value="beige">Beige</option>
                                                        <option value="gray">Gray/Blue</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Has Button?</Label>
                                                        <input
                                                            type="checkbox"
                                                            checked={fact.hasButton}
                                                            onChange={(e) => updateFact(fact.id, 'hasButton', e.target.checked)}
                                                            className="mt-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Has Link?</Label>
                                                        <input
                                                            type="checkbox"
                                                            checked={fact.hasLink}
                                                            onChange={(e) => updateFact(fact.id, 'hasLink', e.target.checked)}
                                                            className="mt-2"
                                                        />
                                                    </div>
                                                </div>

                                                {fact.hasButton && (
                                                    <div className="space-y-2 p-3 bg-gray-50 rounded border border-gray-100">
                                                        <Label>Button Details</Label>
                                                        <Input placeholder="Button Text" value={fact.buttonText} onChange={(e) => updateFact(fact.id, 'buttonText', e.target.value)} />
                                                        <Input placeholder="Button Link" value={fact.buttonLink} onChange={(e) => updateFact(fact.id, 'buttonLink', e.target.value)} />
                                                    </div>
                                                )}

                                                {fact.hasLink && (
                                                    <div className="space-y-2 p-3 bg-gray-50 rounded border border-gray-100">
                                                        <Label>Link Details</Label>
                                                        <Input placeholder="Link Text" value={fact.linkText} onChange={(e) => updateFact(fact.id, 'linkText', e.target.value)} />
                                                        <Input placeholder="Link URL" value={fact.linkUrl} onChange={(e) => updateFact(fact.id, 'linkUrl', e.target.value)} />
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                </SortableFactItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </>
    );
}
