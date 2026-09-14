"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Site, SITES, getSiteById, getDefaultSite } from "@/config/sites";

interface SiteContextType {
    currentSite: Site;
    switchSite: (siteId: string) => void;
    sites: Site[];
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedSiteId';

import { useAuth } from './AuthContext';

export function SiteProvider({ children }: { children: ReactNode }) {
    const { profile } = useAuth();

    const [customSites, setCustomSites] = useState<Site[]>([]);

    useEffect(() => {
        const loadCustomSites = async () => {
            try {
                const { FirestoreService } = await import('@/services/firestore');
                const list = await FirestoreService.getCustomSites();
                if (list && list.length > 0) {
                    const { registerDynamicSite } = await import('@/config/sites');
                    list.forEach((site: Site) => registerDynamicSite(site));
                    setCustomSites(list);
                }
            } catch (error) {
                console.error("Error loading custom sites in context:", error);
            }
        };
        loadCustomSites();
    }, []);

    const allSites = React.useMemo(() => {
        return [...SITES, ...customSites];
    }, [customSites]);

    // Calculate available sites based on profile
    const availableSites = React.useMemo(() => {
        if (!profile) return [];
        if (profile.role === 'super_admin') return allSites;

        // For editors, filter strictly
        return allSites.filter(site => profile.allowedSites?.includes(site.id));
    }, [profile, allSites]);

    const [currentSite, setCurrentSite] = useState<Site>(getDefaultSite());

    useEffect(() => {
        const savedSiteId = localStorage.getItem(STORAGE_KEY);
        if (savedSiteId) {
            const site = getSiteById(savedSiteId);
            if (site) setCurrentSite(site);
        }
    }, []);

    // Validate and correct current site when profile/availableSites changes
    useEffect(() => {
        if (availableSites.length === 0) return;

        const isAllowed = availableSites.find(s => s.id === currentSite.id);
        if (!isAllowed) {
            // Default to first available
            const firstAvailable = availableSites[0];
            setCurrentSite(firstAvailable);
            localStorage.setItem(STORAGE_KEY, firstAvailable.id);
        }
    }, [availableSites, currentSite]);

    const switchSite = React.useCallback((siteId: string) => {
        // Validation check
        const isAllowed = availableSites.find(s => s.id === siteId);
        if (isAllowed) {
            setCurrentSite(isAllowed);
            localStorage.setItem(STORAGE_KEY, siteId);
        } else {
            console.warn("Attempted to switch to unauthorized site");
        }
    }, [availableSites]);

    const value = React.useMemo(() => ({
        currentSite,
        switchSite,
        sites: availableSites
    }), [currentSite, switchSite, availableSites]);

    return (
        <SiteContext.Provider value={value}>
            {children}
        </SiteContext.Provider>
    );
}

export function useSite() {
    const context = useContext(SiteContext);
    if (context === undefined) {
        throw new Error('useSite must be used within a SiteProvider');
    }
    return context;
}
