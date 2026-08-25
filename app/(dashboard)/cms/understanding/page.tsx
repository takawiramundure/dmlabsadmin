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
import { GridIcon } from "@/icons";
import { SEED_DATA } from "@/config/seedData";
import { optimizeImage } from "@/utils/imageOptimizer";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

// ---- Sortable Item Component for Cards ----
function SortableCardItem({ id, children }: { id: string; children: React.ReactNode }) {
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

interface ListItem {
    text: string;
    link: string;
}

interface UnderstandingCard {
    id: string;
    title: string;
    description: string;
    items: ListItem[];
    imageUrl: string;
    backgroundColor: string;
    isActive: boolean;
}

export default function UnderstandingManager() {
    const { currentSite } = useSite();
    const [cards, setCards] = useState<UnderstandingCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Default data from existing app
    const defaultCards: UnderstandingCard[] = [
        {
            id: '1',
            title: "What are the warning signs?",
            description: "People who die by suicide usually show some indication of warning before their deaths. Recognizing the warning signs for suicide can help us to intervene to save a life.",
            items: [
                { text: "Talking about wanting to die or to kill themselves", link: "" },
                { text: "Looking for a way to kill themselves, such as searching online or buying a gun", link: "" },
                { text: "Talking about feeling hopeless or having no reason to live", link: "" },
                { text: "Talking about feeling trapped or in unbearable pain", link: "" }
            ],
            imageUrl: '',
            backgroundColor: '#46C3CC', // Teal
            isActive: true
        },
        {
            id: '2',
            title: "What increases the risk of suicide?",
            description: "Suicide is complex and rarely caused by a single event. Risk factors include mental illness, previous attempts, specific life events, and severe life stressors such as financial trouble or relationship breakdown.",
            items: [
                { text: "Previous suicide attempt", link: "" },
                { text: "Mental illness, such as depression", link: "" },
                { text: "Social isolation", link: "" },
                { text: "Criminal problems", link: "" },
                { text: "Financial problems", link: "" }
            ],
            imageUrl: '',
            backgroundColor: '#DCE4EA', // Light Gray/Blue
            isActive: true
        },
        {
            id: '3',
            title: "How can communities take action?",
            description: "Communities play a vital role in prevention by creating supportive environments, reducing stigma, and connecting people to resources. Education and open conversation are key first steps.",
            items: [
                { text: "Learn the warning signs", link: "" },
                { text: "Reduce stigma by talking openly", link: "" },
                { text: "Connect people to resources", link: "" },
                { text: "Support those affected by suicide loss", link: "" }
            ],
            imageUrl: '',
            backgroundColor: '#AACD3A', // Lime Green
            isActive: true
        }
    ];

    const predefinedColors = [
        { name: "Teal", value: "#46C3CC" },
        { name: "Light Gray/Blue", value: "#DCE4EA" },
        { name: "Lime Green", value: "#AACD3A" },
        { name: "White", value: "#FFFFFF" },
        { name: "Orange", value: "#FF9F43" },
        { name: "Purple", value: "#9C27B0" }
    ];

    const getDefaultCards = (): UnderstandingCard[] => {
        const siteData = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
        return siteData?.understanding?.cards || [];
    };

    useEffect(() => {
        loadCards();
    }, [currentSite]);

    const loadCards = async () => {
        setLoading(true);
        try {
            const data: any = await FirestoreService.getPageContent("understanding", currentSite.id);
            if (data && data.cards && data.cards.length > 0) {
                // Normalize existing data if it's in the old string[] format
                const normalizedCards = data.cards.map((card: any) => ({
                    ...card,
                    items: card.items.map((item: any) => {
                        if (typeof item === 'string') {
                            return { text: item, link: "" };
                        }
                        return item;
                    })
                }));
                setCards(normalizedCards);
            } else {
                setCards(getDefaultCards());
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
            await FirestoreService.savePageContent("understanding", { cards } as any, currentSite.id);
            setSuccessMsg("Changes saved successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, cardId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(cardId);
        try {
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `understanding/${Date.now()}_${cleanName}`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            updateCard(cardId, 'imageUrl', downloadURL);
        } catch (err) {
            console.error(err);
            setError("Failed to upload image.");
        } finally {
            setUploading(null);
        }
    };

    const addCard = () => {
        const newCard: UnderstandingCard = {
            id: Date.now().toString(),
            imageUrl: "",
            title: "New Topic",
            description: "Description goes here...",
            items: [{ text: "Example item", link: "" }],
            backgroundColor: "#FFFFFF",
            isActive: true
        };
        setCards([...cards, newCard]);
    };

    const updateCard = (id: string, field: keyof UnderstandingCard, value: any) => {
        setCards(cards.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ));
    };

    const updateCardItem = (cardId: string, itemIndex: number, field: keyof ListItem, value: string) => {
        setCards(cards.map(c => {
            if (c.id === cardId) {
                const newItems = [...c.items];
                newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
                return { ...c, items: newItems };
            }
            return c;
        }));
    };

    const addCardItem = (cardId: string) => {
        setCards(cards.map(c =>
            c.id === cardId ? { ...c, items: [...c.items, { text: "", link: "" }] } : c
        ));
    };

    const removeCardItem = (cardId: string, itemIndex: number) => {
        setCards(cards.map(c => {
            if (c.id === cardId) {
                return { ...c, items: c.items.filter((_, i) => i !== itemIndex) };
            }
            return c;
        }));
    };

    const removeCard = (id: string) => {
        if (confirm("Are you sure you want to delete this card?")) {
            setCards(cards.filter(c => c.id !== id));
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setCards((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <PageMeta title="Understanding Suicide Manager | NSPC Admin" description="Manage Understanding Suicide Section" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            Understanding Suicide Manager
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage the accordion cards for the Understanding Suicide section.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="understanding" siteId={currentSite.id} />
                        <Button variant="outline" onClick={addCard}>+ Add Card</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                <div className="mb-6 p-4 border rounded-lg bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-1">Image Upload Guidelines:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Card Side Images:</strong> Recommended 800x800 px (1:1 square) or 1000x800 px (5:4).</li>
                        <li><strong>Format:</strong> JPG or WebP. Max size: 2MB.</li>
                    </ul>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                >
                    <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {cards.map((card, index) => (
                                <SortableCardItem key={card.id} id={card.id}>
                                    <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700 relative group">

                                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                                            <button
                                                onClick={() => updateCard(card.id, 'isActive', !card.isActive)}
                                                className={`text-xs px-2 py-1 rounded border ${card.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                {card.isActive ? 'Active' : 'Hidden'}
                                            </button>
                                            <button
                                                onClick={() => removeCard(card.id)}
                                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                                                onPointerDown={(e) => e.stopPropagation()}
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        <div className="mb-4">
                                            <span className="inline-block px-2 py-1 text-xs font-mono text-gray-500 bg-gray-200 rounded">Card {index + 1}</span>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Left: Content */}
                                            <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                                                <div>
                                                    <Label>Title</Label>
                                                    <Input
                                                        type="text"
                                                        value={card.title}
                                                        onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <RichTextEditor
                                                        label="Description"
                                                        value={card.description}
                                                        onChange={(value) => updateCard(card.id, 'description', value)}
                                                    />
                                                </div>

                                                <div>
                                                    <Label>List Items</Label>
                                                    <div className="space-y-3">
                                                        {card.items.map((item, i) => (
                                                            <div key={i} className="flex gap-2 items-start">
                                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Item Text"
                                                                        value={item.text}
                                                                        onChange={(e) => updateCardItem(card.id, i, 'text', e.target.value)}
                                                                    />
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Link URL (Optional)"
                                                                        value={item.link}
                                                                        onChange={(e) => updateCardItem(card.id, i, 'link', e.target.value)}
                                                                    />
                                                                </div>
                                                                <button
                                                                    className="text-red-500 hover:bg-red-50 p-2 rounded mt-1"
                                                                    onClick={() => removeCardItem(card.id, i)}
                                                                >×</button>
                                                            </div>
                                                        ))}
                                                        <Button size="sm" variant="outline" onClick={() => addCardItem(card.id)}>
                                                            + Add Item
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Style & Image */}
                                            <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                                                <div>
                                                    <Label>Background Color</Label>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {predefinedColors.map(color => (
                                                            <button
                                                                key={color.value}
                                                                className={`w-8 h-8 rounded-full border-2 ${card.backgroundColor === color.value ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
                                                                style={{ backgroundColor: color.value }}
                                                                onClick={() => updateCard(card.id, 'backgroundColor', color.value)}
                                                                title={color.name}
                                                            />
                                                        ))}
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        value={card.backgroundColor}
                                                        onChange={(e) => updateCard(card.id, 'backgroundColor', e.target.value)}
                                                        placeholder="#RRGGBB"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Image (Side Display)</Label>
                                                    <div className="mb-2 w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                                                        {card.imageUrl ? (
                                                            <img src={card.imageUrl} alt="Card visual" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">No Image</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Image URL"
                                                            value={card.imageUrl}
                                                            onChange={(e) => updateCard(card.id, 'imageUrl', e.target.value)}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <label className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading === card.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                                {uploading === card.id ? "Uploading..." : "Upload Image"}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleFileUpload(e, card.id)}
                                                                    disabled={uploading === card.id}
                                                                />
                                                            </label>
                                                            <button
                                                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                                                onClick={() => {
                                                                    setActiveSectionId(card.id);
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
                                    </div>
                                </SortableCardItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <MediaPickerModal
                    isOpen={showMediaPicker}
                    onClose={() => setShowMediaPicker(false)}
                    onSelect={(url) => {
                        if (activeSectionId) {
                            updateCard(activeSectionId, 'imageUrl', url);
                        }
                    }}
                />
            </div>
        </>
    );
}
