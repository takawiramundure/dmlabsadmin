"use client";

import React, { use, useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Eye, Save, Plus, Trash2, Mail, Webhook, Database, Sparkles, Send, Settings } from 'lucide-react';
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

const DEFAULT_DATA = {
    title: "New Form",
    subtitle: "",
    description: "",
    submit_text: "Submit",
    success_message: "Thank you! Your submission has been received.",
    form_fields: [
        { id: 'name', label: 'Full Name', type: 'text', required: true },
        { id: 'email', label: 'Email Address', type: 'email', required: true }
    ]
};

const DEFAULT_WORKFLOWS = [
    { id: 'database', type: 'database', enabled: true, title: 'Store in Lead Database', desc: 'Saves leads locally into the site lead collections for internal CSV exports.', config: { collection: 'leads' } },
    { id: 'email', type: 'email', enabled: true, title: 'Send Email Notification', desc: 'Forwards form inputs immediately to the notification recipient.', config: { template: 'default' } },
    { id: 'webhook', type: 'webhook', enabled: false, title: 'Trigger Webhook URL', desc: 'POSTs submission JSON payload to external webhooks (Zapier, Slack, CRM).', config: { url: '' } },
    { id: 'auto_responder', type: 'auto_responder', enabled: false, title: 'Send Auto-Responder Email', desc: 'Autosends a personalized thank-you message to the submitter.', config: { subject: 'Thank you for your submission!', body: 'Hello,\n\nWe received your message and will get back to you soon!' } }
];

export default function DynamicFormEditor({ params }: { params: Promise<{ formId: string }> }) {
    const resolvedParams = use(params);
    const formId = resolvedParams.formId;
    
    const { currentSite } = useSite();
    const [content, setContent] = useState<any>(null);
    const [workflows, setWorkflows] = useState<any[]>(DEFAULT_WORKFLOWS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => { loadContent(); }, [currentSite.id, formId]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const settings = await FirestoreService.getSettings(currentSite.id, 'notifications');
            if (settings && settings.recipient_email) {
                setRecipientEmail(settings.recipient_email);
            }

            const data = await FirestoreService.getForm(currentSite.id, formId);
            setContent(data || DEFAULT_DATA);
            setWorkflows(data?.workflows || DEFAULT_WORKFLOWS);
            if (data?.recipient_email) {
                setRecipientEmail(data.recipient_email);
            }
        } catch (err: any) {
            console.error(err);
            setError("Failed to load content.");
            setContent(DEFAULT_DATA);
            setWorkflows(DEFAULT_WORKFLOWS);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        setSaving(true);
        setSuccessMsg(""); setError("");
        try {
            await FirestoreService.saveForm(currentSite.id, formId, {
                ...content,
                recipient_email: recipientEmail,
                workflows: workflows
            });
            setSuccessMsg("Form and workflow settings saved successfully!");
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

    return (
        <>
            <PageMeta title="Form Editor | Admin Portal" description="Manage dynamic form" />
            
            <div className="p-6 max-w-4xl space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Form Editor: {formId}</h2>
                        <p className="text-sm text-gray-500">Update the fields and text for this dynamic form.</p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="forms" siteId={currentSite.id} />
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
 
                    {/* Custom Workflow Automation Pipeline */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-brand-500" /> Custom Workflow Automation
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Configure lead submission routing actions in real-time without writing code.</p>
                        </div>

                        <div className="space-y-4">
                            {workflows.map((flow: any) => {
                                const Icon = flow.type === 'database' ? Database : 
                                             flow.type === 'webhook' ? Webhook : 
                                             flow.type === 'auto_responder' ? Send : Mail;
                                return (
                                    <div key={flow.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-150 dark:border-gray-800 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                                                    <Icon size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">{flow.title}</h4>
                                                    <p className="text-xs text-gray-400">{flow.desc}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Enable Toggle Switch */}
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={flow.enabled}
                                                        onChange={(e) => {
                                                            const isChecked = e.target.checked;
                                                            setWorkflows(prev => prev.map(f => f.id === flow.id ? { ...f, enabled: isChecked } : f));
                                                        }}
                                                    />
                                                    <div className={`block w-9 h-5 rounded-full transition-colors ${flow.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                                                    <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${flow.enabled ? 'transform translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>

                                        {flow.enabled && (
                                            <div className="border-t border-gray-150 dark:border-gray-800/60 pt-4 space-y-3 animate-in fade-in slide-in-from-top-1">
                                                {flow.type === 'webhook' && (
                                                    <div>
                                                        <Label>Webhook Payload Target URL</Label>
                                                        <Input
                                                            type="url"
                                                            placeholder="https://hooks.zapier.com/hooks/catch/..."
                                                            value={flow.config.url || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setWorkflows(prev => prev.map(f => f.id === flow.id ? { ...f, config: { ...f.config, url: val } } : f));
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {flow.type === 'database' && (
                                                    <div>
                                                        <Label>Destination Collection Path</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="leads"
                                                            value={flow.config.collection || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setWorkflows(prev => prev.map(f => f.id === flow.id ? { ...f, config: { ...f.config, collection: val } } : f));
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {flow.type === 'auto_responder' && (
                                                    <div className="grid gap-3">
                                                        <div>
                                                            <Label>Reply Subject Line</Label>
                                                            <Input
                                                                placeholder="e.g. Thanks for your inquiry!"
                                                                value={flow.config.subject || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setWorkflows(prev => prev.map(f => f.id === flow.id ? { ...f, config: { ...f.config, subject: val } } : f));
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Reply Body Text</Label>
                                                            <textarea
                                                                rows={3}
                                                                placeholder="Personalize with {{name}} fields..."
                                                                value={flow.config.body || ''}
                                                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setWorkflows(prev => prev.map(f => f.id === flow.id ? { ...f, config: { ...f.config, body: val } } : f));
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
