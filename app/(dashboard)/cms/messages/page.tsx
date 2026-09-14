"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Mail, Trash2, Calendar, User, Phone, MessageSquare, X, Eye } from 'lucide-react';
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { useDialog } from "@/context/DialogContext";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface Message {
    id: string;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message?: string;
    timestamp: any;
    status?: string;
    // For applications
    qualifications?: string;
    address?: string;
    startDate?: string;
    legallyAbleToWork?: string;
    // For appointments
    service?: string;
    age?: string;
    hoursNeeded?: string;
    assessmentDate?: string;
}

interface MessagesManagerProps {
    collectionName?: string;
    titleOverride?: string;
}

export default function MessagesManager({ collectionName = "messages", titleOverride }: MessagesManagerProps) {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const displayTitle = titleOverride || (
        collectionName === "messages" ? "Inbound Messages" :
        collectionName === "appointments" ? "Service Appointments" :
        collectionName === "applications" ? "Job Applications" : "Inbox"
    );

    const {
        currentData: paginatedMessages,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<Message>({
        data: messages,
        searchKeys: ['name', 'email', 'subject', 'message', 'service', 'qualifications'],
        initialPageSize: 10
    });

    useEffect(() => {
        loadMessages();
    }, [currentSite.id, collectionName]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getMessages(currentSite.id, collectionName);
            setMessages(data.map((m: any) => ({ ...m, timestamp: m.createdAt })));
        } catch (err) {
            console.error(err);
            setError(`Failed to load ${collectionName}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Entry",
            message: "Are you sure you want to delete this entry? This action cannot be undone.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;
        setDeletingId(id);
        try {
            await FirestoreService.deleteMessage(currentSite.id, id, collectionName);
            setMessages(prev => prev.filter(m => m.id !== id));
            if (selectedMessage?.id === id) setSelectedMessage(null);
        } catch (err) {
            console.error(err);
            await dialogAlert({
                title: "Error",
                message: "Failed to delete entry. Please try again.",
                variant: "danger"
            });
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (ts: any) => {
        if (!ts) return "N/A";
        const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        return date.toLocaleString();
    };

    return (
        <>
            <PageMeta title={`${displayTitle} | Admin Portal`} description={`Review ${collectionName} submissions`} />
            <PageBreadcrumb pageTitle={displayTitle} />

            <div className="p-6 max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{displayTitle}</h2>
                    <p className="text-sm text-gray-500">Review and manage {collectionName} sent via the website's secure forms.</p>
                </div>

                {error && <div className="mb-6"><Alert variant="error" title="Error" message={error} /></div>}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-20 text-center border border-gray-100 dark:border-gray-800">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                            <Mail size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-gray-500">Submissions from the contact form will appear here.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                            <TableControls
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                searchPlaceholder="Search messages..."
                            />
                        </div>
                        <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sender</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {collectionName === "messages" ? "Subject / Message" : 
                                             collectionName === "appointments" ? "Service / Date" : "Qualifications / Role"}
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Received</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginatedMessages.map((msg) => (
                                        <tr 
                                            key={msg.id} 
                                            className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer"
                                            onClick={() => setSelectedMessage(msg)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-800 dark:text-white">{msg.name}</span>
                                                    <span className="text-xs text-gray-500">{msg.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs md:max-w-md">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                        {collectionName === "messages" ? (msg.subject || "No Subject") : 
                                                         collectionName === "appointments" ? msg.service : msg.qualifications}
                                                    </span>
                                                    <span className="text-xs text-gray-500 truncate">
                                                        {collectionName === "messages" ? msg.message : 
                                                         collectionName === "appointments" ? `Assessment: ${msg.assessmentDate}` : `Start: ${msg.startDate}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(msg.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setSelectedMessage(msg)}
                                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="View Message"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(msg.id)}
                                                        disabled={deletingId === msg.id}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Delete Message"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {paginatedMessages.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                    No messages match your search.
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            setPageSize={setPageSize}
                            nextPage={nextPage}
                            prevPage={prevPage}
                        />
                    </div>
                    </>
                )}
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary" /> Message Details
                            </h3>
                            <button onClick={() => setSelectedMessage(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-8 overflow-y-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">From</label>
                                    <div className="flex items-center gap-3 text-gray-800 dark:text-white font-medium">
                                        <User className="w-4 h-4 text-primary/60" /> {selectedMessage.name}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email</label>
                                    <div className="flex items-center gap-3 text-gray-800 dark:text-white font-medium">
                                        <Mail className="w-4 h-4 text-primary/60" /> {selectedMessage.email}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Phone</label>
                                    <div className="flex items-center gap-3 text-gray-800 dark:text-white font-medium">
                                        <Phone className="w-4 h-4 text-primary/60" /> {selectedMessage.phone || "Not provided"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Received On</label>
                                    <div className="flex items-center gap-3 text-gray-800 dark:text-white font-medium">
                                        <Calendar className="w-4 h-4 text-primary/60" /> {formatDate(selectedMessage.timestamp)}
                                    </div>
                                </div>
                            </div>

                            {selectedMessage.subject && (
                                <div className="space-y-1 pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Subject</label>
                                    <div className="text-lg font-bold text-gray-800 dark:text-white italic">
                                        "{selectedMessage.subject}"
                                    </div>
                                </div>
                            )}

                            {selectedMessage.message && (
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Message Body</label>
                                    <div className="p-6 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </div>
                                </div>
                            )}

                            {collectionName === "appointments" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Service Needed</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.service}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Patient Age</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.age}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Assessment Date</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.assessmentDate}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hours Needed</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.hoursNeeded}</div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Address</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.address}</div>
                                    </div>
                                </div>
                            )}

                            {collectionName === "applications" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Qualifications</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.qualifications}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Work Eligibility</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.legallyAbleToWork}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Preferred Start</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.startDate}</div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Address</label>
                                        <div className="font-bold text-gray-800 dark:text-white">{selectedMessage.address}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/30 dark:bg-white/[0.01]">
                            <Button variant="outline" onClick={() => setSelectedMessage(null)}>Close</Button>
                            <Button variant="outline" className="text-red-500 border-red-100 hover:bg-red-50" onClick={() => handleDelete(selectedMessage.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Entry
                            </Button>
                            <a 
                                href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || `Your request to ${currentSite.name}`}`} 
                                className="inline-flex items-center px-6 py-3 rounded-full bg-primary text-white font-bold hover:scale-105 transition-transform"
                            >
                                <PaperPlaneIcon className="w-4 h-4 mr-2" /> Reply via Email
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Helper for the modal button since it's not a standard lucide ref here
function PaperPlaneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.6667 1.33333L7.33337 8.66667M14.6667 1.33333L10 14.6667L7.33337 8.66667M14.6667 1.33333L1.33337 6L7.33337 8.66667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}
