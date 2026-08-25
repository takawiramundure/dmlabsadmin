"use client";

import React, { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import { useSite } from "@/context/SiteContext";
import { Lightbulb, Send, Loader2, CheckCircle2, Clock, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface FeatureTicket {
    id?: string;
    ticketNumber?: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    requestedBy: string;
    createdAt: string;
}

export default function FeatureRequestsPage() {
    const { currentSite } = useSite();
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("CMS Enhancement");
    const [urgency, setUrgency] = useState<"low" | "normal" | "high" | "urgent">("normal");
    const [description, setDescription] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [successTicket, setSuccessTicket] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [tickets, setTickets] = useState<FeatureTicket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);

    const fetchTickets = async (showLoading = false) => {
        if (showLoading) setLoadingTickets(true);
        try {
            const res = await fetch(`/api/support/tickets?siteId=${currentSite.id}&_t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (res.ok) {
                const data = await res.json();
                // Ensure data belongs to current site to prevent race conditions during switching
                if (data.tenantId === currentSite.id) {
                    setTickets(data.tickets || []);
                }
            }
        } catch (err) {
            console.error("Failed to load tickets:", err);
        } finally {
            if (showLoading) setLoadingTickets(false);
        }
    };

    // Reset state & fetch immediately when tenant workspace changes
    useEffect(() => {
        setTickets([]);
        setSuccessTicket(null);
        setErrorMsg("");
        setTitle("");
        setDescription("");
        fetchTickets(true);

        // Live status sync interval every 6 seconds
        const interval = setInterval(() => {
            fetchTickets(false);
        }, 6000);

        return () => clearInterval(interval);
    }, [currentSite.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setErrorMsg("Please provide a title and detailed description of the feature.");
            return;
        }

        setSubmitting(true);
        setErrorMsg("");

        try {
            const pageUrl = typeof window !== "undefined" ? window.location.href : "";
            const res = await fetch("/api/support/dispatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "feature_request",
                    siteId: currentSite.id,
                    siteName: currentSite.name,
                    userEmail: userEmail || "admin@" + currentSite.domain,
                    title,
                    message: description,
                    category,
                    urgency,
                    pageUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to submit feature request");
            }

            setSuccessTicket(data.ticketNumber || "TICK-SUBMITTED");
            setTitle("");
            setDescription("");
            fetchTickets();
        } catch (err: any) {
            console.error("Feature Request Error:", err);
            setErrorMsg(err.message || "Error submitting request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PageMeta
                title={`Feature Requests - ${currentSite.name}`}
                description="Submit and track feature requests for your website."
            />

            <div className="space-y-8 max-w-7xl mx-auto pb-12">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                            <Lightbulb size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                Feature Requests
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Tenant Workspace: <strong className="text-primary font-bold">{currentSite.name}</strong> ({currentSite.id})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchTickets} className="flex items-center gap-2">
                            <RefreshCw size={14} className={loadingTickets ? "animate-spin" : ""} />
                            Refresh Status
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Form: Submit New Feature */}
                    <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-500" />
                                Propose a New Capability
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                All requests are automatically synced into DMTEC Ticketing, ClickUp, and Slack.
                            </p>
                        </div>

                        {successTicket && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in duration-200">
                                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Feature Request Submitted!</p>
                                    <p className="text-xs mt-0.5 opacity-90">
                                        Tracked as Ticket <strong className="font-mono">{successTicket}</strong> for {currentSite.name}.
                                    </p>
                                </div>
                            </div>
                        )}

                        {errorMsg && (
                            <Alert variant="error" title="Submission Error" message={errorMsg} />
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Feature Title *</Label>
                                <Input
                                    placeholder="e.g. Add donation tracking, or dynamic video banner"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Category</Label>
                                    <select
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium"
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
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium"
                                        value={urgency}
                                        onChange={(e) => setUrgency(e.target.value as any)}
                                    >
                                        <option value="low">Low (Nice to have)</option>
                                        <option value="normal">Normal (Standard)</option>
                                        <option value="high">High (Needed soon)</option>
                                        <option value="urgent">Urgent (Critical blocker)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label>Your Notification Email</Label>
                                <Input
                                    type="email"
                                    placeholder="you@organization.ca"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Description & Context *</Label>
                                <textarea
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm min-h-[120px] resize-y"
                                    placeholder="Describe the workflow, what problem this solves, and any specific requirements..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting}
                                className="w-full py-3.5 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-600/20"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {submitting ? "Submitting to Queue..." : "Submit Feature Request"}
                            </Button>
                        </form>
                    </div>

                    {/* Right Table: List of Submitted Requests */}
                    <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 border border-gray-100 dark:border-gray-800 shadow-xl flex flex-col">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Request History & Status
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Tracked specifically for {currentSite.name}
                                </p>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {tickets.length} {tickets.length === 1 ? "Request" : "Requests"}
                            </span>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {loadingTickets ? (
                                <div className="py-16 text-center">
                                    <Loader2 size={28} className="animate-spin text-primary mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">Loading {currentSite.name} feature requests...</p>
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="py-16 text-center text-gray-400">
                                    <Lightbulb size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                        No Feature Requests Yet
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                                        Use the form on the left to submit capability requests for {currentSite.name}.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {tickets.map((ticket, idx) => (
                                        <div key={ticket.id || idx} className="py-4 space-y-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                                            {ticket.subject}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            ticket.priority === 'P1' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                                                            ticket.priority === 'P2' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                        }`}>
                                                            {ticket.priority}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-[10px] font-medium">
                                                            {ticket.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                        {ticket.description}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                                        ticket.status === 'Solved' || ticket.status === 'Closed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                                                        ticket.status === 'In Progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                                                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                    }`}>
                                                        {ticket.status || 'New'}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                                                        <Clock size={10} />
                                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recent'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
