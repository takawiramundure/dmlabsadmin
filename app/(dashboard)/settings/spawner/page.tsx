"use client";

import React, { useState, useEffect } from 'react';
import { FirestoreService } from "@/services/firestore";
import { SITES, Site } from "@/config/sites";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Plus, Server, Copy, RefreshCw, Globe, Layers, Check } from 'lucide-react';

export default function TenantSpawner() {
    const [siteId, setSiteId] = useState('');
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('');
    const [description, setDescription] = useState('');
    const [databaseId, setDatabaseId] = useState('');
    const [blueprintId, setBlueprintId] = useState('kmfw');
    const [clonePages, setClonePages] = useState(true);
    const [cloneSettings, setCloneSettings] = useState(true);

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [existingSites, setExistingSites] = useState<Site[]>([]);

    useEffect(() => {
        loadExistingSites();
    }, []);

    const loadExistingSites = async () => {
        try {
            const list = await FirestoreService.getCustomSites();
            setExistingSites([...SITES, ...list]);
        } catch (e) {
            console.error("Failed to load custom sites list", e);
            setExistingSites(SITES);
        }
    };

    const handleSpawn = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');

        if (!siteId || !name || !domain) {
            setErrorMsg('Site ID, Name, and Domain are required fields.');
            return;
        }

        const cleanSiteId = siteId.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
        if (cleanSiteId !== siteId) {
            setErrorMsg('Site ID must be lowercase, alphanumeric, and may include hyphens only (e.g. client-web).');
            return;
        }

        const alreadyExists = existingSites.some(s => s.id === cleanSiteId);
        if (alreadyExists) {
            setErrorMsg(`A tenant with Site ID "${cleanSiteId}" already exists.`);
            return;
        }

        setLoading(true);
        try {
            // 1. Save new site registration to custom dynamic list in Firestore
            const newSite: Site = {
                id: cleanSiteId,
                name: name.trim(),
                domain: domain.trim(),
                description: description.trim() || undefined,
                databaseId: databaseId.trim() || undefined,
                usePrefix: false // clean dynamic tables by default
            };

            await FirestoreService.saveCustomSite(newSite);

            // 2. Perform cloning of blueprint documents
            await FirestoreService.cloneTenantData(blueprintId, cleanSiteId, {
                pages: clonePages,
                settings: cloneSettings
            });

            setSuccessMsg(`Site "${name}" (ID: ${cleanSiteId}) has been successfully cloned from "${blueprintId}". It will appear in your site switcher dropdown momentarily.`);
            
            // Clear inputs
            setSiteId('');
            setName('');
            setDomain('');
            setDescription('');
            setDatabaseId('');
            
            // Refresh list
            await loadExistingSites();
        } catch (error: any) {
            console.error("Spawning error:", error);
            setErrorMsg(error.message || 'Failed to spawn tenant. Please verify database connection rules.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="super_admin">
            <div className="space-y-6 mx-auto max-w-7xl p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-brand-500" size={28} />
                        Agency Blueprint & Tenant Cloner
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        1-Click site spawner to deploy pre-configured agency layouts, pages, and settings for new clients.
                    </p>
                </div>

                {successMsg && <Alert variant="success" title="Success" message={successMsg} />}
                {errorMsg && <Alert variant="error" title="Error" message={errorMsg} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column: Form (2 cols) */}
                    <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
                        <h3 className="font-bold text-gray-800 dark:text-white text-base mb-6 border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                            <Plus className="text-blue-500" size={18} />
                            Create & Configure New Tenant Site
                        </h3>

                        <form onSubmit={handleSpawn} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Site ID (Shortcode) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. client-web"
                                        value={siteId}
                                        onChange={(e) => setSiteId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-[10px] text-gray-400 block mt-1">
                                        Identifier used for Firestore document paths. Lowercase alphanumeric and hyphens only.
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Client/Site Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Kind Minds Wellness"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Custom Domain / Host *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. client.org or client-web.netlify.app"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Database ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. client-web-db (defaults to project principal)"
                                        value={databaseId}
                                        onChange={(e) => setDatabaseId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Description / Notes
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Enter additional details about this client deployment..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-4">
                                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                    Blueprint & Cloning Parameters
                                </h4>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                                        Select Source Blueprint Tenant
                                    </label>
                                    <select
                                        value={blueprintId}
                                        onChange={(e) => setBlueprintId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 rounded-lg text-sm text-gray-800 dark:text-white focus:outline-none"
                                    >
                                        {existingSites.map(site => (
                                            <option key={site.id} value={site.id}>{site.name} ({site.id})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={clonePages}
                                            onChange={(e) => setClonePages(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Replicate Pages & Layouts (to Drafts)
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cloneSettings}
                                            onChange={(e) => setCloneSettings(e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Replicate Site Configurations & Themes
                                        </span>
                                    </label>
                                </div>

                                <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-lg">
                                    💡 <strong>Draft Guard Enabled:</strong> All replicated pages are automatically placed in Draft Mode. Client admins will not see them on the live website until explicitly approved/published.
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Spawning & Seeding Datastore...
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        Spawn & Deploy Blueprint
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Right Column: Existing Sites list */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-800 dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                            <Server className="text-gray-500" size={18} />
                            Deployments ({existingSites.length})
                        </h3>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {existingSites.map((site) => (
                                <div key={site.id} className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-gray-800 dark:text-white">{site.name}</span>
                                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                            {site.id}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Globe size={12} />
                                        <span className="truncate">{site.domain}</span>
                                    </div>
                                    {site.databaseId && (
                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                                            <Check size={10} />
                                            Db: {site.databaseId}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
