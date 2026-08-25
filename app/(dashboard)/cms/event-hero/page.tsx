"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ImagePicker from "@/components/form/ImagePicker";
import { Eye, EyeOff, Zap, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface EventHeroData {
    enabled: boolean;
    title: string;
    subtitle: string;
    badgeText: string;
    eventDate: string;         // ISO e.g. "2026-05-17T19:00:00"
    eventDateLabel: string;    // Display e.g. "May 17, 2026 at 7:00 PM"
    location: string;
    backgroundImage: string;
    primaryCta: string;
    primaryCtaLink: string;
    ticketCta: string;
    ticketCtaLink: string;
    showTicketCta?: boolean;
}

const DEFAULT_EVENT_HERO: EventHeroData = {
    enabled: false,
    title: 'Black Excellence Awards Gala 2026',
    subtitle: 'A night of prestige, inspiration, and unity. Join us as we honour the trailblazers, innovators, and pillars of our community who are unapologetically shaping the future.',
    badgeText: 'Upcoming Major Event',
    eventDate: '2026-05-17T19:00:00',
    eventDateLabel: 'May 17, 2026 at 7:00 PM',
    location: 'Bingemans Conference Centre, Kitchener',
    backgroundImage: '',
    primaryCta: 'Explore The Gala',
    primaryCtaLink: '/impact/events/black-excellence-gala',
    ticketCta: 'Get Your Tickets',
    ticketCtaLink: 'https://www.eventbrite.ca/e/black-excellence-awards-gala-tickets-1977921994931',
    showTicketCta: true,
};

const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white';
const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

export default function EventHeroManager() {
    const { currentSite } = useSite();
    const [data, setData] = useState<EventHeroData>(DEFAULT_EVENT_HERO);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        loadData();
    }, [currentSite?.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const doc = await FirestoreService.getPageContent('event_hero', currentSite.id);
            if (doc) {
                setData({ ...DEFAULT_EVENT_HERO, ...doc });
            }
        } catch (e) {
            console.error('Error loading Event Hero:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await FirestoreService.savePageContent('event_hero', data, currentSite.id);
            setStatus({ type: 'success', msg: data.enabled ? 'Event Hero is now LIVE on the homepage!' : 'Event Hero settings saved (currently hidden from homepage).' });
        } catch (e) {
            console.error('Error saving Event Hero:', e);
            setStatus({ type: 'error', msg: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const update = (field: keyof EventHeroData, value: any) =>
        setData(prev => ({ ...prev, [field]: value }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                Loading Event Hero settings...
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Event Hero Manager | KMFW Admin" description="Manage the homepage Event Hero for the Black Excellence Gala" />
            <PageBreadcrumb pageTitle="Event Hero Manager" />

            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-500" />
                            Event Hero – Homepage Takeover
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            When enabled, this replaces the main hero on the homepage with a full-screen event announcement including a live countdown timer.
                        </p>
                    </div>
                    <VersionHistoryManager documentId="event_hero" siteId={currentSite.id} />
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

                {/* Enable / Disable Toggle — The Big Switch */}
                <div className={`rounded-2xl border-2 p-6 transition-all ${data.enabled ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.enabled ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                {data.enabled ? <Eye className="w-6 h-6 text-black" /> : <EyeOff className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 dark:text-white">
                                    Event Hero Status: {' '}
                                    <span className={data.enabled ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}>
                                        {data.enabled ? '🟡 LIVE on Homepage' : '⚫ Hidden'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {data.enabled
                                        ? 'The Event Hero is showing on the homepage. The regular hero and Gala Promo banner are hidden.'
                                        : 'The regular hero and Gala Promo are showing. Enable to display the Event Hero instead.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => update('enabled', !data.enabled)}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 ${data.enabled ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'}`}
                            role="switch"
                            aria-checked={data.enabled}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${data.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {data.enabled && (
                        <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-700">
                            <Link href="http://localhost:5174" target="_blank" className="inline-flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 font-medium hover:underline">
                                <ExternalLink className="w-4 h-4" />
                                Preview on Live Site →
                            </Link>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left Column — Content */}
                    <div className="space-y-5">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">
                            <h2 className="text-base font-semibold text-gray-700 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
                                Hero Content
                            </h2>

                            <div>
                                <label className={labelClass}>Badge Text <span className="font-normal text-gray-400">(small pill above title)</span></label>
                                <input className={inputClass} value={data.badgeText} onChange={e => update('badgeText', e.target.value)} placeholder="Upcoming Major Event" />
                            </div>

                            <div>
                                <label className={labelClass}>Event Title</label>
                                <input className={inputClass} value={data.title} onChange={e => update('title', e.target.value)} placeholder="Black Excellence Awards Gala 2026" />
                                <p className="text-xs text-gray-400 mt-1">Words: Black, Excellence, Awards, Gala are automatically highlighted in gold.</p>
                            </div>

                            <div>
                                <label className={labelClass}>Subtitle / Description</label>
                                <textarea
                                    className={`${inputClass} resize-none`}
                                    rows={3}
                                    value={data.subtitle}
                                    onChange={e => update('subtitle', e.target.value)}
                                    placeholder="A night of prestige, inspiration, and unity..."
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Background Image</label>
                                <ImagePicker
                                    value={data.backgroundImage}
                                    onChange={url => update('backgroundImage', url)}
                                    placeholder="Select background image for the hero..."
                                />
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">
                            <h2 className="text-base font-semibold text-gray-700 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
                                Call-to-Action Buttons
                            </h2>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className={labelClass}>🎟 Primary (Gold) Button Label</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{data.showTicketCta !== false ? 'Enabled' : 'Disabled'}</span>
                                        <button
                                            onClick={() => update('showTicketCta', data.showTicketCta === false)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${data.showTicketCta !== false ? 'bg-yellow-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.showTicketCta !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                <input className={inputClass} value={data.ticketCta} onChange={e => update('ticketCta', e.target.value)} placeholder="Get Your Tickets" disabled={data.showTicketCta === false} />
                            </div>

                            <div>
                                <label className={labelClass}>🎟 Primary Button Link (URL)</label>
                                <input className={inputClass} value={data.ticketCtaLink} onChange={e => update('ticketCtaLink', e.target.value)} placeholder="https://eventbrite.ca/..." disabled={data.showTicketCta === false} />
                            </div>

                            <div>
                                <label className={labelClass}>Secondary Button Label</label>
                                <input className={inputClass} value={data.primaryCta} onChange={e => update('primaryCta', e.target.value)} placeholder="Explore The Gala" />
                            </div>

                            <div>
                                <label className={labelClass}>Secondary Button Link (path or URL)</label>
                                <input className={inputClass} value={data.primaryCtaLink} onChange={e => update('primaryCtaLink', e.target.value)} placeholder="/impact/events/black-excellence-gala" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column — Event Details & Countdown */}
                    <div className="space-y-5">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-5">
                            <h2 className="text-base font-semibold text-gray-700 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                Countdown Timer & Event Details
                            </h2>

                            <div>
                                <label className={labelClass}>Event Date & Time <span className="font-normal text-gray-400">(for countdown timer)</span></label>
                                <input
                                    type="datetime-local"
                                    className={inputClass}
                                    value={data.eventDate}
                                    onChange={e => update('eventDate', e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">The countdown timer will automatically stop when this date/time is reached.</p>
                            </div>

                            <div>
                                <label className={labelClass}>Display Date Label <span className="font-normal text-gray-400">(shown in the date pill)</span></label>
                                <input className={inputClass} value={data.eventDateLabel} onChange={e => update('eventDateLabel', e.target.value)} placeholder="May 17, 2026 at 7:00 PM" />
                            </div>

                            <div>
                                <label className={labelClass}>Venue / Location</label>
                                <input className={inputClass} value={data.location} onChange={e => update('location', e.target.value)} placeholder="Bingemans Conference Centre, Kitchener" />
                            </div>

                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">💡 How the Countdown Works</p>
                                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    <li>• Sets the countdown target to the <strong>Event Date & Time</strong> above</li>
                                    <li>• Automatically counts down live in real-time on the homepage</li>
                                    <li>• When the event date passes, the timer disappears automatically</li>
                                    <li>• No code changes needed — just update the date and save</li>
                                </ul>
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div className="bg-[#0A0A0A] rounded-xl shadow p-6 relative overflow-hidden border border-[#D4AF37]/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-[60px] rounded-full pointer-events-none" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]/60 mb-4">Preview Card</p>

                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider">{data.badgeText || 'Upcoming Major Event'}</span>
                            </div>

                            <h3 className="text-xl font-black text-white mb-2 leading-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
                                    {data.title || 'Black Excellence Awards Gala 2026'}
                                </span>
                            </h3>

                            <p className="text-sm text-white/60 mb-4 line-clamp-2">
                                {data.subtitle || 'A night of prestige, inspiration, and unity.'}
                            </p>

                            {data.eventDateLabel && (
                                <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                                    📅 <span>{data.eventDateLabel}</span>
                                </div>
                            )}
                            {data.location && (
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    📍 <span>{data.location}</span>
                                </div>
                            )}

                            <div className="mt-4 flex gap-2">
                                <span className="px-3 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B5952F] text-black text-xs font-black rounded-full">
                                    {data.ticketCta || 'Get Your Tickets'}
                                </span>
                                <span className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-full border border-white/20">
                                    {data.primaryCta || 'Explore The Gala'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Save bar */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>
        </>
    );
}
