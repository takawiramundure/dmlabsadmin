// Google Analytics Configuration

// To make this portal reusable:
// 1. Create a new project in Google Cloud Console
// 2. Enable Google Analytics Data API
// 3. Create OAuth 2.0 Credentials (matches CLIENT_ID below)
// 4. Create a request for PROPERTY_ID (matches GA4 Property ID)
// 5. Update these values below.

export const ANALYTICS_CONFIG = {
    CLIENT_ID: '188862434218-djb1m3vaa7srp7mcffput5slqoqfbd4i.apps.googleusercontent.com',
    DEFAULT_PROPERTY_ID: '509768055', // NSPC Property ID
    DISCOVERY_DOCS: ['https://analyticsdata.googleapis.com/$discovery/rest?version=v1beta'],
    SCOPES: 'https://www.googleapis.com/auth/analytics.readonly'
};
