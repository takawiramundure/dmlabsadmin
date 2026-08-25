"use client";

import { useState, useRef, useEffect } from 'react';
import { useSite } from "@/context/SiteContext";

export default function SiteSelector() {
    const { currentSite, switchSite, sites } = useSite();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hide selector if in single-tenant mode or only 1 site is available
    if (process.env.NEXT_PUBLIC_SINGLE_TENANT_ID || sites.length <= 1) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>{currentSite.name} Admin</span>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span>{currentSite.name}</span>
                </div>
                <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Select Client Site
                        </div>
                        {sites.map((site) => (
                            <button
                                key={site.id}
                                onClick={() => {
                                    switchSite(site.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${currentSite.id === site.id
                                    ? 'bg-primary text-white'
                                    : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <div className="font-bold">{site.name}</div>
                                {site.id !== currentSite.id && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {site.description}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
