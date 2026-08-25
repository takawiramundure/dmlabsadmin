export interface NavigationItem {
    id: string;
    name: string;
    path: string;
    isExternal?: boolean;
    isHidden?: boolean;
    subItems?: NavigationItem[];
    order: number;
}

export interface SiteBranding {
    logo: string; // URL to uploaded logo
    logoHeight?: number; // Custom height in pixels
    siteName: string;
    favicon?: string;
}

export interface SiteTheme {
    primary: string;
    secondary: string;
    accent: string;
    textDark: string;
    textLight: string;
    brandColor: string;
    brandColorDark: string;
    brandColorLight: string;
    topBarBg: string;
    headerBg: string; // Background color for the main header
}

export interface TopBarSettings {
    enabled: boolean;
    message: string;
    phone: string;
    email: string;
    buttonLabel?: string;
    buttonLink?: string;
}

export interface EmergencyBarSettings {
    enabled: boolean;
    content: string; // HTML content
    bgColor: string;
}

export interface PaymentSettings {
    stripePublicKey?: string;
    squareAppId?: string;
    squareLocationId?: string;
    skrillMerchantEmail?: string;
    currency: string;
}

export interface SiteSettings {
    siteId: string;
    branding: SiteBranding;
    theme: SiteTheme;
    emergencyBar?: EmergencyBarSettings;
    topBar?: TopBarSettings;
    navigation: NavigationItem[];
    paymentGateways?: PaymentSettings;
    metadata: {
        lastUpdated: string;
        updatedBy: string;
    };
    // SEO & Metadata
    siteTitle?: string;
    siteDescription?: string;
    siteKeywords?: string;
    headerScripts?: string;
    bodyScripts?: string;
    supportEmail?: string;
    supportTicketLink?: string;
    maintenanceMode?: boolean;
    maintenanceScope?: 'all' | 'production' | 'development';
    retellAi?: {
        enabled: boolean;
        publicKey: string;
        agentId: string;
        widgetType: 'chat' | 'callback';
        phoneNumber?: string;
        termsUrl?: string;
        title?: string;
        botName?: string;
        logoUrl?: string;
    };
    aiSettings?: {
        provider: 'gemini' | 'openai' | 'anthropic' | 'custom';
        apiKey?: string;
        model?: string;
        systemPrompt?: string;
        brandTone?: string;
        enabled?: boolean;
    };
    integrations?: {
        n8nWebhookUrl?: string;
        slackWebhookUrl?: string;
        ticketSystemApiUrl?: string;
        ticketSystemApiKey?: string;
        supportEmail?: string;
        telegramBotToken?: string;
        telegramChatId?: string;
        clickupApiKey?: string;
        clickupListId?: string;
    };
}
