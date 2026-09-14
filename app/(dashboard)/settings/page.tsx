"use client";

import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useDialog } from "@/context/DialogContext";

export default function SystemSettings() {
    const { confirm } = useDialog();
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // Using 'system_global' as the siteId for CMS-wide settings
            const data = await FirestoreService.getSettings('system_global', 'config');
            if (data) {
                setSettings(data);
            } else {
                // Initialize with defaults if needed
                setSettings({ 
                    cmsName: "Digital Maples Labs CMS",
                    cmsVersion: "1.3.0",
                    globalMaintenanceMode: false,
                    adminSupportEmail: "admin@digitalmaples.com"
                });
            }
        } catch (error) {
            console.error("Error fetching system settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // If maintenance mode is being enabled, ask for confirmation
        if (settings.globalMaintenanceMode) {
            const isConfirmed = await confirm({
                title: "Enable Global Maintenance",
                message: "This will put ALL sites in maintenance mode immediately. Are you sure you want to continue?",
                variant: "danger",
                confirmLabel: "Enable Global Maintenance"
            });
            if (!isConfirmed) return;
        }

        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            await FirestoreService.saveSettings('system_global', 'config', settings);
            setMessage({ type: "success", text: "Global system settings saved successfully!" });
        } catch (error) {
            console.error("Error saving global settings:", error);
            setMessage({ type: "error", text: "Failed to save system settings." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-gray-800 dark:text-white">Loading system settings...</div>;

    return (
        <>
            <PageMeta
                title="System Settings | Digital Maples Labs CMS"
                description="Manage global CMS-wide settings"
            />
            <PageBreadcrumb pageTitle="Global System Settings" />
            <div className="mx-auto max-w-270">
                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-1 gap-8">
                        {/* CMS Identity */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">
                                    CMS Identity & Versioning
                                </h3>
                            </div>
                            <div className="p-7">
                                <div className="mb-5.5">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        CMS Branding Name
                                    </label>
                                    <input
                                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                        type="text"
                                        value={settings.cmsName || ""}
                                        onChange={(e) => setSettings({ ...settings, cmsName: e.target.value })}
                                        placeholder="Digital Maples Labs CMS"
                                    />
                                </div>

                                <div className="mb-5.5">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        System Version
                                    </label>
                                    <input
                                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                        type="text"
                                        value={settings.cmsVersion || ""}
                                        onChange={(e) => setSettings({ ...settings, cmsVersion: e.target.value })}
                                        placeholder="1.x.x"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Global Controls */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">
                                    Global Controls & Support
                                </h3>
                            </div>
                            <div className="p-7">
                                <div className="mb-5.5">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Global Maintenance Mode (Overrides all sites)
                                    </label>
                                    <select
                                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                        value={settings.globalMaintenanceMode ? "true" : "false"}
                                        onChange={(e) => setSettings({ ...settings, globalMaintenanceMode: e.target.value === "true" })}
                                    >
                                        <option value="false">Live</option>
                                        <option value="true">Global Maintenance Enabled</option>
                                    </select>
                                    <p className="mt-2 text-xs text-red-500 font-medium">Use with caution: This will set all tenant sites to maintenance mode.</p>
                                </div>

                                <div className="mb-5.5">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Admin Support Contact
                                    </label>
                                    <input
                                        className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                                        type="email"
                                        value={settings.adminSupportEmail || ""}
                                        onChange={(e) => setSettings({ ...settings, adminSupportEmail: e.target.value })}
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4.5">
                            {message.text && (
                                <div className={`flex items-center ${message.type === "success" ? "text-meta-3" : "text-meta-1"}`}>
                                    {message.text}
                                </div>
                            )}
                            <button
                                className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-50"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save System Config"}
                            </button>
                        </div>
                    </div >
                </form >
            </div >
        </>
    );
}
