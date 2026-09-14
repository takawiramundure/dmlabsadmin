import { SiteSettings, NavigationItem } from "@/types/siteSettings";

// Extract current BWEIC navigation from Navbar.tsx
const bweicNavigation: NavigationItem[] = [
    {
        id: 'nav-who-we-are',
        name: 'WHO WE ARE',
        path: '/who-we-are',
        order: 1,
        subItems: [
            { id: 'nav-our-story', name: 'Our Story', path: '/our-story', order: 1 },
            { id: 'nav-leadership', name: 'Leadership', path: '/leadership', order: 2 },
            { id: 'nav-board-members', name: 'Board Members', path: '/board-members', order: 3 },
            { id: 'nav-partners', name: 'Partners', path: '/partners', order: 4 },
            { id: 'nav-careers', name: 'Careers', path: '/careers', order: 5 }
        ]
    },
    {
        id: 'nav-our-work',
        name: 'OUR WORK',
        path: '/our-work',
        order: 2,
        subItems: [
            { id: 'nav-healing', name: 'Healing & Wellness', path: '/signature-programs', order: 1 },
            { id: 'nav-empowerment', name: 'Empowerment & Capacity Building', path: '/special-initiatives', order: 2 },
            { id: 'nav-community', name: 'Community & Belonging', path: '/policy-research', order: 3 },
            { id: 'nav-sovereignty', name: 'The Sovereignty Circle', path: '/publications', order: 4 }
        ]
    },
    {
        id: 'nav-take-action',
        name: 'TAKE ACTION',
        path: '/take-action',
        order: 3
    },
    {
        id: 'nav-media-center',
        name: 'MEDIA CENTER',
        path: '/media-center',
        order: 4,
        subItems: [
            { id: 'nav-videos', name: 'Videos', path: '/videos', order: 1 },
            { id: 'nav-upcoming-events', name: 'Upcoming Events', path: '/upcoming-events', order: 2 },
            { id: 'nav-media-partners', name: 'Partners', path: '/partners', order: 3 }
        ]
    },
    {
        id: 'nav-blog',
        name: 'BLOG',
        path: '/blogs',
        order: 5
    },
    {
        id: 'nav-shop',
        name: 'SHOP',
        path: '/shop',
        order: 6
    }
];

const nspcNavigation: NavigationItem[] = [
    { id: 'nav-home', name: 'Home', path: '/', order: 1 },
    { id: 'nav-resources', name: 'Resources', path: '/resources', order: 2 },
    { id: 'nav-understanding', name: 'Understanding', path: '/understanding', order: 3 },
    { id: 'nav-coping', name: 'Coping', path: '/coping', order: 4 },
    { id: 'nav-programs', name: 'Programs', path: '/programs', order: 5 }
];

const kmfwNavigation: NavigationItem[] = [
    { id: 'nav-home', name: 'Home', path: '/', order: 1 },
    { id: 'nav-about', name: 'Our Story', path: '/about', order: 2 },
    { id: 'nav-services', name: 'Programs & Services', path: '/services', order: 3 },
    { id: 'nav-impact', name: 'Impact', path: '/impact', order: 4 },
    { id: 'nav-join-us', name: 'Join Us', path: '/join', order: 5 },
    { id: 'nav-contact', name: 'Contact', path: '/contact', order: 6 }
];

const elwgNavigation: NavigationItem[] = [
    { id: 'nav-home', name: 'Home', path: '/', order: 1 },
    { id: 'nav-about', name: 'About Us', path: '/about', order: 2 },
    { id: 'nav-programs', name: 'Programs', path: '/programs', order: 3 },
    { id: 'nav-volunteers', name: 'Volunteers', path: '/volunteers', order: 4 },
    { id: 'nav-contact', name: 'Contact', path: '/contact', order: 5 },
    { id: 'nav-donate', name: 'Donate', path: '/donate', order: 6 }
];

const noelNavigation: NavigationItem[] = [
    { id: 'nav-home', name: 'Home', path: '/', order: 1 },
    { id: 'nav-services', name: 'Services', path: '/services', order: 2 },
    { id: 'nav-portfolio', name: 'Portfolio', path: '/portfolio', order: 3 },
    { id: 'nav-before-after', name: 'Before & After', path: '/before-after', order: 4 },
    { id: 'nav-reviews', name: 'Reviews', path: '/reviews', order: 5 },
    { id: 'nav-contact', name: 'Contact', path: '/contact', order: 6 }
];

const aitasolNavigation: NavigationItem[] = [
    { id: 'nav-home', name: 'Home', path: '/', order: 1 },
    { id: 'nav-about', name: 'About Us', path: '/about', order: 2 },
    { id: 'nav-destinations', name: 'Destinations', path: '/destinations', order: 3 },
    { id: 'nav-services', name: 'Services', path: '/services', order: 4 },
    { id: 'nav-universities', name: 'Universities', path: '/universities', order: 5 },
    { id: 'nav-blog', name: 'Resources', path: '/blog', order: 6 },
    { id: 'nav-contact', name: 'Contact', path: '/contact', order: 7 }
];

export const SETTINGS_SEED_DATA: Record<string, SiteSettings> = {
    nspc: {
        siteId: 'nspc', branding: { logo: '', siteName: 'NSPC', favicon: '' }, theme: { primary: '#000', secondary: '#000', accent: '#000', textDark: '#000', textLight: '#fff', brandColor: '#000', brandColorDark: '#000', brandColorLight: '#000', topBarBg: '#000', headerBg: '#fff' }, navigation: nspcNavigation, metadata: { lastUpdated: '', updatedBy: '' }
    },
    bweic: {
        siteId: 'bweic', branding: { logo: '', siteName: 'BWEIC', favicon: '' }, theme: { primary: '#000', secondary: '#000', accent: '#000', textDark: '#000', textLight: '#fff', brandColor: '#000', brandColorDark: '#000', brandColorLight: '#000', topBarBg: '#000', headerBg: '#fff' }, navigation: bweicNavigation, metadata: { lastUpdated: '', updatedBy: '' }
    },
    kmfw: {
        siteId: 'kmfw', branding: { logo: '', siteName: 'KMFW', favicon: '' }, theme: { primary: '#000', secondary: '#000', accent: '#000', textDark: '#000', textLight: '#fff', brandColor: '#000', brandColorDark: '#000', brandColorLight: '#000', topBarBg: '#000', headerBg: '#fff' }, navigation: kmfwNavigation, metadata: { lastUpdated: '', updatedBy: '' }
    },
    elwg: {
        siteId: 'elwg',
        branding: {
            logo: '/logo.png', // Replace with actual logo path if known
            siteName: 'Elliot Lake Women\'s Group',
            favicon: '/favicon.ico'
        },
        theme: {
            primary: '#71220B', // Burgundy
            secondary: '#111827', // Gray-900
            accent: '#D4AF37', // Gold
            textDark: '#111827',
            textLight: '#FFFFFF',
            brandColor: '#71220B',
            brandColorDark: '#5E1D09',
            brandColorLight: '#8B2C0D',
            topBarBg: '#71220B',
            headerBg: '#FAF9F6' // Off-white
        },
        navigation: elwgNavigation,
        metadata: {
            lastUpdated: new Date().toISOString(),
            updatedBy: 'system'
        }
    },
    noel: {
        siteId: 'noel',
        branding: {
            logo: '/logo.png',
            siteName: 'Noel Construction',
            favicon: '/favicon.ico'
        },
        theme: {
            primary: '#2E7D32', // Forest Green
            secondary: '#1C1C1C', // Charcoal
            accent: '#A5D6A7', // Sage
            textDark: '#1C1C1C',
            textLight: '#FFFFFF',
            brandColor: '#2E7D32',
            brandColorDark: '#1B5E20',
            brandColorLight: '#4CAF50',
            topBarBg: '#2E7D32',
            headerBg: '#F9F6F1' // Off-white
        },
        navigation: noelNavigation,
        metadata: {
            lastUpdated: new Date().toISOString(),
            updatedBy: 'system'
        }
    },
    aitasol: {
        siteId: 'aitasol',
        branding: {
            logo: '/logo.png',
            siteName: 'Aitasol Education',
            favicon: '/favicon.ico'
        },
        theme: {
            primary: '#1E3A5F', // Navy
            secondary: '#2D5F9E', // Light Navy
            accent: '#F59E0B', // Gold
            textDark: '#111827',
            textLight: '#FFFFFF',
            brandColor: '#1E3A5F',
            brandColorDark: '#162A45',
            brandColorLight: '#2D5F9E',
            topBarBg: '#1E3A5F',
            headerBg: '#FAFAF9'
        },
        navigation: aitasolNavigation,
        metadata: {
            lastUpdated: new Date().toISOString(),
            updatedBy: 'system'
        }
    }
};
