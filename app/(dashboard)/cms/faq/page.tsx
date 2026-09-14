"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Eye, Save, Search, Plus, Trash2 } from 'lucide-react';
import SEOEditor from "@/components/form/SEOEditor";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

const DEFAULT_DATA = {
    enabled: true,
    hero: {
        title: "Frequently Asked Questions",
        subtitle: "Have Questions?",
        description: "Find answers to common questions about our services."
    },
    faqs: [
        { question: "What services do you offer?", answer: "We offer personalized senior care, in-home nursing care, caregiver relief, and more." },
        { question: "How do I get started?", answer: "You can book a free consultation by filling out the form on our home page or contact page." }
    ]
};

export default function FAQPageManager() {
    const { currentSite } = useSite();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => { loadContent(); }, [currentSite.id]);

    const loadContent = async () => {
        if (currentSite.id !== 'phcg') {
            setError("This editor is currently only configured for PHCG.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await FirestoreService.getPageContent('faq', currentSite.id);
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
            await FirestoreService.savePageContent('faq', content, currentSite.id);
            setSuccessMsg("FAQ page saved successfully!");
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

    const addFAQ = () => {
        setContent((prev: any) => ({ ...prev, faqs: [...(prev.faqs || []), { question: "", answer: "" }] }));
    };

    const updateFAQ = (index: number, field: string, value: string) => {
        const newFAQs = [...(content.faqs || [])];
        newFAQs[index] = { ...newFAQs[index], [field]: value };
        setContent((prev: any) => ({ ...prev, faqs: newFAQs }));
    };

    const removeFAQ = (index: number) => {
        setContent((prev: any) => ({ ...prev, faqs: content.faqs.filter((_: any, i: number) => i !== index) }));
    };

    if (loading) return <div className="p-6 text-gray-500">Loading FAQ settings...</div>;

    if (currentSite.id !== 'phcg') {
        return <div className="p-6 text-gray-500">This editor is currently only configured for PHCG.</div>;
    }

    return (
        <>
            <PageMeta title="FAQ Page Manager | Admin Portal" description="Manage the FAQ page content" />
            
            <div className="p-6 max-w-4xl space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">FAQ Page Manager</h2>
                        <p className="text-sm text-gray-500">Update the hero section and FAQ list of the FAQ page.</p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="faq" siteId={currentSite.id} />
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

                    {/* FAQs Section */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">FAQs List</h3>
                            <Button size="sm" variant="outline" onClick={addFAQ}>
                                <Plus className="w-4 h-4 mr-1" /> Add FAQ
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {content?.faqs?.map((faq: any, i: number) => (
                                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 relative group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 mr-4">
                                            <Label className="text-[10px] uppercase text-gray-400">Question</Label>
                                            <Input value={faq.question} onChange={e => updateFAQ(i, 'question', e.target.value)} placeholder="Enter question..." />
                                        </div>
                                        <button onClick={() => removeFAQ(i)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase text-gray-400">Answer</Label>
                                        <textarea
                                            className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                                            rows={2}
                                            value={faq.answer}
                                            onChange={e => updateFAQ(i, 'answer', e.target.value)}
                                            placeholder="Enter answer..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
