"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Eye, Save, Search } from 'lucide-react';
import SEOEditor from "@/components/form/SEOEditor";
import RichTextEditor from "@/components/form/RichTextEditor";

const DEFAULT_DATA = {
    enabled: true,
    hero: {
        title: "Join Our Team",
        subtitle: "Careers at PHCG",
        description: "We are always looking for passionate professionals to join our team."
    },
    content: "<h2>Why Work With Us?</h2><p>Share your story here...</p>"
};

export default function CareersPageManager() {
    const { currentSite } = useSite();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => { loadContent(); }, [currentSite.id]);

    const loadContent = async () => {
        setLoading(true);
        setError("");
        try {
            const pageDocId = currentSite.id === 'kmfw' ? 'careers' : 'career';
            const data = await FirestoreService.getPageContent(pageDocId, currentSite.id);
            setContent(data || DEFAULT_DATA);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load content.");
            setContent(DEFAULT_DATA);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        setSaving(true);
        setSuccessMsg(""); setError("");
        try {
            const pageDocId = currentSite.id === 'kmfw' ? 'careers' : 'career';
            await FirestoreService.savePageContent(pageDocId, content, currentSite.id);
            setSuccessMsg("Careers page saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            console.error(err);
            setError("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const setHero = (field: string, value: string) => {
        setContent((prev: any) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
    };

    const handleSEOChange = (seoData: any) => {
        if (!content) return;
        setContent((prev: any) => ({ ...prev, seo: seoData }));
    };

    if (loading) return <div className="p-6 text-gray-500">Loading careers settings...</div>;

    return (
        <>
            <PageMeta title="Careers Page Manager | Admin Portal" description="Manage the careers page content" />
            
            <div className="p-6 max-w-4xl space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Careers Page Manager</h2>
                        <p className="text-sm text-gray-500">Update the hero section and content of the Careers page.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => {
                            setContent(JSON.parse(JSON.stringify(DEFAULT_DATA)));
                            setSuccessMsg("Default data loaded into editor!");
                            setTimeout(() => setSuccessMsg(""), 3000);
                        }} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            🌱 Seed Default Data
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save Content"}
                        </Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Saved!" message={successMsg} /></div>}

                <div className="space-y-6">
                    {/* SEO Section */}
                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                            <Search className="w-5 h-5 text-indigo-500" /> Search Engine Optimization
                        </h3>
                        <SEOEditor 
                            data={content?.seo || {}} 
                            onChange={handleSEOChange}
                        />
                    </div>
                    {/* Hero Section */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-500" /> Hero Section
                        </h3>
                        <div className="grid gap-4">
                            <div>
                                <Label>Tagline (Subtitle)</Label>
                                <Input value={content?.hero?.subtitle || ""} onChange={e => setHero('subtitle', e.target.value)} />
                            </div>
                            <div>
                                <Label>Main Title</Label>
                                <Input value={content?.hero?.title || ""} onChange={e => setHero('title', e.target.value)} />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                                    rows={3}
                                    value={content?.hero?.description || ""}
                                    onChange={e => setHero('description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Page Content</h3>
                        <RichTextEditor
                            label=""
                            value={content?.content || ""}
                            onChange={val => setContent((prev: any) => ({ ...prev, content: val }))}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
