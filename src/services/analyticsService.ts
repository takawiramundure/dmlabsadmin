import { gapi } from 'gapi-script';
import { ANALYTICS_CONFIG } from "@/config/analyticsConfig";

// Reusable runReport Wrapper
const runReport = async (propertyId: string, dimensions: any[], metrics: any[], orderBys?: any[], limit: number = 10) => {
    try {
        const response = await gapi.client.analyticsdata.properties.runReport({
            property: `properties/${propertyId}`,
            resource: {
                dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], // Default range
                dimensions,
                metrics,
                orderBys,
                limit: limit as any
            },
        });
        return response.result;
    } catch (error) {
        console.error('Analytics API Error:', error);
        throw error;
    }
};

export const initGoogleClient = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        gapi.load('client', () => {
            gapi.client.init({
                clientId: ANALYTICS_CONFIG.CLIENT_ID,
                discoveryDocs: ANALYTICS_CONFIG.DISCOVERY_DOCS,
            })
                .then(() => resolve())
                .catch((error: any) => {
                    console.error('Error initializing Google Client', error);
                    reject(error);
                });
        });
    });
};

export const setAccessToken = (token: string) => {
    if (gapi.client) {
        gapi.client.setToken({ access_token: token });
    } else {
        console.error("gapi.client not initialized");
    }
};

// --- Report Functions ---

// 1. Core Metrics (Active Users, Sessions, Views)
export const getAnalyticsReport = async (propertyId: string) => {
    return runReport(propertyId,
        [{ name: 'date' }],
        [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        [{ dimension: { dimensionName: 'date' } }]
    );
};

// 2. Demographics (Country)
export const getDemographicsReport = async (propertyId: string) => {
    return runReport(propertyId,
        [{ name: 'country' }],
        [{ name: 'activeUsers' }],
        [{ metric: { metricName: 'activeUsers' }, desc: true }],
        5
    );
};

// 3. Top Pages
export const getTopPagesReport = async (propertyId: string) => {
    return runReport(propertyId,
        [{ name: 'pagePath' }, { name: 'pageTitle' }],
        [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        10
    );
};

// 4. Device Category
export const getDeviceCategoryReport = async (propertyId: string) => {
    return runReport(propertyId,
        [{ name: 'deviceCategory' }],
        [{ name: 'activeUsers' }],
        [{ metric: { metricName: 'activeUsers' }, desc: true }]
    );
};

// 6. Source / Medium
export const getSourceMediumReport = async (propertyId: string) => {
    return runReport(propertyId,
        [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        [{ name: 'activeUsers' }, { name: 'sessions' }],
        [{ metric: { metricName: 'activeUsers' }, desc: true }],
        10
    );
};

// 7. Browser / OS
export const getBrowserReport = async (propertyId: string) => {
    return runReport(propertyId,
        [{ name: 'browser' }, { name: 'operatingSystem' }],
        [{ name: 'activeUsers' }],
        [{ metric: { metricName: 'activeUsers' }, desc: true }],
        10
    );
};

// 5. Engagement (Average Session Duration)
// Note: 'userEngagementDuration' is total seconds. 'sessions' is count.
// To get avg, we might need to calculate or use 'averageSessionDuration' if available in API, 
// but 'averageSessionDuration' is a computed metric. GA4 API supports 'averageSessionDuration'.
export const getEngagementReport = async (propertyId: string) => {
    return runReport(propertyId,
        [], // No dimension, just totals
        [{ name: 'averageSessionDuration' }, { name: 'engagementRate' }],
        [],
        1
    );
};
