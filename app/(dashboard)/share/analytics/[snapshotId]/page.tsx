"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { FirestoreService } from "@/services/firestore";
import PageMeta from "@/components/common/PageMeta";
import EcommerceMetrics from "@/components/ecommerce/EcommerceMetrics";
import TrafficChart from "@/components/ecommerce/TrafficChart";
import DeviceStats from "@/components/ecommerce/DeviceStats";
import TopPagesTable from "@/components/ecommerce/TopPagesTable";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import SourceStatsCard from "@/components/analytics/SourceStatsCard";
import BrowserStatsCard from "@/components/analytics/BrowserStatsCard";
import { AlertCircle, Clock } from 'lucide-react';

const SharedAnalytics: React.FC = () => {
    const params = useParams();
    const snapshotId = typeof params?.snapshotId === 'string' ? params.snapshotId : '';
    const searchParams = useSearchParams();
    const siteId = searchParams?.get('site') || 'nspc'; // Default or from URL
    
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSnapshot = async () => {
            if (!snapshotId) return;
            setLoading(true);
            try {
                const data = await FirestoreService.getAnalyticsSnapshot(snapshotId, siteId);
                if (data) {
                    setSnapshot(data);
                } else {
                    setError("Snapshot not found or link has expired.");
                }
            } catch (err) {
                console.error("Error loading shared analytics:", err);
                setError("Failed to load shared analytics report.");
            } finally {
                setLoading(false);
            }
        };
        loadSnapshot();
    }, [snapshotId, siteId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-bold">Loading Secure Report...</p>
                </div>
            </div>
        );
    }

    if (error || !snapshot) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
                    <AlertCircle className="text-red-500 size-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Error</h1>
                    <p className="text-gray-500">{error || "Invalid share link."}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { data, timestamp } = snapshot;
    const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <PageMeta title={`Analytics Report | ${siteId.toUpperCase()}`} description="Shared analytics snapshot" />
            
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Public Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest">Client View</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} />
                                Generated on {formattedDate}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics Performance Report</h1>
                        <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest">Site ID: {siteId}</p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <div className="text-lg font-black text-blue-600">Digital Maples Agency</div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Internal Reporting Tool</div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Metrics Dashboard */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <EcommerceMetrics data={data.analyticsData} engagement={data.engagementData} />
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Highlights */}
                        <div className="col-span-12 lg:col-span-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <TrafficChart data={data.analyticsData} />
                        </div>
                        <div className="col-span-12 lg:col-span-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
                            <DeviceStats data={data.deviceData} />
                        </div>

                        {/* Detail Panels */}
                        <div className="col-span-12 lg:col-span-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <TopPagesTable data={data.topPagesData} />
                        </div>
                        <div className="col-span-12 lg:col-span-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            <DemographicCard data={data.demographicsData} />
                        </div>

                        {/* Core Advanced */}
                        <div className="col-span-12 lg:col-span-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
                            <SourceStatsCard data={data.sourceMediumData} />
                        </div>
                        <div className="col-span-12 lg:col-span-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
                            <BrowserStatsCard data={data.browserData} />
                        </div>
                    </div>
                </div>

                {/* Secure Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    <p>© {new Date().getFullYear()} Digital Maples Agency. All rights reserved.</p>
                    <p>Internal Tracking UUID: {snapshotId}</p>
                </div>
            </div>
        </div>
    );
};

export default SharedAnalytics;
