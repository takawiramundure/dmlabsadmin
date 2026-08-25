"use client";

import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import { SEED_DATA } from "@/config/seedData";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

export default function CrisisManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (currentSite?.id) {
            loadContent();
        }
    }, [currentSite]);

    const loadContent = async () => {
        setLoading(true);
        try {
            // Using a specific ID key 'crisis_support' for this page/section
            const data: any = await FirestoreService.getPageContent("crisis_support", currentSite.id);
            if (data?.resources) {
                setResources(data.resources);
            } else {
                setResources([]);
            }
        } catch (error) {
            console.error("Error loading content:", error);
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
            await FirestoreService.savePageContent("crisis_support", { resources }, currentSite.id);
            setSuccessMsg("Changes saved successfully!");
        } catch (error) {
            console.error("Error saving content:", error);
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const addResource = () => {
        setResources([...resources, {
            id: Date.now().toString(),
            name: "New Crisis Service",
            link: "https://",
            color: "#000000",
            isActive: true
        }]);
    };

    const updateResource = (index: number, field: string, value: any) => {
        const newResources = [...resources];
        newResources[index] = { ...newResources[index], [field]: value };
        setResources(newResources);
    };

    const deleteResource = async (index: number) => {
        const isConfirmed = await confirm({
            title: "Delete Crisis Card",
            message: "Are you sure you want to delete this resource card?",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (isConfirmed) {
            const newResources = resources.filter((_, i) => i !== index);
            setResources(newResources);
        }
    };

    const seedDefaults = async () => {
        const isConfirmed = await confirm({
            title: "Restore Default Crisis Data",
            message: "This will overwrite your current items with default data. Are you sure?",
            variant: "warning",
            confirmLabel: "Restore Defaults"
        });

        if (isConfirmed) {
            const siteData = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
            // @ts-ignore
            if (siteData?.crisis_support?.resources) {
                // @ts-ignore
                const defaults = siteData.crisis_support.resources;
                setResources(defaults);
                // Auto-save
                FirestoreService.savePageContent("crisis_support", { resources: defaults } as any, currentSite.id)
                    .then(() => setSuccessMsg("Default data restored and saved."))
                    .catch(() => setError("Failed to save seed data."));
            } else {
                setError("No default seed data found for this site.");
            }
        }
    }

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <PageMeta title="Crisis Support Manager | NSPC Admin" description="Manage Crisis Support Resources" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">24/7 Crisis Support Manager</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage the crisis support cards displayed on the website.</p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="crisis_support" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={seedDefaults}>
                            Seed Defaults
                        </Button>
                        <Button variant="outline" onClick={addResource}>
                            + Add Card
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <div className="grid grid-cols-1 gap-6">
                    {resources.map((item, index) => (
                        <div key={item.id || index} className="overflow-hidden border rounded-xl" style={{ borderLeft: `4px solid ${item.color}` }}>
                            <div className="bg-gray-50 border-b flex flex-row items-center justify-between py-3 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded border shadow-sm" style={{ backgroundColor: item.color }}></div>
                                    <span className="font-medium text-gray-700">Card #{index + 1}</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => deleteResource(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200">
                                    Delete
                                </Button>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                                <div className="space-y-3">
                                    <Label>Service Name</Label>
                                    <Input
                                        value={item.name}
                                        onChange={(e) => updateResource(index, "name", e.target.value)}
                                        placeholder="e.g. Hope for Wellness"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Website Link</Label>
                                    <Input
                                        value={item.link}
                                        onChange={(e) => updateResource(index, "link", e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                    <Label>Card Color (Hex)</Label>
                                    <div className="flex gap-3 items-center">
                                        <div className="relative flex-1">
                                            <Input
                                                className="uppercase font-mono"
                                                value={item.color}
                                                onChange={(e) => updateResource(index, "color", e.target.value)}
                                                placeholder="#RRGGBB"
                                            />
                                        </div>
                                        <input
                                            type="color"
                                            value={item.color}
                                            onChange={(e) => updateResource(index, "color", e.target.value)}
                                            className="h-10 w-20 rounded cursor-pointer border p-1"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This color applies to the card background on the website.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {resources.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 mb-4">No crisis resources found.</p>
                            <Button requireSuperAdmin variant="outline" onClick={seedDefaults}>Load Default Data</Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
