"use client";

import React from 'react';

interface BrowserStatsProps {
    data: any;
}

const BrowserStatsCard: React.FC<BrowserStatsProps> = ({ data }) => {
    // Parse GA4 Browser/OS data
    const rows = data?.rows || [];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <svg className="text-purple-500 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Browsers & OS
                </h2>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Technology Profile</p>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                    {rows.length > 0 ? (
                        rows.map((row: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                            {row.dimensionValues[0].value}
                                        </span>
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded text-gray-500">
                                            {row.dimensionValues[1].value}
                                        </span>
                                    </div>
                                    <span className="font-black text-gray-900 dark:text-white">
                                        {parseInt(row.metricValues[0].value).toLocaleString()} users
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-purple-500 rounded-full" 
                                        style={{ width: `${Math.min(100, (parseInt(row.metricValues[0].value) / parseInt(rows[0].metricValues[0].value)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-400 italic">No technical data available.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrowserStatsCard;
