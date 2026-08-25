"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, CheckCircle2, LifeBuoy, AlertCircle, Zap, Ticket as TicketIcon, Bot, User, Clock } from 'lucide-react';
import { useSite } from '@/context/SiteContext';

interface ChatMessage {
    id?: string;
    text: string;
    sender: 'client' | 'agent';
    senderName?: string;
    createdAt?: string;
}

export default function SupportChatWidget() {
    const { currentSite } = useSite();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'live_chat' | 'ticket'>('live_chat');

    // Live Chat State
    const [sessionId, setSessionId] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingChat, setSendingChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Ticket Form State
    const [ticketMessage, setTicketMessage] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [topic, setTopic] = useState('CMS Help');
    const [urgentLiveAlert, setUrgentLiveAlert] = useState(false);
    const [submittingTicket, setSubmittingTicket] = useState(false);
    const [ticketNumber, setTicketNumber] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Initialize or load existing Session ID
    useEffect(() => {
        let storedId = '';
        if (typeof window !== 'undefined') {
            storedId = localStorage.getItem(`live_chat_session_${currentSite.id}`) || '';
            if (!storedId) {
                storedId = `sess_${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem(`live_chat_session_${currentSite.id}`, storedId);
            }
        }
        setSessionId(storedId);
        setChatMessages([
            {
                text: `👋 Hi! Welcome to ${currentSite.name} support. How can our engineering team assist you today?`,
                sender: 'agent',
                senderName: 'On-Call Engineer',
                createdAt: new Date().toISOString()
            }
        ]);
        setTicketNumber(null);
        setErrorMsg('');
    }, [currentSite.id]);

    // Live Chat Message Polling (Fetches Telegram replies in real-time)
    const fetchLiveChatMessages = async () => {
        if (!sessionId || !currentSite.id) return;
        try {
            const res = await fetch(`/api/support/live-chat?siteId=${currentSite.id}&sessionId=${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setChatMessages((prev) => {
                        const welcomeMsg = prev[0];
                        return [welcomeMsg, ...data.messages];
                    });
                }
            }
        } catch (err) {
            console.warn('Error fetching live chat:', err);
        }
    };

    // Auto-poll for live Telegram replies every 3 seconds when widget is open
    useEffect(() => {
        if (!isOpen || activeTab !== 'live_chat') return;
        fetchLiveChatMessages();
        const timer = setInterval(fetchLiveChatMessages, 3000);
        return () => clearInterval(timer);
    }, [isOpen, activeTab, sessionId, currentSite.id]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Handle Client Sending Message in Live Chat
    const handleSendLiveMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || sendingChat) return;

        const outgoingText = chatInput.trim();
        setChatInput('');
        setSendingChat(true);

        // Optimistically add to UI
        const tempMsg: ChatMessage = {
            text: outgoingText,
            sender: 'client',
            senderName: 'You',
            createdAt: new Date().toISOString()
        };
        setChatMessages((prev) => [...prev, tempMsg]);

        try {
            const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
            await fetch('/api/support/live-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: currentSite.id,
                    siteName: currentSite.name,
                    sessionId,
                    userEmail: userEmail || `admin@${currentSite.domain}`,
                    userName: 'Client User',
                    text: outgoingText,
                    pageUrl
                })
            });
        } catch (err) {
            console.error('Failed to send live message:', err);
        } finally {
            setSendingChat(false);
        }
    };

    // Handle Submitting Formal Ticket
    const handleSendTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketMessage.trim()) return;

        setSubmittingTicket(true);
        setErrorMsg('');

        try {
            const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
            const res = await fetch('/api/support/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'help_chat',
                    siteId: currentSite.id,
                    siteName: currentSite.name,
                    userEmail: userEmail || 'admin@' + currentSite.domain,
                    title: `Support Ticket: ${topic} (${currentSite.name})`,
                    message: urgentLiveAlert ? `🚨 [URGENT LIVE ALERT]\n${ticketMessage}` : ticketMessage,
                    category: topic,
                    urgency: urgentLiveAlert ? 'urgent' : 'normal',
                    pageUrl
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to dispatch ticket');
            }

            setTicketNumber(data.ticketNumber || 'TICK-DISPATCHED');
            setTicketMessage('');
        } catch (err: any) {
            console.error('Support Ticket Error:', err);
            setErrorMsg(err.message || 'Error dispatching ticket.');
        } finally {
            setSubmittingTicket(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[99999] font-sans">
            {/* Floating High-Contrast Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-3 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 hover:from-indigo-800 hover:to-blue-800 text-white font-bold px-6 py-4 rounded-full shadow-[0_10px_35px_rgba(79,70,229,0.5)] hover:scale-105 transition-all duration-200 border-2 border-indigo-300/40 group cursor-pointer"
                    aria-label="Open Support & Live Chat"
                >
                    <div className="relative">
                        <MessageSquare size={22} className="text-white group-hover:rotate-6 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-700 animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-700" />
                    </div>
                    <span className="text-sm font-extrabold tracking-wide drop-shadow-sm">Live Support & Chat</span>
                </button>
            )}

            {/* Chat Box Dialog */}
            {isOpen && (
                <div className="w-[380px] sm:w-[440px] h-[580px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.4)] border-2 border-indigo-600/30 dark:border-indigo-500/40 flex flex-col overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-6 duration-200">
                    {/* Header */}
                    <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                                <LifeBuoy size={22} />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm leading-tight text-white flex items-center gap-2">
                                    Support Desk
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Online
                                    </span>
                                </h4>
                                <p className="text-[11px] text-indigo-200 font-medium truncate max-w-[200px]">{currentSite.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 p-1.5 gap-1.5">
                        <button
                            onClick={() => setActiveTab('live_chat')}
                            className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                activeTab === 'live_chat'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Zap size={14} className={activeTab === 'live_chat' ? 'text-amber-500 fill-amber-500' : ''} />
                            Live Chat (Telegram)
                        </button>
                        <button
                            onClick={() => setActiveTab('ticket')}
                            className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                activeTab === 'ticket'
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <TicketIcon size={14} />
                            Submit Ticket
                        </button>
                    </div>

                    {/* TAB 1: 2-WAY TELEGRAM LIVE CHAT */}
                    {activeTab === 'live_chat' && (
                        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/90 overflow-hidden">
                            {/* Messages Container */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                {chatMessages.map((msg, idx) => {
                                    const isClient = msg.sender === 'client';
                                    return (
                                        <div
                                            key={msg.id || idx}
                                            className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1 px-1">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                    {msg.senderName || (isClient ? 'You' : 'Support Engineer')}
                                                </span>
                                                <span className="text-[9px] text-slate-400">
                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <div
                                                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm ${
                                                    isClient
                                                        ? 'bg-indigo-600 text-white rounded-br-xs'
                                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                                                }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input Footer */}
                            <form onSubmit={handleSendLiveMessage} className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message to on-call engineer..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-600 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={sendingChat || !chatInput.trim()}
                                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md disabled:opacity-40 transition-all cursor-pointer flex-shrink-0"
                                    aria-label="Send Message"
                                >
                                    {sendingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB 2: TICKET SUBMISSION */}
                    {activeTab === 'ticket' && (
                        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/90">
                            {ticketNumber ? (
                                <div className="py-6 text-center">
                                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h5 className="font-extrabold text-lg text-slate-900 dark:text-white">Ticket Created!</h5>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                        Ticket <strong className="font-mono text-indigo-600 font-bold">{ticketNumber}</strong> has been dispatched.
                                    </p>
                                    <button
                                        onClick={() => setTicketNumber(null)}
                                        className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all block mx-auto cursor-pointer"
                                    >
                                        Send another ticket
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSendTicket} className="space-y-3.5">
                                    {errorMsg && (
                                        <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-semibold">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wide">
                                            Category
                                        </label>
                                        <select
                                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                        >
                                            <option value="CMS Help">CMS & Content Editing</option>
                                            <option value="Publishing Issue">Publishing / Live Updates</option>
                                            <option value="Page Builder">Layout & Section Builder</option>
                                            <option value="User Permissions">User Management</option>
                                            <option value="General Inquiry">General Question</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wide">
                                            Response Email
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="you@organization.ca"
                                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                                            value={userEmail}
                                            onChange={(e) => setUserEmail(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wide">
                                            Description *
                                        </label>
                                        <textarea
                                            rows={3}
                                            placeholder="Describe the issue in detail..."
                                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium resize-none"
                                            value={ticketMessage}
                                            onChange={(e) => setTicketMessage(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submittingTicket}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 text-white py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                                    >
                                        {submittingTicket ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        {submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
