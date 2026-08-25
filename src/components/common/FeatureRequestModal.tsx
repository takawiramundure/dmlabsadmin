"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Alert from '@/components/ui/alert/Alert';
import { useSite } from '@/context/SiteContext';
import { Sparkles, Lightbulb, CheckCircle2, Send, Loader2 } from 'lucide-react';

interface FeatureRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeatureRequestModal({ isOpen, onClose }: FeatureRequestModalProps) {
    const { currentSite } = useSite();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('CMS Enhancement');
    const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
    const [description, setDescription] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successTicket, setSuccessTicket] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setErrorMsg('Please provide a title and detailed description of the feature.');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
            const res = await fetch('/api/support/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'feature_request',
                    siteId: currentSite.id,
                    siteName: currentSite.name,
                    userEmail: userEmail || 'admin@' + currentSite.domain,
                    title,
                    message: description,
                    category,
                    urgency,
                    pageUrl
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit feature request');
            }

            setSuccessTicket(data.ticketNumber || 'TICK-SUBMITTED');
        } catch (err: any) {
            console.error('Feature Request Error:', err);
            setErrorMsg(err.message || 'Error submitting request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setTitle('');
        setDescription('');
        setSuccessTicket(null);
        setErrorMsg('');
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleReset} 
            showCloseButton={false}
            size="none"
            className="max-w-xl w-full mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800"
        >
            {successTicket ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={36} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Feature Request Logged!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                        Your request has been recorded as ticket <strong className="font-mono text-primary">{successTicket}</strong> and automatically dispatched to our product engineering queue in DMTEC Ticketing, ClickUp, Slack, and Email.
                    </p>
                    <Button onClick={handleReset} variant="primary" className="mx-auto">
                        Done
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                                <Lightbulb size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Propose a Feature for {currentSite.name}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Send a direct capability request to our engineering roadmap.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            &times;
                        </button>
                    </div>

                    {errorMsg && (
                        <Alert variant="error" title="Submission Error" message={errorMsg} />
                    )}

                    <div>
                        <Label>Feature Title *</Label>
                        <Input
                            placeholder="e.g. Export donations to CSV, or Add video hero banner"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Category</Label>
                            <select
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="CMS Enhancement">CMS Enhancement</option>
                                <option value="New Page / Layout">New Page / Layout</option>
                                <option value="Integration / API">Integration / API</option>
                                <option value="Design / Styling">Design / Styling</option>
                                <option value="Performance">Performance</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <Label>Urgency</Label>
                            <select
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value as any)}
                            >
                                <option value="low">Low (Nice to have)</option>
                                <option value="normal">Normal (Standard request)</option>
                                <option value="high">High (Needed soon)</option>
                                <option value="urgent">Urgent (Critical blocker)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <Label>Your Email (for notification updates)</Label>
                        <Input
                            type="email"
                            placeholder="you@client.org"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Description & Context *</Label>
                        <textarea
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm min-h-[100px] resize-y"
                            placeholder="Explain the workflow, who will use it, and what problem it solves..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button type="button" variant="outline" onClick={handleReset} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting} className="flex items-center gap-2">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {submitting ? 'Submitting...' : 'Submit Feature Request'}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
