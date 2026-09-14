"use client";

import React, { useEffect, useState, useMemo } from 'react';
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { History, Eye, RotateCcw, Filter, Calendar, User, Database, Globe, RefreshCw, Info } from 'lucide-react';
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface ChangeSummary {
    type: 'create' | 'delete' | 'update' | 'none' | 'unknown';
    description: string;
    added?: string[];
    removed?: string[];
    modified?: string[];
}

function getChangeSummary(item: any): ChangeSummary {
    if (!item) return { type: 'unknown', description: 'No active item selected.' };
    const { action, previousData, newData } = item;
    
    if (action === 'create') {
        const fieldCount = newData ? Object.keys(newData).length : 0;
        return {
            type: 'create',
            description: `Created a new document containing ${fieldCount} field${fieldCount === 1 ? '' : 's'}.`,
            added: newData ? Object.keys(newData) : []
        };
    }
    
    if (action === 'delete') {
        const fieldCount = previousData ? Object.keys(previousData).length : 0;
        return {
            type: 'delete',
            description: `Deleted the document containing ${fieldCount} field${fieldCount === 1 ? '' : 's'}.`,
            removed: previousData ? Object.keys(previousData) : []
        };
    }
    
    if (action === 'update' || (!action && previousData && newData)) {
        const prev = previousData || {};
        const next = newData || {};
        
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        
        const added: string[] = [];
        const removed: string[] = [];
        const modified: string[] = [];
        
        const allKeys = Array.from(new Set([...prevKeys, ...nextKeys]));
        
        allKeys.forEach(key => {
            const hasPrev = key in prev;
            const hasNext = key in next;
            if (!hasPrev && hasNext) {
                added.push(key);
            } else if (hasPrev && !hasNext) {
                removed.push(key);
            } else if (hasPrev && hasNext) {
                if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
                    modified.push(key);
                }
            }
        });
        
        if (added.length === 0 && removed.length === 0 && modified.length === 0) {
            return {
                type: 'none',
                description: "No changes detected. The document contents are identical."
            };
        }
        
        const descParts: string[] = [];
        if (added.length > 0) descParts.push(`added ${added.length} field${added.length === 1 ? '' : 's'}`);
        if (removed.length > 0) descParts.push(`removed ${removed.length} field${removed.length === 1 ? '' : 's'}`);
        if (modified.length > 0) descParts.push(`modified ${modified.length} field${modified.length === 1 ? '' : 's'}`);
        
        return {
            type: 'update',
            description: `Updated document: ${descParts.join(', ')}.`,
            added,
            removed,
            modified
        };
    }
    
    return { type: 'unknown', description: "Unknown activity type or no change data available." };
}

function VisualDiff({ prev, next }: { prev: any; next: any }) {
    if (!prev && !next) return <div className="text-gray-500 italic py-4">No data to compare.</div>;

    // If document was created (no previous data)
    if (!prev) {
        return (
            <div className="space-y-3">
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Document Created (New content added):
                </div>
                <pre className="p-4 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 rounded-2xl text-xs overflow-auto max-h-96 border border-green-100 dark:border-green-900/30">
                    {JSON.stringify(next, null, 2)}
                </pre>
            </div>
        );
    }

    // If document was deleted (no new data)
    if (!next) {
        return (
            <div className="space-y-3">
                <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Document Deleted (Previous state below):
                </div>
                <pre className="p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 rounded-2xl text-xs overflow-auto max-h-96 border border-red-100 dark:border-red-900/30">
                    {JSON.stringify(prev, null, 2)}
                </pre>
            </div>
        );
    }

    // Flatten keys to compare key-value pairs
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)]));

    const diffs = allKeys.map(key => {
        const valPrev = prev[key];
        const valNext = next[key];
        const isIdentical = JSON.stringify(valPrev) === JSON.stringify(valNext);

        let type: 'added' | 'deleted' | 'modified' | 'identical' = 'identical';
        if (!(key in prev)) type = 'added';
        else if (!(key in next)) type = 'deleted';
        else if (!isIdentical) type = 'modified';

        return { key, valPrev, valNext, type };
    });

    const changedDiffs = diffs.filter(d => d.type !== 'identical');
    const unchangedDiffs = diffs.filter(d => d.type === 'identical');

    const renderValue = (val: any) => {
        if (val === null || val === undefined) return <span className="italic text-gray-400">null</span>;
        if (typeof val === 'object') {
            return <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">{JSON.stringify(val, null, 2)}</pre>;
        }
        return <span>{String(val)}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {changedDiffs.map(({ key, valPrev, valNext, type }) => (
                    <div key={key} className="border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-150 dark:border-gray-800">
                            <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">{key}</span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                type === 'added' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                                type === 'deleted' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                                {type.toUpperCase()}
                            </span>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-transparent">
                            {type !== 'added' && (
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Before:</div>
                                    <div className="p-3 bg-red-50/50 dark:bg-red-950/10 text-red-800 dark:text-red-400 rounded-xl text-sm border border-red-100/50 dark:border-red-950/20 overflow-auto max-h-60">
                                        {renderValue(valPrev)}
                                    </div>
                                </div>
                            )}
                            {type !== 'deleted' && (
                                <div className="space-y-1 md:col-start-2">
                                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">After:</div>
                                    <div className="p-3 bg-green-50/50 dark:bg-green-950/10 text-green-800 dark:text-green-400 rounded-xl text-sm border border-green-100/50 dark:border-green-950/20 overflow-auto max-h-60">
                                        {renderValue(valNext)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {changedDiffs.length === 0 && (
                    <div className="text-center py-8 text-gray-500 italic bg-gray-50 dark:bg-gray-800/10 rounded-2xl">
                        No field changes detected (identical values).
                    </div>
                )}
            </div>

            {unchangedDiffs.length > 0 && (
                <details className="group border border-gray-200 dark:border-gray-800 rounded-2xl">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-between select-none bg-gray-50/30 dark:bg-transparent">
                        <span>Show {unchangedDiffs.length} Unchanged Fields</span>
                        <span className="transition-transform group-open:rotate-180 text-xs">▼</span>
                    </summary>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 space-y-2 max-h-60 overflow-y-auto">
                        {unchangedDiffs.map(({ key, valPrev }) => (
                            <div key={key} className="flex justify-between text-xs font-mono py-1.5 border-b border-gray-150/40 dark:border-gray-800/50 last:border-b-0">
                                <span className="text-gray-500 font-semibold">{key}:</span>
                                <span className="text-gray-700 dark:text-gray-300 truncate max-w-md">
                                    {typeof valPrev === 'object' ? JSON.stringify(valPrev) : String(valPrev)}
                                </span>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

export default function RollbackManager() {
    const { sites, currentSite } = useSite();
    const { confirm } = useDialog();

    // Filters & States
    const [selectedSiteId, setSelectedSiteId] = useState(currentSite.id);
    const [selectedCollection, setSelectedCollection] = useState("all");
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rollbackSaving, setRollbackSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Details Modal State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');
    const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number>(0);

    // Sync state site ID with current site context
    useEffect(() => {
        setSelectedSiteId(currentSite.id);
    }, [currentSite]);

    // Fetch site history
    const loadHistory = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const data = await FirestoreService.getHistory(selectedSiteId);
            setHistory(data);
        } catch (err) {
            console.error("Error loading history logs:", err);
            setErrorMsg("Failed to load historical audit logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [selectedSiteId]);

    const filteredHistory = useMemo(() => {
        if (selectedCollection === "all") return history;
        return history.filter(item => item.collectionName === selectedCollection);
    }, [history, selectedCollection]);

    const {
        currentData: paginatedHistory,
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
        data: filteredHistory,
        searchKeys: ['action', 'collectionName', 'documentId', 'updatedBy'],
        initialPageSize: 10
    });

    // Format display names for collections
    const getCollectionLabel = (name: string) => {
        const labels: Record<string, string> = {
            content: "Page Content",
            settings: "Settings",
            events: "Event",
            articles: "Article/Blog",
            videos: "Video",
            partners: "Partner",
            products: "Product/Shop",
            forms: "Form Configuration",
            reusable_sections: "Reusable Section"
        };
        return labels[name] || name;
    };

    // Execute the database rollback
    const handleRollback = async (item: any) => {
        // Find which state to restore:
        // Rolling back a CREATE = delete document (data = null)
        // Rolling back an UPDATE = restore previousData
        // Rolling back a DELETE = restore previousData (recreate)
        const targetData = item.action === 'create' ? null : item.previousData;
        
        let confirmMessage = "";
        let actionLabel = "";
        
        if (item.action === 'create') {
            confirmMessage = `This will DELETE the document "${item.documentId}" from "${getCollectionLabel(item.collectionName)}" because this history entry represents its creation. Do you want to continue?`;
            actionLabel = "Delete Document";
        } else if (item.action === 'delete') {
            confirmMessage = `This will RESTORE the deleted document "${item.documentId}" back to "${getCollectionLabel(item.collectionName)}". Do you want to continue?`;
            actionLabel = "Restore Document";
        } else {
            confirmMessage = `This will REVERT "${item.documentId}" in "${getCollectionLabel(item.collectionName)}" back to the state it was in before this edit. Do you want to continue?`;
            actionLabel = "Revert Document";
        }

        const isConfirmed = await confirm({
            title: `Confirm Rollback Action`,
            message: confirmMessage,
            variant: item.action === 'create' ? "danger" : "warning",
            confirmLabel: actionLabel
        });

        if (!isConfirmed) return;

        setRollbackSaving(true);
        setErrorMsg("");
        setSuccessMsg("");
        setIsDetailsOpen(false); // Close modal if open

        try {
            await FirestoreService.rollbackDocument(
                selectedSiteId,
                item.collectionName,
                item.documentId,
                targetData
            );
            setSuccessMsg(`Successfully rolled back "${item.documentId}" to its previous state!`);
            setTimeout(() => setSuccessMsg(""), 5000);
            await loadHistory();
        } catch (err: any) {
            console.error("Rollback failed:", err);
            setErrorMsg(`Rollback failed: ${err.message || 'Unknown error occurred.'}`);
        } finally {
            setRollbackSaving(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['super_admin']}>
            <PageMeta
                title="Rollback Manager | Admin Portal"
                description="Restore content, configurations, and elements to previous versions"
            />
            <PageBreadcrumb pageTitle="Rollback & Versioning Manager" />

            <div className="space-y-6 mx-auto max-w-7xl">
                {/* Dashboard Controls & Filters */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
                                <History className="text-brand-500" size={24} />
                                System Activity & Rollback Logs
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Filter logs by site or collection type. Inspect version differences, and roll back updates or deletions instantly.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Site Selection */}
                            <div className="flex items-center gap-2">
                                <Globe size={18} className="text-gray-400" />
                                <select
                                    value={selectedSiteId}
                                    onChange={(e) => setSelectedSiteId(e.target.value)}
                                    className="rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 focus:border-primary focus-visible:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                                >
                                    {sites.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name} ({site.id.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Collection Type Filter */}
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-gray-400" />
                                <select
                                    value={selectedCollection}
                                    onChange={(e) => setSelectedCollection(e.target.value)}
                                    className="rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 focus:border-primary focus-visible:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                                >
                                    <option value="all">All Content Types</option>
                                    <option value="content">Pages</option>
                                    <option value="settings">Settings</option>
                                    <option value="events">Events</option>
                                    <option value="articles">Articles / Blog</option>
                                    <option value="videos">Videos</option>
                                    <option value="partners">Partners</option>
                                    <option value="products">Products / Shop</option>
                                    <option value="forms">Forms</option>
                                    <option value="reusable_sections">Reusable Components</option>
                                </select>
                            </div>

                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                onClick={loadHistory}
                                disabled={loading}
                                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        viewMode === 'timeline'
                                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <History size={14} />
                                    Time Travel
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <Database size={14} />
                                    Logs Table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                    <TableControls
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Search rollback logs..."
                    />
                </div>

                {/* Feedback Alerts */}
                {errorMsg && <Alert variant="error" title="Error" message={errorMsg} />}
                {successMsg && <Alert variant="success" title="Success" message={successMsg} />}                {/* Activity List Card or Timeline */}
                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-20 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm text-center">
                        <RefreshCw className="animate-spin text-brand-500 mx-auto mb-4" size={32} />
                        <p className="text-gray-500 font-medium">Fetching historical event logs...</p>
                    </div>
                ) : viewMode === 'timeline' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        {/* Timeline Column (2 cols) */}
                        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm space-y-4 max-h-[70vh] overflow-y-auto">
                            <h3 className="font-bold text-gray-800 dark:text-white text-base">Revision Timeline</h3>
                            {paginatedHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-450 italic">No revision history found.</div>
                            ) : (
                                <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 space-y-6 py-2">
                                    {paginatedHistory.map((item, idx) => {
                                        const isActive = idx === selectedTimelineIndex;
                                        const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        });
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedTimelineIndex(idx)}
                                                className={`relative pl-8 cursor-pointer group transition-all`}
                                            >
                                                {/* Bullet */}
                                                <div className={`absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 transition-all ${
                                                    isActive 
                                                        ? 'border-blue-600 dark:border-blue-400 scale-125' 
                                                        : 'border-gray-300 dark:border-gray-700 group-hover:border-gray-400'
                                                }`} />
                                                {/* Card */}
                                                <div className={`p-4 rounded-xl border transition-all ${
                                                    isActive
                                                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm'
                                                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/20'
                                                }`}>
                                                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{dateStr}</div>
                                                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-1 capitalize">
                                                        {item.action || 'update'} {getCollectionLabel(item.collectionName)}
                                                    </div>
                                                    <div className="text-xs font-mono text-gray-500 mt-1 truncate">ID: {item.documentId}</div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                                        <User size={12} />
                                                        By {item.updatedBy || 'system'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Interactive Visual Comparison Column (3 cols) */}
                        <div className="lg:col-span-3 space-y-6">
                            {paginatedHistory[selectedTimelineIndex] ? (
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white text-base">Visual Version Comparison</h3>
                                            <p className="text-xs text-gray-400 mt-1">Comparing revision state</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleRollback(paginatedHistory[selectedTimelineIndex])}
                                            disabled={rollbackSaving}
                                            className="flex items-center gap-1.5"
                                        >
                                            <RotateCcw size={14} />
                                            Restore Version
                                        </Button>
                                    </div>

                                    {/* Visual Mock Renderer depending on collection type */}
                                    {(() => {
                                        const item = paginatedHistory[selectedTimelineIndex];
                                        const prev = item.previousData || {};
                                        const next = item.newData || {};
                                        
                                        // Case 1: Hero Slider component
                                        if (item.collectionName === 'hero' || item.collectionName === 'hero_slider') {
                                            return (
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-450">Hero Slider Layout Difference</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Before */}
                                                        <div className="p-4 rounded-xl border border-red-100 bg-red-50/20 dark:border-red-950/30 dark:bg-red-950/10 space-y-2">
                                                            <div className="text-xs font-bold text-red-600 uppercase">Before Edit</div>
                                                            {prev.image ? (
                                                                <img src={prev.image} alt="prev" className="w-full h-24 object-cover rounded-lg border" />
                                                            ) : (
                                                                <div className="w-full h-24 bg-gray-105 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-450">No Image</div>
                                                            )}
                                                            <div className="font-bold text-sm text-gray-800 dark:text-white">{prev.title || 'Untitled'}</div>
                                                            <div className="text-xs text-gray-500 line-clamp-2">{prev.description || 'No description'}</div>
                                                        </div>
                                                        {/* After */}
                                                        <div className="p-4 rounded-xl border border-green-100 bg-green-50/20 dark:border-green-950/30 dark:bg-green-950/10 space-y-2">
                                                            <div className="text-xs font-bold text-green-600 uppercase">After Edit</div>
                                                            {next.image ? (
                                                                <img src={next.image} alt="next" className="w-full h-24 object-cover rounded-lg border" />
                                                            ) : (
                                                                <div className="w-full h-24 bg-gray-105 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-455">No Image</div>
                                                            )}
                                                            <div className="font-bold text-sm text-gray-800 dark:text-white">{next.title || 'Untitled'}</div>
                                                            <div className="text-xs text-gray-500 line-clamp-2">{next.description || 'No description'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Case 2: Settings (Themes/Branding)
                                        if (item.collectionName === 'settings' && (item.documentId === 'theme' || item.documentId === 'branding')) {
                                            return (
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-450">Visual Theme Color Changes</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Before */}
                                                        <div className="p-4 rounded-xl border border-gray-150 dark:border-gray-805 bg-gray-50/50 space-y-3">
                                                            <div className="text-xs font-bold text-gray-400 uppercase">Before Theme</div>
                                                            <div className="flex gap-2">
                                                                {['primaryColor', 'secondaryColor', 'accentColor'].map(key => prev[key] && (
                                                                    <div key={key} className="flex flex-col items-center gap-1">
                                                                        <div className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: prev[key] }} />
                                                                        <span className="text-[10px] text-gray-450 capitalize">{key.replace('Color', '')}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {/* After */}
                                                        <div className="p-4 rounded-xl border border-gray-150 dark:border-gray-805 bg-gray-50/50 space-y-3">
                                                            <div className="text-xs font-bold text-gray-400 uppercase">After Theme</div>
                                                            <div className="flex gap-2">
                                                                {['primaryColor', 'secondaryColor', 'accentColor'].map(key => next[key] && (
                                                                    <div key={key} className="flex flex-col items-center gap-1">
                                                                        <div className="w-8 h-8 rounded-full border shadow-sm" style={{ backgroundColor: next[key] }} />
                                                                        <span className="text-[10px] text-gray-455 capitalize">{key.replace('Color', '')}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Default: Structured Field diff rendering
                                        return <VisualDiff prev={prev} next={next} />;
                                    })()}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-gray-200 bg-white p-10 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm text-center text-gray-400 italic">
                                    Select a revision from the timeline to see differences.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                                <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border-b border-gray-150 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Timestamp</th>
                                        <th className="px-6 py-4 font-semibold">Content Type</th>
                                        <th className="px-6 py-4 font-semibold">Document ID</th>
                                        <th className="px-6 py-4 font-semibold">Action</th>
                                        <th className="px-6 py-4 font-semibold">Editor</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                                    {paginatedHistory.map((item) => {
                                        const actionColors = {
                                            create: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
                                            update: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
                                            delete: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                                        };
                                        const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        });

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {dateStr}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-850 dark:text-gray-300 text-xs font-semibold">
                                                        <Database size={12} className="text-gray-400" />
                                                        {getCollectionLabel(item.collectionName)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs max-w-[200px] truncate" title={item.documentId}>
                                                    {item.documentId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${actionColors[item.action as keyof typeof actionColors] || ''}`}>
                                                        {item.action ? item.action.toUpperCase() : 'UNKNOWN'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5 text-gray-500">
                                                        <User size={14} className="text-gray-400" />
                                                        {item.updatedBy || 'system'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-lg text-xs"
                                                            onClick={() => {
                                                                setActiveItem(item);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                        >
                                                            <Eye size={14} className="mr-1" />
                                                            View Details
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="rounded-lg text-xs"
                                                            onClick={() => handleRollback(item)}
                                                            disabled={rollbackSaving}
                                                        >
                                                            <RotateCcw size={14} className="mr-1" />
                                                            Rollback
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {paginatedHistory.length === 0 && (
                                <div className="text-center py-16 text-gray-505">
                                    No historical logs matched your selection.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
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

            {/* Visual Diff Details Modal */}
            <Modal
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setActiveItem(null);
                }}
                title="Historical Change Details & Visual Diff"
                size="xl"
            >
                {activeItem && (
                    <div className="space-y-6">
                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-150 dark:border-gray-800 text-sm">
                            <div>
                                <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Content Type</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{getCollectionLabel(activeItem.collectionName)}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Document ID</span>
                                <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 truncate block max-w-xs">{activeItem.documentId}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Change Date</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(activeItem.timestamp).toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Edited By</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{activeItem.updatedBy || 'system'}</span>
                            </div>
                        </div>

                        {/* Change Summary Card */}
                        {(() => {
                            const summary = getChangeSummary(activeItem);
                            const hasChanges = (summary.added?.length || 0) > 0 || (summary.removed?.length || 0) > 0 || (summary.modified?.length || 0) > 0;
                            
                            return (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Change Summary</h4>
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/10">
                                        <div className="flex gap-3">
                                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <div className="space-y-2 flex-1">
                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                                    {summary.description}
                                                </p>
                                                
                                                {summary.type === 'update' && hasChanges && (
                                                    <div className="flex flex-wrap gap-2.5 mt-2 text-xs">
                                                        {summary.added && summary.added.length > 0 && (
                                                            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200/50 dark:border-green-900/30 px-2.5 py-1 rounded-lg">
                                                                <span className="font-semibold">Added:</span>
                                                                <span className="font-mono">{summary.added.join(', ')}</span>
                                                            </div>
                                                        )}
                                                        {summary.modified && summary.modified.length > 0 && (
                                                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 px-2.5 py-1 rounded-lg">
                                                                <span className="font-semibold">Modified:</span>
                                                                <span className="font-mono">{summary.modified.join(', ')}</span>
                                                            </div>
                                                        )}
                                                        {summary.removed && summary.removed.length > 0 && (
                                                            <div className="flex items-center gap-1.5 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 px-2.5 py-1 rounded-lg">
                                                                <span className="font-semibold">Removed:</span>
                                                                <span className="font-mono">{summary.removed.join(', ')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Diff Render */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Field Comparisons</h4>
                            <div className="border border-gray-150 dark:border-gray-800 rounded-2xl p-4 bg-gray-50/10 max-h-[50vh] overflow-y-auto">
                                <VisualDiff prev={activeItem.previousData} next={activeItem.newData} />
                            </div>
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-150 dark:border-gray-800">
                            <span className="text-xs text-gray-400">
                                Action Log ID: <span className="font-mono">{activeItem.id}</span>
                            </span>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDetailsOpen(false);
                                        setActiveItem(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handleRollback(activeItem)}
                                    disabled={rollbackSaving}
                                    className="flex items-center gap-1.5"
                                >
                                    <RotateCcw size={16} />
                                    {activeItem.action === 'create' ? 'Delete to Revert' : activeItem.action === 'delete' ? 'Restore Document' : 'Rollback to Prior State'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </ProtectedRoute>
    );
}
