"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import MediaLibrary from "@/components/common/MediaLibrary";
import RichTextEditor from "@/components/form/RichTextEditor";
import LinkPicker from "@/components/form/LinkPicker";
import { useDialog } from "@/context/DialogContext";
import {
    PencilIcon,
    TrashBinIcon,
    PlusIcon,
    CalenderIcon,
    TimeIcon,
    FolderIcon,
} from "@/icons";

interface Event {
    id: string;
    title: string;
    date: any; // Timestamp or Date
    formattedDate: string;
    timeRange: string;
    location: string;
    category: string;
    imageUrl: string;
    description: string;
    registrationUrl: string;
    isDone?: boolean;
    alwaysActive?: boolean;
}

export default function EventsManager() {
    const { currentSite } = useSite();
    const [events, setEvents] = useState<Event[]>([]);
    const { confirm, alert } = useDialog();

    // Limits
    const MAX_DESCRIPTION_LENGTH = 1000;

    const getCleanLength = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent?.length || 0;
    };
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [currentEventId, setCurrentEventId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState<Partial<Event>>({
        title: "",
        formattedDate: "",
        timeRange: "",
        location: "",
        category: "",
        imageUrl: "",
        description: "",
        isDone: false,
        alwaysActive: false,
        date: new Date(),
    });

    useEffect(() => {
        loadEvents();
    }, [currentSite.id]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getEvents(currentSite.id);
            // Sort by date descending
            const sorted = data.sort((a: any, b: any) => {
                const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date);
                const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            });
            setEvents(sorted as Event[]);
        } catch (err) {
            console.error(err);
            setError("Failed to load events.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.date) {
            setError("Title and Date are required.");
            return;
        }

        const currentLength = getCleanLength(formData.description || "");
        if (currentLength > MAX_DESCRIPTION_LENGTH) {
            setError(`Description is too long (${currentLength}/${MAX_DESCRIPTION_LENGTH} chars). Please shorten it.`);
            return;
        }

        setSaving(true);
        setError("");
        setSuccessMsg("");

        try {
            const eventData = {
                ...formData,
                // Ensure date is saved as Date object (Firestore SDK handles conversion to Timestamp)
                date: typeof formData.date === 'string' ? new Date(formData.date) : formData.date
            };

            await FirestoreService.saveEvent(currentSite.id, eventData, currentEventId || undefined);

            setSuccessMsg(currentEventId ? "Event updated successfully!" : "Event created successfully!");
            setIsModalOpen(false);
            loadEvents();

            // Reset form
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to save event.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Event",
            message: "Are you sure you want to delete this event? This action cannot be undone.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;

        try {
            await FirestoreService.deleteEvent(currentSite.id, id);
            setEvents(events.filter(e => e.id !== id));
            setSuccessMsg("Event deleted successfully.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to delete event.");
        }
    };

    const openNewEventModal = () => {
        setCurrentEventId(null);
        setFormData({
            title: "",
            formattedDate: "",
            timeRange: "",
            location: "",
            category: "",
            imageUrl: "",
            description: "",
            isDone: false,
            alwaysActive: false,
            date: new Date(),
        });
        setIsModalOpen(true);
    };

    const openEditModal = (event: Event) => {
        setCurrentEventId(event.id);
        const dateObj = event.date?.toDate ? event.date.toDate() : new Date(event.date);

        setFormData({
            ...event,
            date: dateObj
        });
        setIsModalOpen(true);
    };

    const handleClone = (event: Event) => {
        setCurrentEventId(null); // Clear ID to make it a new entry
        const dateObj = event.date?.toDate ? event.date.toDate() : new Date(event.date);
        setFormData({
            ...event,
            title: `${event.title} (Copy)`,
            date: dateObj,
            isDone: false // Cloned events should typically start as not done
        });
        setIsModalOpen(true);
    };

    const handleImageSelect = (url: string) => {
        setFormData({ ...formData, imageUrl: url });
        setIsMediaLibraryOpen(false);
    };

    // Helper to format date for input (YYYY-MM-DDThh:mm)
    const formatDateForInput = (date: any) => {
        if (!date) return "";
        try {
            const d = date.toDate ? date.toDate() : new Date(date);
            // Adjust for timezone offset to keep local time in input
            const offset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
            return localISOTime;
        } catch (e) {
            return "";
        }
    };

    return (
        <>
            <PageMeta title="Events Manager | CMS" description="Manage upcoming events" />
            
            <div className="p-6">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Events Manager</h1>
                        <p className="text-gray-500 mt-1">Manage upcoming events, workshops, and gatherings.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button requireSuperAdmin variant="outline" onClick={async () => {
                            const isConfirmed = await confirm({
                                title: "Seed Events",
                                message: "This will add the new Global Cooking Classes and other sample events. Continue?",
                                variant: "primary",
                                confirmLabel: "Seed Data"
                            });

                            if (!isConfirmed) return;

                            const sampleEvents = [
                                {
                                    title: "UMOJA Program Information Session",
                                    date: new Date("2026-03-27T16:30:00"),
                                    formattedDate: "Friday, March 27th",
                                    timeRange: "4:30 PM – 5:30 PM",
                                    location: "SDG Idea Factory, 2 King Street W, Kitchener",
                                    category: "Info Session",
                                    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",
                                    description: "Information session for the African, Caribbean, and Black Neuro-diverse Community Program initiative.",
                                    registrationUrl: ""
                                },
                                {
                                    title: "Adult Circle: Karaoke Night!",
                                    date: new Date("2026-04-18T14:00:00"),
                                    formattedDate: "Saturday, April 18th",
                                    timeRange: "2:00 PM – 4:00 PM",
                                    location: "SDG Ideas Factory, 2 King Street W, Kitchener",
                                    category: "Community",
                                    imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800",
                                    description: "<p>Our Adult Circle continues this April with a special twist: an afternoon of Karaoke, conversation, and community. Come sing, laugh, and connect with others in a safe and welcoming space.</p><p>The Adult Circle is a welcoming and safe space for adults to slow down, connect, and build meaningful community together.</p><ul><li>Foster conversations and shared experiences</li><li>Tools for mental health and resilience</li><li>Karaoke, music, and fun!</li></ul><p><em>Adults-only space. Light refreshments and transportation support available.</em></p>",
                                    registrationUrl: "https://docs.google.com/forms/d/1BhYRuzKqHNqudXS9e4xYiDIORGJCt2OrwexEb56m6aQ/edit"
                                },
                                {
                                    title: "Global Cooking Class: Seeds & Spices! (Kitchener)",
                                    date: new Date("2026-05-15T17:00:00"),
                                    formattedDate: "Friday, May 15th",
                                    timeRange: "5:00 PM – 7:00 PM",
                                    location: "St. Andrew’s Presbyterian Church, Kitchener",
                                    category: "Cooking",
                                    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
                                    description: "<p>We are thrilled to announce that our Global Cooking Classes are expanding! Join us for our brand-new Kitchener session. Food has a way of bringing us all together, and we can't wait to share a meal with you!</p>",
                                    registrationUrl: "https://docs.google.com/forms/d/e/1FAIpQLScTRnfBdLxj8swLJun2FXNEmTXD_pGhLT-DLJG9y_5l74rwcQ/viewform?usp=header"
                                },
                                {
                                    title: "Global Cooking Class: Seeds & Spices! (Waterloo)",
                                    date: new Date("2026-05-29T17:00:00"),
                                    formattedDate: "Friday, May 29th",
                                    timeRange: "5:00 PM – 7:00 PM",
                                    location: "231 Herbert St., Waterloo",
                                    category: "Cooking",
                                    imageUrl: "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800",
                                    description: "<p>Join us for our monthly Waterloo cooking session! Discover the world one spice at a time. Food has a way of bringing us all together, and we can't wait to share a meal with you!</p>",
                                    registrationUrl: "https://docs.google.com/forms/d/e/1FAIpQLScTRnfBdLxj8swLJun2FXNEmTXD_pGhLT-DLJG9y_5l74rwcQ/viewform?usp=header"
                                },
                                {
                                    title: "Black Excellence Gala 2026",
                                    date: new Date("2026-04-11T18:00:00"),
                                    formattedDate: "April 11, 2026",
                                    timeRange: "6:00 PM - 11:00 PM",
                                    location: "St. George Banquet Hall, Waterloo",
                                    category: "Gala",
                                    imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
                                    description: "<p>Our signature annual celebration of Black brilliance and achievement. Join us for a monumental evening of awards, networking, and community building.</p>",
                                    registrationUrl: "/black-excellence-gala"
                                }
                            ];
                            sampleEvents.forEach(e => {
                                // Use a predictable ID based on the title to avoid duplicates
                                const slugId = e.title.toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)+/g, '');
                                FirestoreService.saveEvent(currentSite.id, e, slugId);
                            });
                            setTimeout(loadEvents, 1000);
                        }}>
                            Seed Events
                        </Button>
                        <Button onClick={openNewEventModal} startIcon={<PlusIcon className="w-5 h-5" />}>
                            Add Event
                        </Button>
                    </div>
                </div>

                <div className="mb-6 p-4 border rounded-lg bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold mb-1">Image Upload Guidelines:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Event Posters/Images:</strong> Recommended 800x600 px (4:3) or 1920x1080 px (16:9).</li>
                        <li><strong>Format:</strong> JPG or WebP. Max size: 2MB.</li>
                    </ul>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No events found. Click "Add Event" to create one.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="h-48 bg-gray-200 relative">
                                    {event.imageUrl ? (
                                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <CalenderIcon className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        {event.isDone && (
                                            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                                                DONE
                                            </div>
                                        )}
                                        {event.date?.seconds && (new Date(event.date.seconds * 1000) < new Date()) && !event.isDone && !event.alwaysActive && (
                                            <div className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                                                PAST
                                            </div>
                                        )}
                                        {event.alwaysActive && (
                                            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                                                ALWAYS ACTIVE
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 px-2 py-1 rounded text-xs font-semibold">
                                        {event.category || "Uncategorized"}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold text-lg text-gray-900 dark:text-white line-clamp-1 ${event.isDone ? 'line-through opacity-50' : ''}`}>{event.title}</h3>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 mb-2">
                                        <CalenderIcon className="w-4 h-4 mr-2" />
                                        {event.formattedDate || new Date(event.date?.seconds ? event.date.seconds * 1000 : event.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 mb-4">
                                        <TimeIcon className="w-4 h-4 mr-2" />
                                        {event.timeRange || "Time not specified"}
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <Button variant="outline" size="sm" onClick={() => openEditModal(event)} className="flex-1">
                                            <PencilIcon className="w-4 h-4 mr-2" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleClone(event)} className="flex-1 bg-blue-50/50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                            <PlusIcon className="w-4 h-4 mr-2" /> Clone
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                            <TrashBinIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="7xl" className="h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-3xl">
                    <h2 className="text-xl font-bold">{currentEventId ? "Edit Event" : "Create New Event"}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="col-span-1 md:col-span-2">
                            <Label>Event Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Annual Gala"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 flex items-center gap-2 bg-gray-100 p-3 rounded-xl dark:bg-gray-800">
                                            <input 
                                                type="checkbox" 
                                                id="isDone" 
                                                checked={!!formData.isDone} 
                                                onChange={(e) => setFormData({ ...formData, isDone: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <Label htmlFor="isDone" className="mb-0 cursor-pointer">Mark as Completed / Done</Label>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 flex items-center gap-2 bg-gray-100 p-3 rounded-xl dark:bg-gray-800">
                                            <input 
                                                type="checkbox" 
                                                id="alwaysActive" 
                                                checked={!!formData.alwaysActive} 
                                                onChange={(e) => setFormData({ ...formData, alwaysActive: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <Label htmlFor="alwaysActive" className="mb-0 cursor-pointer">Always Active (Keep as Upcoming even after date passes)</Label>
                                        </div>

                        <div>
                            <Label>Date & Time (Sort Order)</Label>
                            <Input
                                type="datetime-local"
                                value={formatDateForInput(formData.date)}
                                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                            />
                        </div>

                        <div>
                            <Label>Display Date (Text)</Label>
                            <Input
                                value={formData.formattedDate || ""}
                                onChange={(e) => setFormData({ ...formData, formattedDate: e.target.value })}
                                placeholder="e.g. Feb 15, 2025"
                            />
                        </div>

                        <div>
                            <Label>Time Range (Text)</Label>
                            <Input
                                value={formData.timeRange || ""}
                                onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
                                placeholder="e.g. 6:00 PM - 9:00 PM EST"
                            />
                        </div>

                        <div>
                            <Label>Category</Label>
                            <Input
                                value={formData.category || ""}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g. Wellness, Workshop"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Location</Label>
                            <Input
                                value={formData.location || ""}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Toronto, ON or Virtual Link"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Registration URL / Goal Page</Label>
                            <LinkPicker
                                value={formData.registrationUrl || ""}
                                onChange={(val) => setFormData({ ...formData, registrationUrl: val })}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Event Image</Label>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <div className="flex gap-2">
                                        <Input
                                            value={formData.imageUrl || ""}
                                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="https://..."
                                            className="flex-1"
                                        />
                                        <Button variant="outline" onClick={() => setIsMediaLibraryOpen(true)}>
                                            <FolderIcon className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                                {formData.imageUrl && (
                                    <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <Label>Description</Label>
                            <RichTextEditor
                                label=""
                                value={formData.description || ""}
                                onChange={(val) => setFormData({ ...formData, description: val })}
                            />
                            <div className="flex justify-end mt-1">
                                <span className={`text-xs ${getCleanLength(formData.description || "") > MAX_DESCRIPTION_LENGTH ? "text-red-500 font-bold" : "text-gray-400"}`}>
                                    {getCleanLength(formData.description || "")} / {MAX_DESCRIPTION_LENGTH} chars
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : (currentEventId ? "Update Event" : "Create Event")}
                    </Button>
                </div>
            </Modal>

            {/* Media Library Modal */}
            <MediaLibrary
                isOpen={isMediaLibraryOpen}
                onSelect={handleImageSelect}
                basePath={currentSite.id}
                onClose={() => setIsMediaLibraryOpen(false)}
            />
        </>
    );
}
