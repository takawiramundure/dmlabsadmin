"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Eye, Save, Plus, Trash2, Mail } from 'lucide-react';
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

const DEFAULT_DATA = {
    enabled: true,
    title: "Join Our Care Team",
    subtitle: "Careers",
    description: "Fill out the application form below and our HR team will get back to you.",
    submit_text: "Submit Application",
    success_message: "Thank you! Your application has been submitted successfully.",
    form_fields: [
        { id: 'name', label: 'Full Name', type: 'text', required: true },
        { id: 'email', label: 'Email Address', type: 'email', required: true },
        { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
        { id: 'startDate', label: 'Start Date', type: 'date', required: true },
        { id: 'legallyAbleToWork', label: 'Legally Able to Work in Canada?', type: 'select', required: true },
        { id: 'qualifications', label: 'Highest Qualifications', type: 'select', required: true },
        { id: 'address', label: 'Current Address', type: 'text', required: true }
    ]
};

export default function ApplicationFormManager() {
    const { currentSite } = useSite();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("info@privatehomecareguru.com");
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
            // Fetch notification settings
            const settings = await FirestoreService.getSettings(currentSite.id, 'notifications');
            if (settings && settings.recipient_email) {
                setRecipientEmail(settings.recipient_email);
            }

            const data = await FirestoreService.getPageContent('application_form', currentSite.id);
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
            await FirestoreService.savePageContent('application_form', content, currentSite.id);
            await FirestoreService.saveSettings(currentSite.id, 'notifications', { 
                recipient_email: recipientEmail
            });
            setSuccessMsg("Form settings saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            console.error(err);
            setError("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (id: string, updates: any) => {
        setContent((prev: any) => ({
            ...prev,
            form_fields: prev.form_fields.map((f: any) => f.id === id ? { ...f, ...updates } : f)
        }));
    };

    const addField = () => {
        const newField = { 
            id: `field_${Date.now()}`, 
            label: 'New Field', 
            type: 'text', 
            required: false 
        };
        setContent((prev: any) => ({ ...prev, form_fields: [...(prev.form_fields || []), newField] }));
    };

    const removeField = (id: string) => {
        setContent((prev: any) => ({
            ...prev,
            form_fields: prev.form_fields.filter((f: any) => f.id !== id)
        }));
    };

    if (loading) return <div className="p-6 text-gray-500">Loading form settings...</div>;

    if (currentSite.id !== 'phcg') {
        return <div className="p-6 text-gray-500">This editor is currently only configured for PHCG.</div>;
    }

    return (
        <>
            <PageMeta title="Application Form Manager | Admin Portal" description="Manage the global application form" />
            
            <div className="p-6 max-w-4xl space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Global Application Form Manager</h2>
                        <p className="text-sm text-gray-500">Update the fields and text for the application form used across the site.</p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="application_form" siteId={currentSite.id} />
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Saved!" message={successMsg} /></div>}

                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-500" /> Form Header
                        </h3>
                        <div className="grid gap-4">
                            <div>
                                <Label>Tagline (Subtitle)</Label>
                                <Input value={content.subtitle} onChange={e => setContent({...content, subtitle: e.target.value})} />
                            </div>
                            <div>
                                <Label>Main Title</Label>
                                <Input value={content.title} onChange={e => setContent({...content, title: e.target.value})} />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                                    rows={2}
                                    value={content.description}
                                    onChange={e => setContent({...content, description: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Builder */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-500" /> Form Fields
                            </h3>
                            <Button size="sm" variant="outline" onClick={addField}>
                                <Plus className="w-4 h-4 mr-1" /> Add Field
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {content.form_fields?.map((field: any) => (
                                <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                            <div>
                                                <Label className="text-[10px] uppercase">Label</Label>
                                                <Input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase">Field Type</Label>
                                                <select 
                                                    value={field.type} 
                                                    onChange={e => updateField(field.id, { type: e.target.value })}
                                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                                                >
                                                    <option value="text">Short Text</option>
                                                    <option value="email">Email Address</option>
                                                    <option value="tel">Phone Number</option>
                                                    <option value="textarea">Large Textarea</option>
                                                    <option value="date">Date Picker</option>
                                                    <option value="select">Dropdown Menu</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-4 h-full pt-6">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={field.required} 
                                                        onChange={e => updateField(field.id, { required: e.target.checked })}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Required</span>
                                                </label>
                                                <button onClick={() => removeField(field.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Submission Settings</h3>
                        <div className="grid gap-4">
                            <div>
                                <Label>Submit Button Text</Label>
                                <Input value={content.submit_text} onChange={e => setContent({...content, submit_text: e.target.value})} />
                            </div>
                            <div>
                                <Label>Success Message</Label>
                                <Input value={content.success_message} onChange={e => setContent({...content, success_message: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" /> Notification Settings
                        </h3>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Recipient Email Address</label>
                            <Input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="e.g. info@privatehomecareguru.com"
                            />
                            <p className="text-xs text-gray-400">Where form submissions will be sent.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
