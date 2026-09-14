"use client";

import React from 'react';

interface SourceStatsProps {
    data: any;
}

const SourceStatsCard: React.FC<SourceStatsProps> = ({ data }) => {
    // Parse GA4 Source/Medium data
    const rows = data?.rows || [];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <svg className="text-blue-500 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Traffic Sources
                </h2>
                <span className="text-xs text-gray-400 capitalize">Source / Medium</span>
            </div>
            <div className="p-0">
                {rows.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Source / Medium</th>
                                <th className="px-6 py-3 text-right">Users</th>
                                <th className="px-6 py-3 text-right">Sessions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {rows.map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                                        <div className="flex flex-col">
                                            <span>{row.dimensionValues[0].value}</span>
                                            <span className="text-[10px] text-gray-400 font-normal uppercase">{row.dimensionValues[1].value}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800 dark:text-white">
                                        {parseInt(row.metricValues[0].value).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                                        {parseInt(row.metricValues[1].value).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-gray-400 italic">No source data available.</div>
                )}
            </div>
        </div>
    );
};

export default SourceStatsCard;
