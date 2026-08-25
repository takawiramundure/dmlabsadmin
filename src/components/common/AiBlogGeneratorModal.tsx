"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Alert from '@/components/ui/alert/Alert';
import { useSite } from '@/context/SiteContext';
import { Sparkles, Loader2, Wand2, Settings2 } from 'lucide-react';
import Link from 'next/link';

interface AiBlogGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (data: {
        title: string;
        excerpt: string;
        content: string;
        seoTitle: string;
        seoDescription: string;
        tags: string[];
    }) => void;
}

export default function AiBlogGeneratorModal({ isOpen, onClose, onGenerated }: AiBlogGeneratorModalProps) {
    const { currentSite } = useSite();
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [tone, setTone] = useState('Empowering, authentic, community-focused, and professional');
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [generating, setGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [needsConfig, setNeedsConfig] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() && !context.trim()) {
            setErrorMsg('Please enter a topic/title or some background bullet points.');
            return;
        }

        setGenerating(true);
        setErrorMsg('');
        setNeedsConfig(false);

        try {
            const res = await fetch('/api/ai/generate-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: currentSite.id,
                    title,
                    context,
                    tone,
                    length
                })
            });

            const json = await res.json();
            if (!res.ok) {
                if (json.needsConfig) {
                    setNeedsConfig(true);
                }
                throw new Error(json.error || 'Failed to generate article with AI.');
            }

            if (json.data) {
                onGenerated(json.data);
                onClose();
            }
        } catch (err: any) {
            console.error('AI Generation Error:', err);
            setErrorMsg(err.message || 'Error generating article.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl">
            <form onSubmit={handleGenerate} className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                AI Blog Generator ({currentSite.name})
                            </h3>
                            <p className="text-xs text-gray-500">
                                Powered by your tenant's configured LLM (Gemini / OpenAI / Anthropic).
                            </p>
                        </div>
                    </div>
                </div>

                {errorMsg && (
                    <div className="space-y-2">
                        <Alert variant="error" title="AI Generation Error" message={errorMsg} />
                        {needsConfig && (
                            <Link
                                href="/settings/site"
                                className="inline-flex items-center gap-2 text-xs text-primary font-bold hover:underline"
                            >
                                <Settings2 size={14} /> Open Site Settings to configure your AI API Key →
                            </Link>
                        )}
                    </div>
                )}

                <div>
                    <Label>Article Topic or Working Title *</Label>
                    <Input
                        placeholder="e.g. 5 Strategies for Sustainable Community Wellness in 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <Label>Context & Key Points to Include</Label>
                    <textarea
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm min-h-[90px] resize-y"
                        placeholder="Add bullet points, quotes, event details, or specific takeaways you want the article to feature..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Tone / Voice</Label>
                        <Input
                            placeholder="e.g. Inspiring, professional, empathetic"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Article Length</Label>
                        <select
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            value={length}
                            onChange={(e) => setLength(e.target.value as any)}
                        >
                            <option value="short">Short (400 - 600 words)</option>
                            <option value="medium">Medium (800 - 1100 words)</option>
                            <option value="long">Long In-Depth (1200 - 1600 words)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button type="button" variant="outline" onClick={onClose} disabled={generating}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={generating} className="flex items-center gap-2">
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                        {generating ? 'Drafting Article with AI...' : 'Generate Full Draft'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
