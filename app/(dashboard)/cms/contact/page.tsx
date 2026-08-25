"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Eye, EyeOff, Save, Clock, MapPin, Trash2, Plus, Mail, Search } from 'lucide-react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SEOEditor from "@/components/form/SEOEditor";
import { useDialog } from "@/context/DialogContext";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

const DEFAULT_DATA = {
    enabled: true,
    hero: {
        title: "Contact Us",
        subtitle: "Get in Touch",
        description: "We're here to listen, support, and collaborate. Reach out to us today."
    },
    info: {
        address: "2 King Street West, Suite 100\nKitchener, Ontario N2G 1A3",
        appointment_only: true,
        hours: [
            { label: "Monday to Friday", value: "9 am to 3:30 pm", note: "(By Appointment Only)" },
            { label: "Saturday", value: "10 am to 2 pm", note: "(By Appointment Only)" }
        ],
        disclaimer: "Please note: Scheduled programs, consultations, training, counseling and outreach support may happen outside these office hours and at a different location. If you have any questions, please email or call us.",
        show_info: true
    },
    form_fields: [
        { id: 'name', label: 'Name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'phone', label: 'Phone Number', type: 'tel', required: false },
        { id: 'message', label: 'Message', type: 'textarea', required: true }
    ]
};
const DMLABS_CONTACT_DEFAULT = {
    enabled: true,
    hero: {
        title: "Let's build the future.",
        subtitle: "Collaborate With Us",
        description: "Whether you have a question about our services, AI governance, or want to discuss a new project, we'd love to hear from you."
    },
    info: {
        address: "Ontario, Canada (Remote-First Agency)",
        appointment_only: false,
        hours: [
            { label: "Monday to Friday", value: "9 am to 5 pm", note: "(EST)" }
        ],
        project_availability: {
            q1: false,
            q2: false,
            q3: true,
            q4: true
        },
        disclaimer: "Our team operates remotely and across various time zones to support our global mission-driven partners.",
        show_info: true
    },
    form_fields: [
        { id: 'name', label: 'Full Name', type: 'text', required: true },
        { id: 'email', label: 'Work Email', type: 'email', required: true },
        { id: 'phone', label: 'Phone Number', type: 'tel', required: false },
        { id: 'company', label: 'Company/Organization', type: 'text', required: false },
        { 
            id: 'service', 
            label: 'How can we help?', 
            type: 'radio', 
            required: true,
            options: ['AI Automation', 'Custom Web Development', 'Cloud Infrastructure', 'Strategic Branding', 'Managed IT Services', 'Other']
        },
        {
            id: 'budget',
            label: 'Estimated Budget',
            type: 'select',
            required: true,
            options: ['< $5,000', '$5,000 - $15,000', '$15,000 - $50,000', '$50,000+', 'Monthly Retainer']
        },
        {
            id: 'timeline',
            label: 'Project Timeline',
            type: 'select',
            required: true,
            options: ['Immediate (ASAP)', '1 - 3 Months', '3 - 6 Months', 'Flexible / Not Sure']
        },
        { id: 'message', label: 'The Brief / Challenge', type: 'textarea', required: true },
        { id: 'discovery', label: 'How did you hear about us?', type: 'text', required: false }
    ]
};

const AITASOL_CONTACT_DEFAULT = {
    enabled: true,
    hero: {
        title: "Contact Aitasol",
        subtitle: "Start Your Journey Today",
        description: "Have questions about studying abroad? Our expert counselors are ready to help you navigate your international education path."
    },
    info: {
        address: "123 Global Way, Suite 500\nEducation District, Toronto, ON",
        addresses: [
            { label: "Main Office (Canada)", value: "123 Global Way, Suite 500\nToronto, ON", phone: "+1 (416) 000-0000", whatsapp: "14160000000" },
            { label: "Local Office (Zimbabwe)", value: "20 McChlery Avenue South, Harare", phone: "+263 24 2000000", whatsapp: "263000000000" }
        ],
        appointment_only: true,
        hours: [
            { label: "Monday to Friday", value: "9 am to 6 pm", note: "(Walk-ins Welcome)" },
            { label: "Saturday", value: "10 am to 4 pm", note: "(Appointment Only)" }
        ],
        disclaimer: "For urgent inquiries regarding ongoing applications, please include your Reference ID in the subject.",
        show_info: true
    },
    form_fields: [
        { id: 'name', label: 'Full Name', type: 'text', required: true },
        { id: 'email', label: 'Email Address', type: 'email', required: true },
        { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
        { 
            id: 'destination', 
            label: 'Preferred Destination', 
            type: 'select', 
            required: true,
            options: ['Canada', 'UK', 'Australia', 'USA', 'Germany', 'Other']
        },
        { 
            id: 'program', 
            label: 'Interested Program', 
            type: 'text', 
            required: false 
        },
        { id: 'message', label: 'How can we help you?', type: 'textarea', required: true }
    ]
};

export default function ContactPageManager() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("info@kindmindsfamilywellness.org");
    const [sendgridApiKey, setSendgridApiKey] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => { loadContent(); }, [currentSite.id]);

    const loadContent = async () => {
        setLoading(true);
        try {
            // Fetch notification settings
            const settings = await FirestoreService.getSettings(currentSite.id, 'notifications');
            if (settings) {
                if (settings.recipient_email) setRecipientEmail(settings.recipient_email);
                if (settings.sendgrid_api_key) setSendgridApiKey(settings.sendgrid_api_key);
            } else if (currentSite.id === 'aitasol') {
                setRecipientEmail("info@aitasol.com");
            }

            const siteDefaults = currentSite.id === 'dmlabs' ? DMLABS_CONTACT_DEFAULT : (currentSite.id === 'aitasol' ? AITASOL_CONTACT_DEFAULT : DEFAULT_DATA);
            const data = await FirestoreService.getPageContent('contact', currentSite.id);

            const mergedContent = data ? {
                ...siteDefaults,
                ...data,
                hero: { ...siteDefaults.hero, ...(data.hero || {}) },
                info: {
                    ...siteDefaults.info,
                    ...(data.info || {}),
                    hours: data.info?.hours ?? siteDefaults.info.hours,
                },
                form_fields: (data.form_fields && data.form_fields.length > 0) ? data.form_fields : siteDefaults.form_fields
            } : siteDefaults;

            setContent(mergedContent);

            // Automatically seed the database if it was empty
            if (!data || !data.form_fields || data.form_fields.length === 0) {
                setTimeout(() => {
                    FirestoreService.savePageContent('contact', mergedContent, currentSite.id)
                        .catch(err => console.error('Failed auto-seed:', err));
                }, 1000);
            }
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
            await FirestoreService.savePageContent('contact', content, currentSite.id);
            await FirestoreService.saveSettings(currentSite.id, 'notifications', { 
                recipient_email: recipientEmail,
                sendgrid_api_key: sendgridApiKey
            });
            setSuccessMsg("Contact page and notification settings saved successfully!");
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

    const setInfo = (field: string, value: any) => {
        setContent((prev: any) => ({ ...prev, info: { ...prev.info, [field]: value } }));
    };

    const updateHour = (index: number, field: string, value: string) => {
        const newHours = [...content.info.hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setInfo('hours', newHours);
    };

    const addHour = () => {
        setInfo('hours', [...content.info.hours, { label: '', value: '', note: '' }]);
    };

    const removeHour = (index: number) => {
        setInfo('hours', content.info.hours.filter((_: any, i: number) => i !== index));
    };
    
    const updateAddress = (index: number, field: string, value: string) => {
        const newAddresses = [...(content.info.addresses || [])];
        newAddresses[index] = { ...newAddresses[index], [field]: value };
        setInfo('addresses', newAddresses);
    };

    const addAddress = () => {
        const newAddresses = [...(content.info.addresses || [])];
        if (newAddresses.length === 0 && content.info.address) {
            newAddresses.push({ label: 'Primary Location', value: content.info.address, phone: '', whatsapp: '' });
        }
        newAddresses.push({ label: '', value: '', phone: '', whatsapp: '' });
        setInfo('addresses', newAddresses);
    };

    const removeAddress = (index: number) => {
        setInfo('addresses', content.info.addresses.filter((_: any, i: number) => i !== index));
    };

    const handleSEOChange = (seoData: any) => {
        if (!content) return;
        setContent((prev: any) => ({ ...prev, seo: seoData }));
    };

    const addField = () => {
        const newField = { 
            id: `field_${Date.now()}`, 
            label: 'New Field', 
            type: 'text', 
            required: false,
            options: [] 
        };
        setContent((prev: any) => ({ ...prev, form_fields: [...(prev.form_fields || []), newField] }));
    };

    const updateField = (id: string, updates: any) => {
        setContent((prev: any) => ({
            ...prev,
            form_fields: prev.form_fields.map((f: any) => f.id === id ? { ...f, ...updates } : f)
        }));
    };

    const removeField = (id: string) => {
        setContent((prev: any) => ({
            ...prev,
            form_fields: prev.form_fields.filter((f: any) => f.id !== id)
        }));
    };

    if (loading) return <div className="p-6 text-gray-500">Loading contact settings...</div>;

    return (
        <>
            <PageMeta title="Contact Page Manager | Admin Portal" description="Manage the contact us page content" />
            <PageBreadcrumb pageTitle="Contact Page Manager" />

            <div className="p-6 max-w-4xl space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Contact Page Manager</h2>
                        <p className="text-sm text-gray-500">Update the address, hours, and hero section of the Contact Us page.</p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="contact" siteId={currentSite.id} />
                        <Button variant="outline" onClick={async () => { 
                            const siteDefaults = currentSite.id === 'dmlabs' ? DMLABS_CONTACT_DEFAULT : (currentSite.id === 'aitasol' ? AITASOL_CONTACT_DEFAULT : DEFAULT_DATA);
                            const isConfirmed = await confirm({
                                title: "Reset to Defaults",
                                message: "Are you sure you want to reset all content and form fields to agency defaults? This cannot be undone.",
                                variant: "warning",
                                confirmLabel: "Reset Content"
                            });
                            if (isConfirmed) setContent(siteDefaults); 
                        }}>
                            Reset to Defaults
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
                                <Input value={content.hero.subtitle} onChange={e => setHero('subtitle', e.target.value)} />
                            </div>
                            <div>
                                <Label>Main Title</Label>
                                <Input value={content.hero.title} onChange={e => setHero('title', e.target.value)} />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                                    rows={3}
                                    value={content.hero.description}
                                    onChange={e => setHero('description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address & Hours */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-500" /> Office Information
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-normal">{content.info.show_info ? 'Visible' : 'Hidden'}</span>
                                <button
                                    onClick={() => setInfo('show_info', !content.info.show_info)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${content.info.show_info ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${content.info.show_info ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <Label className="flex items-center justify-between">
                                    <span>Physical Addresses</span>
                                    <Button size="sm" variant="outline" onClick={addAddress}>
                                        <Plus className="w-4 h-4 mr-1" /> Add Address
                                    </Button>
                                </Label>

                                {(!content.info.addresses || content.info.addresses.length === 0) ? (
                                    <div>
                                        <textarea
                                            className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm font-mono"
                                            rows={3}
                                            value={content.info.address}
                                            onChange={e => setInfo('address', e.target.value)}
                                            placeholder="2 King Street West..."
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Single address mode. Add an address entry above to enable multiple addresses.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {content.info.addresses.map((addr: any, i: number) => (
                                            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 relative group">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1 mr-4">
                                                        <Label className="text-[10px] uppercase text-gray-400">Address Label</Label>
                                                        <Input value={addr.label} onChange={e => updateAddress(i, 'label', e.target.value)} placeholder="e.g. Local Office, Head Office" />
                                                    </div>
                                                    <button onClick={() => removeAddress(i)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity pt-6">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase text-gray-400">Address Details</Label>
                                                    <textarea
                                                        className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm font-mono"
                                                        rows={2}
                                                        value={addr.value}
                                                        onChange={e => updateAddress(i, 'value', e.target.value)}
                                                        placeholder="Street, City, Province..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-[10px] uppercase text-gray-400">Phone Number</Label>
                                                        <Input value={addr.phone} onChange={e => updateAddress(i, 'phone', e.target.value)} placeholder="+1 (000) 000-0000" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] uppercase text-gray-400">WhatsApp (Digits only)</Label>
                                                        <Input value={addr.whatsapp} onChange={e => updateAddress(i, 'whatsapp', e.target.value)} placeholder="14160000000" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                                <input
                                    type="checkbox"
                                    id="appointment-only"
                                    checked={content.info.appointment_only}
                                    onChange={e => setInfo('appointment_only', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <Label htmlFor="appointment-only" className="mb-0 cursor-pointer">Show "By Appointment Only" Badge</Label>
                            </div>

                            <div className="space-y-4 pt-2">
                                <Label className="flex items-center justify-between">
                                    <span>Office Hours</span>
                                    <Button size="sm" variant="outline" onClick={addHour}>
                                        <Plus className="w-4 h-4 mr-1" /> Add Entry
                                    </Button>
                                </Label>
                                
                                {content.info.hours.map((hour: any, i: number) => (
                                    <div key={i} className="flex gap-3 items-start p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 relative group">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                                            <div>
                                                <Label className="text-[10px] uppercase text-gray-400">Days</Label>
                                                <Input value={hour.label} onChange={e => updateHour(i, 'label', e.target.value)} placeholder="Mon-Fri" />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase text-gray-400">Time Range</Label>
                                                <Input value={hour.value} onChange={e => updateHour(i, 'value', e.target.value)} placeholder="9 am - 5 pm" />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase text-gray-400">Note (optional)</Label>
                                                <Input value={hour.note} onChange={e => updateHour(i, 'note', e.target.value)} placeholder="(Appointment Only)" />
                                            </div>
                                        </div>
                                        <button onClick={() => removeHour(i)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                             <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Label>Hours Disclaimer / Footer Note</Label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm italic"
                                    rows={3}
                                    value={content.info.disclaimer}
                                    onChange={e => setInfo('disclaimer', e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">This note appears below the office hours.</p>
                            </div>

                            {currentSite.id === 'dmlabs' && (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                                    <Label>Project Availability Status</Label>
                                    <div className="flex gap-4 mt-2">
                                        {['q1', 'q2', 'q3', 'q4'].map((q) => (
                                            <label key={q} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={content.info.project_availability?.[q] || false}
                                                    onChange={e => setInfo('project_availability', { ...content.info.project_availability, [q]: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                />
                                                <span className="text-sm uppercase font-bold text-gray-600 dark:text-gray-300">{q}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2">Check the quarters you are available to take new projects. It will show a green indicator on the contact form.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Form Builder */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-500" /> Contact Form Builder
                            </div>
                            <Button size="sm" variant="outline" onClick={addField}>
                                <Plus className="w-4 h-4 mr-1" /> Add Field
                            </Button>
                        </h3>
                        <div className="space-y-4">
                            {content.form_fields?.map((field: any, index: number) => (
                                <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                            <div>
                                                <Label className="text-[10px] uppercase">Label / Placeholder</Label>
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
                                                    <option value="select">Dropdown Select</option>
                                                    <option value="radio">Radio Options</option>
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

                                    {(field.type === 'select' || field.type === 'radio') && (
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <Label className="text-[10px] uppercase">Options (Comma separated)</Label>
                                            <Input 
                                                value={field.options?.join(', ') || ''} 
                                                onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                placeholder="Option 1, Option 2, Option 3"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Notification Settings */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" /> Notification Settings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Recipient Email Address</label>
                                <Input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="e.g. info@kindmindsfamilywellness.org"
                                />
                                <p className="text-xs text-gray-400">Where website contact form submissions are tracked.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">SendGrid API Key (Optional)</label>
                                <Input
                                    type="password"
                                    value={sendgridApiKey}
                                    onChange={(e) => setSendgridApiKey(e.target.value)}
                                    placeholder="SG.xxx..."
                                />
                                <p className="text-xs text-gray-400">Required to enable automated email notifications. Keep this secure.</p>
                            </div>
                        </div>
                    </div>

                    {/* Page Settings */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${content.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {content.enabled ? <Eye size={20} /> : <EyeOff size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">Page Online</h3>
                                    <p className="text-xs text-gray-500">Toggle whether the Contact page is publicly accessible.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setContent({ ...content, enabled: !content.enabled })}
                                className={`w-12 h-6 rounded-full relative transition-colors ${content.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${content.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} className="px-10">
                        {saving ? "Saving..." : "Save All Changes"}
                    </Button>
                </div>
            </div>
        </>
    );
}
