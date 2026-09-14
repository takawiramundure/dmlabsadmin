"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ImagePicker from "@/components/form/ImagePicker";
import RichTextEditor from "@/components/form/RichTextEditor";
import Label from "@/components/form/Label";
import { Quote, User } from 'lucide-react';
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface FoundersMessageData {
    founderName: string;
    founderTitle: string;
    founderImage: string;
    tagline: string;
    body: string;
    closingLine: string;
    donateLink: string;
    servicesLink: string;
}

import { SEED_DATA } from "@/config/seedData";

const DEFAULT_DATA: FoundersMessageData = {
    founderName: 'Founder Name',
    founderTitle: 'Founding Director',
    founderImage: '',
    tagline: 'Empowering Our Community',
    body: `<p>Welcome to our community. Grounded in lived experience, we work to create safe and affirming spaces for all.</p>`,
    closingLine: 'In solidarity,',
    donateLink: '/donate',
    servicesLink: '/services',
};

const getFoundersDefaults = (siteId: string): FoundersMessageData => {
    const siteSeed = (SEED_DATA as any)[siteId]?.['founders-message'];
    if (siteSeed) {
        return {
            founderName: siteSeed.founderName || 'Founder',
            founderTitle: siteSeed.founderTitle || 'Founder',
            founderImage: siteSeed.founderImage || '',
            tagline: siteSeed.tagline || '',
            body: siteSeed.body || '',
            closingLine: siteSeed.closingLine || 'With care and purpose,',
            donateLink: siteSeed.donateLink || '/take-action',
            servicesLink: siteSeed.servicesLink || '/our-story',
        };
    }
    return DEFAULT_DATA;
};

const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white';
const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

export default function FoundersMessageManager() {
    const { currentSite } = useSite();
    const [data, setData] = useState<FoundersMessageData>(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        loadData();
    }, [currentSite?.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const defaults = getFoundersDefaults(currentSite.id);
            const doc = await FirestoreService.getPageContent('founders-message', currentSite.id);
            if (doc && Object.keys(doc).length > 0) {
                setData({ ...defaults, ...doc });
            } else {
                setData(defaults);
            }
        } catch (e) {
            console.error('Error loading Founder\'s Message:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await FirestoreService.savePageContent('founders-message', data, currentSite.id);
            setStatus({ type: 'success', msg: "Founder's Message saved successfully!" });
        } catch (e) {
            console.error('Error saving:', e);
            setStatus({ type: 'error', msg: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const update = (field: keyof FoundersMessageData, value: string) =>
        setData(prev => ({ ...prev, [field]: value }));

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
    }

    return (
        <>
            <PageMeta title="Founder's Message Manager | Admin" description="Edit the Founder's Message page content" />
            <PageBreadcrumb pageTitle="Founder's Message" />

            <div className="p-6 space-y-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Quote className="w-6 h-6 text-primary" />
                            Founder's Message
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Edit the message displayed on the /about/founders-message page.
                        </p>
                    </div>
                    <VersionHistoryManager documentId="founders-message" siteId={currentSite.id} />
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {status && (
                    <Alert
                        variant={status.type}
                        title={status.type === 'success' ? 'Saved!' : 'Error'}
                        message={status.msg}
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left: Founder Info */}
                    <div className="space-y-5">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">
                            <h2 className="text-base font-semibold text-gray-700 dark:text-white border-b pb-3 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                Founder Details
                            </h2>

                            <div>
                                <label className={labelClass}>Founder Name</label>
                                <input className={inputClass} value={data.founderName} onChange={e => update('founderName', e.target.value)} placeholder="Ajirioghene Evi" />
                            </div>

                            <div>
                                <label className={labelClass}>Title / Role</label>
                                <input className={inputClass} value={data.founderTitle} onChange={e => update('founderTitle', e.target.value)} placeholder="Founding Director" />
                            </div>

                            <div>
                                <label className={labelClass}>Tagline / Subtitle <span className="font-normal text-gray-400">(shown under portrait)</span></label>
                                <input className={inputClass} value={data.tagline} onChange={e => update('tagline', e.target.value)} placeholder="Celebrating 5 Years of Kind Minds Family Wellness" />
                            </div>

                            <div>
                                <label className={labelClass}>Closing Line</label>
                                <input className={inputClass} value={data.closingLine} onChange={e => update('closingLine', e.target.value)} placeholder="In solidarity," />
                            </div>

                            <div>
                                <label className={labelClass}>Donate Page Link</label>
                                <input className={inputClass} value={data.donateLink} onChange={e => update('donateLink', e.target.value)} placeholder="/donate" />
                            </div>

                            <div>
                                <label className={labelClass}>Services Page Link</label>
                                <input className={inputClass} value={data.servicesLink} onChange={e => update('servicesLink', e.target.value)} placeholder="/services" />
                            </div>
                        </div>

                        {/* Portrait */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                            <h2 className="text-base font-semibold text-gray-700 dark:text-white border-b pb-3 mb-5">
                                Founder Portrait
                            </h2>
                            <ImagePicker
                                value={data.founderImage}
                                onChange={url => update('founderImage', url)}
                                placeholder="Upload or select founder portrait..."
                                helpText="Recommended: portrait orientation (4:5 ratio). The image will appear on the left side of the page and in the signature block."
                            />
                        </div>
                    </div>

                    {/* Right: Message Body */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h2 className="text-base font-semibold text-gray-700 dark:text-white border-b pb-3 mb-5 flex items-center gap-2">
                            <Quote className="w-4 h-4 text-primary" />
                            Message Body
                        </h2>
                        <p className="text-xs text-gray-400 mb-4">
                            Each double newline (blank line between paragraphs) creates a separate paragraph on the page.
                        </p>
                        <Label>Message Content</Label>
                        <RichTextEditor
                            label="Message Content"
                            value={data.body}
                            onChange={val => update('body', val)}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>
        </>
    );
}
