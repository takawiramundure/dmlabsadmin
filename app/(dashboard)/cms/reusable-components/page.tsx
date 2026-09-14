"use client";

import React, { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Trash2, Component, Calendar, FileText, Sparkles, Plus, Pin, Archive, Undo2 } from "lucide-react";
import { useDialog } from "@/context/DialogContext";

export default function ReusableComponentsManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [activeTab, setActiveTab] = useState<'reusable' | 'archived'>('reusable');
    const [components, setComponents] = useState<any[]>([]);
    const [archivedComponents, setArchivedComponents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [reusableData, archivedData] = await Promise.all([
                FirestoreService.getReusableSections(currentSite.id),
                FirestoreService.getArchivedSections(currentSite.id)
            ]);
            setComponents(reusableData);
            setArchivedComponents(archivedData);
        } catch (err) {
            console.error("Error loading components:", err);
            setError("Failed to load components library.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentSite?.id) {
            loadData();
        }
    }, [currentSite?.id]);

    const handleSeedDefaults = async () => {
        setSeeding(true);
        setError("");
        setSuccessMsg("");
        try {
            const defaults = [
                {
                    id: "events_widget",
                    reusableLabel: "Live Upcoming Events Stream",
                    heading: "Upcoming Events & Gatherings",
                    subtitle: "Join Our Community",
                    content: "Connect with our community through healing circles, workshops, and celebration events designed to empower and inspire.",
                    embed: "events",
                    count: 3,
                    selectionMode: "latest",
                    ctaText: "View All Events",
                    ctaUrl: "/upcoming-events",
                    enabled: true
                },
                {
                    id: "mission_pillars",
                    reusableLabel: "Why Choose Us (3 Core Pillars)",
                    heading: "Creating pathways from survival to sovereignty for Black women across Canada",
                    subtitle: "Why Choose BWEIC",
                    content: "<p><strong>Our Mission:</strong> To create safe, affirming spaces where Black women in Canada can heal, grow, and reclaim their power.</p>",
                    items: [
                        { title: "Healing & Wellness", description: "We prioritize creating trauma-informed, culturally safe spaces where Black women can heal, rest, and reclaim emotional wellbeing.", icon: "Heart" },
                        { title: "Empowerment & Growth", description: "We build confidence and capacity through leadership development, financial literacy, and self-advocacy programs.", icon: "Sparkles" },
                        { title: "Community & Belonging", description: "We reduce isolation through peer connection, storytelling, and collective care.", icon: "Users" }
                    ],
                    pills: ["Safety before visibility", "Healing is power", "Community over competition", "Lived experience matters", "Access over perfection"],
                    enabled: true
                },
                {
                    id: "impact_stats",
                    reusableLabel: "Impact Statistics Counter",
                    heading: "Our Measurable Impact",
                    subtitle: "Transforming Lives Across Canada",
                    stats: [
                        { value: "500+", label: "Black Women Empowered" },
                        { value: "50+", label: "Workshops & Circles" },
                        { value: "10+", label: "Provinces & Territories" }
                    ],
                    enabled: true
                },
                {
                    id: "newsletter_widget",
                    reusableLabel: "Newsletter & Community Updates",
                    heading: "Stay Connected With BWEIC",
                    subtitle: "Sign Up",
                    content: "Subscribe to our community newsletter for insights, upcoming events, and grassroots stories.",
                    embed: "newsletter",
                    enabled: true
                }
            ];

            for (const item of defaults) {
                await FirestoreService.saveReusableSection(currentSite.id, item.id, item);
            }

            setSuccessMsg("Seeded default reusable components library successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
            await loadData();
        } catch (err) {
            console.error("Error seeding reusable components:", err);
            setError("Failed to seed reusable components.");
        } finally {
            setSeeding(false);
        }
    };

    const handleDeleteReusable = async (componentId: string, label: string) => {
        const isConfirmed = await confirm({
            title: "Delete Reusable Component?",
            message: `Are you sure you want to delete "${label}"? This will remove it from the reusable library, but will not delete it from pages where it has already been added.`,
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;

        setDeletingId(componentId);
        setError("");
        setSuccessMsg("");
        try {
            await FirestoreService.deleteReusableSection(currentSite.id, componentId);
            setSuccessMsg("Reusable component deleted successfully.");
            setTimeout(() => setSuccessMsg(""), 3000);
            await loadData();
        } catch (err) {
            console.error("Error deleting reusable component:", err);
            setError("Failed to delete reusable component.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleRestoreArchivedToReusable = async (archivedComp: any) => {
        try {
            const newReusableId = archivedComp.originalSectionId || `restored_${Date.now()}`;
            await FirestoreService.saveReusableSection(currentSite.id, newReusableId, {
                ...archivedComp,
                id: newReusableId,
                reusableLabel: archivedComp.label || archivedComp.heading || newReusableId
            });
            await FirestoreService.deleteArchivedSection(currentSite.id, archivedComp.id);
            setSuccessMsg(`Restored "${archivedComp.label || newReusableId}" to Reusable Components Library!`);
            setTimeout(() => setSuccessMsg(""), 3000);
            await loadData();
        } catch (err) {
            console.error("Error restoring archived component:", err);
            setError("Failed to restore archived component.");
        }
    };

    const handleDeleteArchived = async (archiveId: string, label: string) => {
        const isConfirmed = await confirm({
            title: "Permanently Delete Archived Component?",
            message: `Are you sure you want to permanently delete "${label}" from archives? This cannot be undone.`,
            variant: "danger",
            confirmLabel: "Delete Permanently"
        });

        if (!isConfirmed) return;

        setDeletingId(archiveId);
        try {
            await FirestoreService.deleteArchivedSection(currentSite.id, archiveId);
            setSuccessMsg("Archived component permanently removed.");
            setTimeout(() => setSuccessMsg(""), 3000);
            await loadData();
        } catch (err) {
            console.error("Error deleting archived component:", err);
            setError("Failed to delete archived component.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading components library...</div>;

    return (
        <>
            <PageMeta
                title={`Components & Archives - ${currentSite.name} | Admin Portal`}
                description="Manage global reusable sections and archived components"
            />
            <PageBreadcrumb pageTitle="Components Library" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Component className="w-6 h-6 text-blue-600" />
                            Components & Archives Library
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage pinned reusable components and archived sections. Any archived section can be reinserted into pages anytime from the Insert sidebar.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeedDefaults}
                            disabled={seeding}
                            className="gap-2"
                        >
                            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                            {seeding ? "Seeding..." : "Seed Default Components"}
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
                    <button
                        onClick={() => setActiveTab('reusable')}
                        className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'reusable'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        <Component className="w-4 h-4" />
                        Active Reusable Components ({components.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'archived'
                                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        <Archive className="w-4 h-4 text-amber-500" />
                        Archived Components ({archivedComponents.length})
                    </button>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* Tab: Reusable */}
                {activeTab === 'reusable' && (
                    components.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {components.map((comp) => (
                                <div
                                    key={comp.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800/40 shadow-sm flex flex-col justify-between"
                                >
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                                    {comp.reusableLabel || comp.heading || comp.id}
                                                </h3>
                                                <span className="inline-block font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 mt-1">
                                                    ID: {comp.id}
                                                </span>
                                            </div>
                                            <span className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold uppercase">
                                                {comp.embed || "Section"}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                            {comp.heading && (
                                                <p className="line-clamp-1">
                                                    <strong>Heading:</strong> {comp.heading}
                                                </p>
                                            )}
                                            {comp.subtitle && (
                                                <p className="line-clamp-1">
                                                    <strong>Subtitle:</strong> {comp.subtitle}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {comp.embed === "events" && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 font-medium">
                                                    ⚡ Events Stream
                                                </span>
                                            )}
                                            {comp.embed === "newsletter" && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 font-medium">
                                                    ⚡ Newsletter Widget
                                                </span>
                                            )}
                                            {comp.items && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                                                    {comp.items.length} Pillar Cards
                                                </span>
                                            )}
                                            {comp.stats && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                                    {comp.stats.length} Stats Items
                                                </span>
                                            )}
                                            {comp.content && !comp.embed && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                                                    <FileText size={12} />
                                                    Rich Text
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-150 dark:border-gray-700 flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 hover:border-red-300 gap-1.5"
                                            onClick={() => handleDeleteReusable(comp.id, comp.reusableLabel || comp.heading || comp.id)}
                                            disabled={deletingId === comp.id}
                                        >
                                            <Trash2 size={16} />
                                            Remove from Library
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 max-w-lg mx-auto">
                            <Component className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg">No reusable components yet</h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto mb-6">
                                Seed default components or click the Pin button on any section in the Content Manager.
                            </p>
                            <Button
                                variant="primary"
                                onClick={handleSeedDefaults}
                                disabled={seeding}
                                className="gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                {seeding ? "Seeding..." : "Seed Default Components"}
                            </Button>
                        </div>
                    )
                )}

                {/* Tab: Archived */}
                {activeTab === 'archived' && (
                    archivedComponents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {archivedComponents.map((archived) => {
                                const label = archived.label || archived.heading || archived.reusableLabel || archived.originalSectionId || archived.id;
                                const dateStr = archived.archivedAt ? new Date(archived.archivedAt).toLocaleDateString() : 'Previously';

                                return (
                                    <div
                                        key={archived.id}
                                        className="border border-amber-200 dark:border-amber-900/40 rounded-2xl overflow-hidden bg-white dark:bg-gray-800/40 shadow-sm flex flex-col justify-between"
                                    >
                                        <div className="p-5 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                                        {label}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-mono text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                                                            Source: {archived.sourcePageId || 'page'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <Calendar size={12} /> {dateStr}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold uppercase">
                                                    Archived
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                                {archived.heading && (
                                                    <p className="line-clamp-1">
                                                        <strong>Heading:</strong> {archived.heading}
                                                    </p>
                                                )}
                                                {archived.subtitle && (
                                                    <p className="line-clamp-1">
                                                        <strong>Subtitle:</strong> {archived.subtitle}
                                                    </p>
                                                )}
                                                {archived.content && (
                                                    <p className="line-clamp-2 text-xs text-gray-400">
                                                        {archived.content.replace(/<[^>]*>/g, "")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-t border-amber-200/60 dark:border-amber-900/30 flex justify-between items-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 border-red-200 text-xs gap-1"
                                                onClick={() => handleDeleteArchived(archived.id, label)}
                                                disabled={deletingId === archived.id}
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </Button>

                                            <Button
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                                                onClick={() => handleRestoreArchivedToReusable(archived)}
                                            >
                                                <Undo2 size={14} />
                                                Move to Reusable
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 max-w-lg mx-auto">
                            <Archive className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg">No archived components yet</h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                                Whenever a section or component is archived from any page in the Content Manager or Home Page Manager, it is preserved here and in the Insert sidebar.
                            </p>
                        </div>
                    )
                )}
            </div>
        </>
    );
}
