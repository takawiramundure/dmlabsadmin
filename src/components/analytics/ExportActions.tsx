"use client";

import React, { useState } from 'react';
import { Download, Share2, Printer, Copy, Check } from 'lucide-react';
import { FirestoreService } from "@/services/firestore";

interface ExportActionsProps {
    siteId: string;
    data: any;
}

const ExportActions: React.FC<ExportActionsProps> = ({ siteId, data }) => {
    const [sharing, setSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCSVExport = () => {
        if (!data?.topPagesData?.rows) return;
        
        const headers = ["Page Title", "Page Path", "Views", "Active Users"];
        const rows = data.topPagesData.rows.map((row: any) => [
            `"${row.dimensionValues[1].value}"`,
            `"${row.dimensionValues[0].value}"`,
            row.metricValues[0].value,
            row.metricValues[1].value
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `analytics_report_${siteId}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            // Save snapshot to Firestore
            const snapshotData = {
                siteId,
                timestamp: new Date().toISOString(),
                data: {
                    analyticsData: data.analyticsData,
                    demographicsData: data.demographicsData,
                    topPagesData: data.topPagesData,
                    deviceData: data.deviceData,
                    engagementData: data.engagementData,
                    sourceMediumData: data.sourceMediumData,
                    browserData: data.browserData
                }
            };
            
            const snapshotId = await FirestoreService.saveAnalyticsSnapshot(siteId, snapshotData);
            const url = `${window.location.origin}/share/analytics/${snapshotId}`;
            setShareUrl(url);
        } catch (error) {
            console.error("Failed to generate share link:", error);
        } finally {
            setSharing(false);
        }
    };

    const copyToClipboard = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={handleCSVExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <Download size={16} />
                    Export CSV
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <Printer size={16} />
                    Download PDF
                </button>
                <button 
                    onClick={handleShare}
                    disabled={sharing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                >
                    <Share2 size={16} />
                    {sharing ? 'Generating...' : 'Create Share Link'}
                </button>
            </div>

            {shareUrl && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Client Sharing Is Ready</span>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                            <input 
                                type="text" 
                                readOnly 
                                value={shareUrl} 
                                className="flex-1 bg-transparent text-xs text-gray-500 outline-none"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Anyone with this link can view the analytics snapshot. No login required.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportActions;
