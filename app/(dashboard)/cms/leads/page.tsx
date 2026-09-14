"use client";

import React, { useEffect, useState, useMemo } from 'react';
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Eye, Mail, MessageSquare, Download } from 'lucide-react';
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

export default function LeadsPage() {
    const { currentSite } = useSite();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<any | null>(null);

    useEffect(() => {
        if (currentSite?.id) {
            loadLeads();
        }
    }, [currentSite?.id]);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getLeads(currentSite.id);
            setLeads(data);
        } catch (error) {
            console.error("Failed to load leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (leads.length === 0) return;

        // Get all unique headers across all leads
        const allKeys = new Set<string>();
        leads.forEach(lead => {
            Object.keys(lead).forEach(k => {
                if (k !== 'id' && typeof lead[k] !== 'object') {
                    allKeys.add(k);
                }
            });
        });

        const headers = Array.from(allKeys);
        const csvRows = [];
        
        // Add header row
        csvRows.push(headers.join(','));

        // Add data rows
        leads.forEach(lead => {
            const row = headers.map(header => {
                let val = lead[header] || '';
                // Escape quotes and wrap in quotes to handle commas in text
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSite.id}_leads_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatDate = (val: any) => {
        if (!val) return 'Unknown';
        // Handle Firestore Timestamp or string
        const date = val.seconds ? new Date(val.seconds * 1000) : new Date(val);
        if (isNaN(date.getTime())) return String(val);
        return date.toLocaleString();
    };

    const getLeadName = (lead: any) => {
        return lead.name || lead.firstName || lead.fullName || lead.firstName ? `${lead.firstName} ${lead.lastName || ''}` : 'Anonymous';
    };

    const getLeadEmail = (lead: any) => {
        return lead.email || lead.emailAddress || 'N/A';
    };

    const {
        currentData: paginatedLeads,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<any>({
        data: leads,
        searchKeys: ['name', 'firstName', 'lastName', 'fullName', 'email', 'emailAddress', 'collectionSource'],
        initialPageSize: 10
    });

    return (
        <ProtectedRoute allowedRoles={['super_admin', 'editor']}>
            <PageMeta
                title="Leads & Forms | Admin Portal"
                description="View form submissions and messages from your website"
            />
            <PageBreadcrumb pageTitle="Leads & Form Submissions" />

            <div className="space-y-6 mx-auto max-w-7xl">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
                                <MessageSquare className="text-brand-500" size={24} />
                                Form Submissions
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                View all messages, contacts, and form submissions from {currentSite.name}.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleExportCSV} disabled={leads.length === 0} className="flex items-center gap-2">
                                <Download size={16} /> Export CSV
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500"></div>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                            <Mail className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p>No form submissions found for this site.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                                <TableControls
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    searchPlaceholder="Search leads..."
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Source</th>
                                        <th className="px-4 py-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {paginatedLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-900 dark:text-white">
                                                {formatDate(lead.createdAt || lead.timestamp)}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {getLeadName(lead)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <a href={`mailto:${getLeadEmail(lead)}`} className="text-brand-500 hover:underline">
                                                    {getLeadEmail(lead)}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400">
                                                    {lead.collectionSource}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="inline-flex items-center gap-1 text-xs py-1 h-auto"
                                                >
                                                    <Eye size={14} /> View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {paginatedLeads.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                    No leads match your search.
                                </div>
                            )}
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
            </div>

            {/* Lead Details Modal */}
            <Modal
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                title="Submission Details"
                className="max-w-2xl"
            >
                {selectedLead && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-1">Submitted Date</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {formatDate(selectedLead.createdAt || selectedLead.timestamp)}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mb-1">Collection Source</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {selectedLead.collectionSource}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium border-b border-gray-100 dark:border-gray-800 pb-2">All Submitted Fields</h3>
                            
                            <div className="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
                                {Object.entries(selectedLead)
                                    .filter(([key]) => !['id', 'collectionSource', 'createdAt', 'timestamp'].includes(key))
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .map(([key, value]) => {
                                        // Format large text differently
                                        const isLargeText = typeof value === 'string' && value.length > 100;
                                        
                                        return (
                                            <div key={key} className={isLargeText ? "col-span-full" : ""}>
                                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </dt>
                                                <dd className={`text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 ${isLargeText ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>
                                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                                </dd>
                                            </div>
                                        );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </ProtectedRoute>
    );
}
