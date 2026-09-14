"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initGoogleClient, setAccessToken, getAnalyticsReport, getDemographicsReport, getTopPagesReport, getDeviceCategoryReport, getEngagementReport, getSourceMediumReport, getBrowserReport } from "@/services/analyticsService";
import { useGoogleLogin } from '@react-oauth/google';
import { ANALYTICS_CONFIG } from "@/config/analyticsConfig";
import { useSite } from './SiteContext';

interface AnalyticsContextType {
    isConnected: boolean;
    isInitialized: boolean;
    propertyId: string;
    setPropertyId: (id: string) => void;
    connect: () => void;
    disconnect: () => void;
    analyticsData: any | null;
    demographicsData: any | null;
    topPagesData: any | null;
    deviceData: any | null;
    sourceMediumData: any | null;
    browserData: any | null;
    engagementData: any | null;
    fetchData: () => Promise<void>;
    loadingData: boolean;
    error: string | null;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
    isConnected: false,
    isInitialized: false,
    propertyId: '',
    setPropertyId: () => { },
    connect: () => { },
    disconnect: () => { },
    analyticsData: null,
    demographicsData: null,
    topPagesData: null,
    deviceData: null,
    sourceMediumData: null,
    browserData: null,
    engagementData: null,
    fetchData: async () => { },
    loadingData: false,
    error: null,
});

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
    const { currentSite } = useSite();
    const [isConnected, setIsConnected] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    
    const [propertyId, setPropertyId] = useState(ANALYTICS_CONFIG.DEFAULT_PROPERTY_ID);
    const [analyticsData, setAnalyticsData] = useState<any | null>(null);
    const [demographicsData, setDemographicsData] = useState<any | null>(null);
    const [topPagesData, setTopPagesData] = useState<any | null>(null);
    const [deviceData, setDeviceData] = useState<any | null>(null);
    const [sourceMediumData, setSourceMediumData] = useState<any | null>(null);
    const [browserData, setBrowserData] = useState<any | null>(null);
    const [engagementData, setEngagementData] = useState<any | null>(null);

    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Load persisted state on mount
        const savedPropertyId = localStorage.getItem('ga4_property_id');
        if (savedPropertyId) setPropertyId(savedPropertyId);
        
        const savedToken = localStorage.getItem('ga_access_token');
        if (savedToken) {
            setToken(savedToken);
            setAccessToken(savedToken);
            setIsConnected(true);
        }
        
        const initialize = async () => {
            try {
                await initGoogleClient();
                setIsInitialized(true);
            } catch (error) {
                console.error("Failed to initialize Google Analytics client", error);
                setError("Failed to initialize Google API. Please refresh capabilities.");
            }
        };
        initialize();
    }, []);

    useEffect(() => {
        if (propertyId) {
            localStorage.setItem('ga4_property_id', propertyId);
        }
    }, [propertyId]);

    // Sync property ID when site changes
    useEffect(() => {
        if (currentSite?.ga4PropertyId) {
            setPropertyId(currentSite.ga4PropertyId);
            // Clear existing data so we don't show old site info while loading
            setAnalyticsData(null);
            setEngagementData(null);
            setTopPagesData(null);
            setDeviceData(null);
            setDemographicsData(null);
        } else if (currentSite && !currentSite.ga4PropertyId) {
            // If no GA4 for this site, clear it
            setPropertyId('');
            setAnalyticsData(null);
        }
    }, [currentSite]);

    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            const accessToken = tokenResponse.access_token;
            setAccessToken(accessToken);
            setToken(accessToken);
            localStorage.setItem('ga_access_token', accessToken);
            setIsConnected(true);
            setError(null);
        },
        onError: (errorResponse) => {
            console.error("Login Failed:", errorResponse);
            setError("Login Failed. Please try again.");
        },
        scope: ANALYTICS_CONFIG.SCOPES,
    });

    const connect = () => {
        setError(null);
        login();
    };

    const disconnect = () => {
        setError(null);
        setToken(null);
        localStorage.removeItem('ga_access_token');
        setAccessToken('');
        setIsConnected(false);
        setAnalyticsData(null);
        setDemographicsData(null);
        setTopPagesData(null);
        setDeviceData(null);
        setSourceMediumData(null);
        setBrowserData(null);
        setEngagementData(null);
    };

    const fetchData = async () => {
        if (!propertyId) {
            setError("Please enter a Property ID.");
            return;
        }
        setLoadingData(true);
        setError(null);
        try {
            if (token) setAccessToken(token);

            // Fetch ALL reports in parallel
            const [reportData, demoData, pagesData, devicesData, engageData, sourceData, brData] = await Promise.all([
                getAnalyticsReport(propertyId),
                getDemographicsReport(propertyId),
                getTopPagesReport(propertyId),
                getDeviceCategoryReport(propertyId),
                getEngagementReport(propertyId),
                getSourceMediumReport(propertyId),
                getBrowserReport(propertyId)
            ]);
            
            setAnalyticsData(reportData);
            setDemographicsData(demoData);
            setTopPagesData(pagesData);
            setDeviceData(devicesData);
            setEngagementData(engageData);
            setSourceMediumData(sourceData);
            setBrowserData(brData);

        } catch (error: any) {
            console.error("Failed to fetch analytics data", error);
            if (error?.result?.error?.code === 401 || error?.status === 401) {
                setError("Session expired. Please reconnect.");
                disconnect();
            } else {
                setError("Failed to fetch data. " + (error?.result?.error?.message || error?.message || JSON.stringify(error)));
            }
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <AnalyticsContext.Provider value={{
            isConnected,
            isInitialized,
            propertyId,
            setPropertyId,
            connect,
            disconnect,
            analyticsData,
            demographicsData,
            topPagesData,
            deviceData,
            sourceMediumData,
            browserData,
            engagementData,
            fetchData,
            loadingData,
            error
        }}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => useContext(AnalyticsContext);
