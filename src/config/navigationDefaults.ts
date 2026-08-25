import { NavigationItem } from "@/types/siteSettings";

export const GET_DEFAULT_NAV = (siteId: string): NavigationItem[] => {
    switch (siteId) {
        case 'noel':
            return [
                { id: 'n-home', name: 'Home', path: '/', order: 1 },
                { id: 'n-services', name: 'Services', path: '/services', order: 2, subItems: [
                    { id: 'n-serv-exterior', name: 'Exterior Work', path: '/services/exterior-work', order: 1 },
                    { id: 'n-serv-sustainable', name: 'Sustainability', path: '/services/sustainability', order: 2 },
                    { id: 'n-serv-decks', name: 'Decks & Patios', path: '/services/decks-patios', order: 3 },
                    { id: 'n-serv-stairs', name: 'Stairs & Railings', path: '/services/stairs-railings', order: 4 },
                    { id: 'n-serv-renovations', name: 'Renovations', path: '/services/renovations', order: 5 },
                    { id: 'n-serv-eco', name: 'Eco-Solutions', path: '/services/eco-solutions', order: 6 },
                    { id: 'n-serv-quote', name: 'Get Quote', path: '/services/get-quote', order: 7 },
                ] },
                { id: 'n-portfolio', name: 'Portfolio', path: '/portfolio', order: 3 },
                { id: 'n-before-after', name: 'Before & After', path: '/before-after', order: 4 },
                { id: 'n-reviews', name: 'Reviews', path: '/reviews', order: 5 },
                { id: 'n-contact', name: 'Contact', path: '/contact', order: 6 },
            ];
        case 'elwg':
            return [
                { id: 'e-home', name: 'Home', path: '/', order: 1 },
                { id: 'e-about', name: 'About Us', path: '/about', order: 2 },
                { id: 'e-programs', name: 'Programs', path: '/programs', order: 3 },
                { id: 'e-volunteers', name: 'Volunteers', path: '/volunteers', order: 4 },
                { id: 'e-contact', name: 'Contact', path: '/contact', order: 5 },
                { id: 'e-donate', name: 'Donate', path: '/donate', order: 6 },
            ];
        case 'phcg':
            return [
                { id: 'p-home', name: 'Home', path: '/', order: 1 },
                { id: 'p-about', name: 'About Us', path: '/about', order: 2 },
                { id: 'p-services', name: 'Care Services', path: '/services', order: 3 },
                { id: 'p-careers', name: 'Join Team', path: '/careers', order: 4 },
                { id: 'p-faq', name: 'FAQs', path: '/faq', order: 5 },
                { id: 'p-contact', name: 'Contact', path: '/contact', order: 6 },
                { id: 'p-appointment', name: 'Free Consultation', path: '/#appointment', order: 7 },
            ];
        case 'aitasol':
            return [
                { id: 'a-home', name: 'Home', path: '/', order: 1 },
                { id: 'a-about', name: 'About Us', path: '/about', order: 2 },
                { id: 'a-destinations', name: 'Destinations', path: '/destinations', order: 3 },
                { id: 'a-services', name: 'Our Services', path: '/services', order: 4 },
                { id: 'a-universities', name: 'Universities', path: '/universities', order: 5 },
                { id: 'a-blog', name: 'Resources', path: '/blog', order: 6 },
                { id: 'a-contact', name: 'Contact', path: '/contact', order: 7 },
                { id: 'a-apply', name: 'Apply Now', path: '/apply', order: 8 },
            ];
        case 'kmfw':
            return [
                { id: 'nav-home', name: 'Home', path: '/', order: 1 },
                { id: 'nav-about', name: 'About', path: '/about', order: 2, subItems: [
                    { id: 'nav-about-story', name: 'Our Story', path: '/about/our-story', order: 1 },
                    { id: 'nav-about-team', name: 'Meet Our Team', path: '/about/meet-our-team', order: 2 },
                    { id: 'nav-about-plan', name: 'Our Strategic Plan', path: '/about/our-strategic-plan', order: 3 },
                    { id: 'nav-about-founder', name: "Founder's Message", path: '/about/founders-message', order: 4 },
                ] },
                { id: 'nav-services', name: 'Services', path: '/services', order: 3, subItems: [
                    { id: 'nav-serv-prog', name: 'Programs & Services', path: '/services', order: 1 },
                    { id: 'nav-serv-ground', name: 'Grounded Counseling', path: '/services/grounded-counseling', order: 2 },
                    { id: 'nav-serv-edu', name: 'Educational Programs & Groups', path: '/services/educational-programs', order: 3 },
                    { id: 'nav-serv-advocacy', name: 'Advocacy, Training & Education', path: '/services/advocacy-education', order: 4 },
                    { id: 'nav-serv-community', name: 'Community Support & Engagement', path: '/services/community-support', order: 5 },
                    { id: 'nav-serv-system', name: 'System Navigation', path: '/services/system-navigation', order: 6 },
                    { id: 'nav-res-phac', name: 'PHAC Child Welfare', path: '/research/phac-child-welfare', order: 7 },
                ] },
                { id: 'nav-impact', name: 'Impact', path: '/impact', order: 4, subItems: [
                    { id: 'nav-impact-gate', name: 'Impact Gateway', path: '/impact', order: 1 },
                    { id: 'nav-impact-events', name: 'Events', path: '/impact/events', order: 2 },
                    { id: 'nav-impact-news', name: 'Newsletters', path: '/impact/newsletters', order: 3 },
                    { id: 'nav-impact-success', name: 'Success Stories', path: '/impact/success-stories', order: 4 },
                    { id: 'nav-impact-blog', name: 'Community Blog', path: '/impact/blog', order: 5 },
                    { id: 'nav-impact-gallery', name: 'Gallery', path: '/impact/gallery', order: 6 },
                ] },
                { id: 'nav-gala', name: 'BEA Gala', path: '/impact/events/black-excellence-gala', order: 5 },
                { id: 'nav-research', name: 'Research', path: '/research', order: 6, subItems: [
                    { id: 'nav-res-gate', name: 'Research Gateway', path: '/research', order: 1 },
                    { id: 'nav-res-wellness', name: 'Black Wellness Project', path: '/research/black-wellness', order: 2 },
                    { id: 'nav-res-umoja', name: 'Umoja Neurodivergent Program', path: '/research/umoja-neurodivergent', order: 3 },
                ] },
                { id: 'nav-join', name: 'Join Us', path: '/join', order: 7, subItems: [
                    { id: 'nav-join-get', name: 'Get Involved', path: '/join', order: 1 },
                    { id: 'nav-join-funders', name: 'Our Funders/Sponsors', path: '/join/funders', order: 2 },
                    { id: 'nav-join-partners', name: 'Our Partners', path: '/join/partners', order: 3 },
                    { id: 'nav-join-volunteer', name: 'Volunteering', path: '/join/volunteer', order: 4 },
                    { id: 'nav-join-careers', name: 'Career Services & Employment Support', path: '/join/careers', order: 5 },
                ] },
                { id: 'nav-contact', name: 'Contact', path: '/contact', order: 8 },
            ];
        case 'havens':
            return [
                { id: 'nav-home', name: 'Home', path: '/', order: 1 },
                { id: 'nav-services', name: 'Services', path: '/services', order: 2 },
                { id: 'nav-why-us', name: 'Why Us', path: '/why-us', order: 3 },
                { id: 'nav-contact', name: 'Contact', path: '/contact', order: 4 }
            ];
        case 'bweic':
            return [
                {
                    id: 'b-who-we-are',
                    name: 'WHO WE ARE',
                    path: '/who-we-are',
                    order: 1,
                    subItems: [
                        { id: 'b-our-story', name: 'Our Story', path: '/our-story', order: 1 },
                        { id: 'b-leadership', name: 'Leadership', path: '/leadership', order: 2 },
                        { id: 'b-board', name: 'Board Members', path: '/board-members', order: 3 },
                        { id: 'b-partners', name: 'Partners', path: '/partners', order: 4 },
                        { id: 'b-careers', name: 'Careers', path: '/careers', order: 5 },
                    ]
                },
                {
                    id: 'b-our-work',
                    name: 'OUR WORK',
                    path: '/our-work',
                    order: 2,
                    subItems: [
                        { id: 'b-healing', name: 'Healing & Wellness', path: '/our-work/healing-wellness', order: 1 },
                        { id: 'b-empowerment', name: 'Empowerment & Capacity Building', path: '/our-work/empowerment', order: 2 },
                        { id: 'b-community', name: 'Community & Belonging', path: '/our-work/community', order: 3 },
                        { id: 'b-sovereignty', name: 'The Sovereignty Circle', path: '/our-work/sovereignty-circle', order: 4 },
                        { id: 'b-programs', name: 'Signature Programs', path: '/signature-programs', order: 5 },
                        { id: 'b-initiatives', name: 'Special Initiatives', path: '/special-initiatives', order: 6 },
                        { id: 'b-policy', name: 'Policy & Research', path: '/policy-research', order: 7 },
                        { id: 'b-publications', name: 'Publications', path: '/publications', order: 8 },
                    ]
                },
                { id: 'b-take-action', name: 'TAKE ACTION', path: '/take-action', order: 3 },
                {
                    id: 'b-media-center',
                    name: 'MEDIA CENTER',
                    path: '/media-center',
                    order: 4,
                    subItems: [
                        { id: 'b-media-hub', name: 'Media Hub', path: '/media-center', order: 1 },
                        { id: 'b-videos', name: 'Videos', path: '/videos', order: 2 },
                        { id: 'b-events', name: 'Upcoming Events', path: '/upcoming-events', order: 3 },
                        { id: 'b-releases', name: 'Releases & Op-Eds', path: '/releases-op-eds', order: 4 },
                    ]
                },
                { id: 'b-blog', name: 'BLOG', path: '/blogs', order: 5 },
                { id: 'b-shop', name: 'SHOP', path: '/shop', order: 6 },
            ];
        case 'nspc':
        default:
            return [
                { id: 'nav-home', name: 'Home', path: '/', order: 1 },
                { id: 'nav-about', name: 'About Us', path: '/about', order: 2 },
                { id: 'nav-contact', name: 'Contact Us', path: '/contact', order: 3 },
            ];
    }
};

export const GET_SITE_DEFAULTS = (siteId: string, siteName: string) => {
    switch (siteId) {
        case 'noel':
            return {
                description: 'Noel Construction specializes in luxury renovations, custom woodworking, and architectural craftsmanship in the Kitchener-Waterloo region.',
                keywords: 'Noel Construction, custom woodworking KW, Kitchener renovations, Waterloo basement upgrade, luxury decks ON'
            };
        case 'phcg':
            return {
                description: 'Private Home Care Guru (PHCG) provides professional, compassionate home care services across Ontario, specializing in PSW and nursing care.',
                keywords: 'Home care Ontario, PHCG, Private Home Care Guru, PSW services, nursing care home, elder care Toronto'
            };
        case 'kmfw':
            return {
                description: 'Kind Minds Family Wellness (KMFW) is a Black-led organization providing culturally grounded mental health, counseling, and wellness programs to the Black community in Waterloo Region.',
                keywords: 'Black mental health, KMFW, Kind Minds Family Wellness, Black wellness Waterloo, culturally grounded counseling'
            };
        case 'aitasol':
            return {
                description: 'Aitasol is a leading education consultancy helping students achieve their dreams of studying abroad in the UK, Canada, USA, and beyond.',
                keywords: 'study abroad, education consultancy, student visa, university application, Aitasol'
            };
        case 'havens':
            return {
                description: 'Professional psychosocial support for long-term care and retirement homes across Ontario.',
                keywords: 'Haven\'s Social Work, psychosocial support, long-term care, retirement homes Ontario, registered social workers'
            };
        default:
            return {
                description: `${siteName} - Professional agency site powered by Digital Maples Agency.`,
                keywords: `${siteName}, agency, web development, digital solutions`
            };
    }
};

export const GET_SITE_THEME_DEFAULTS = (siteId: string) => {
    switch (siteId) {
        case 'kmfw':
            return {
                primary: '#1b771b', // Corporate Green requested by the user
                secondary: '#84CC16',
                accent: '#7C3AED',
                textDark: '#1C1917',
                textLight: '#78716C',
                brandColor: '#D97706',
                brandColorDark: '#1C1917',
                brandColorLight: '#FFFBEB',
                topBarBg: '#1C1917',
                headerBg: '#FFFFFF'
            };
        case 'nspc':
            return {
                primary: '#00A8B4',
                secondary: '#2C3E50',
                accent: '#A5C93F',
                textDark: '#1A1A1A',
                textLight: '#FFFFFF',
                brandColor: '#00A8B4',
                brandColorDark: '#2C3E50',
                brandColorLight: '#F0F9FA',
                topBarBg: '#2C3E50',
                headerBg: '#FFFFFF'
            };
        case 'bweic':
            return {
                primary: '#BA9731',
                secondary: '#DACE84',
                accent: '#8E7324',
                textDark: '#0D0D0D',
                textLight: '#cbd5e1',
                brandColor: '#BA9731',
                brandColorDark: '#8E7324',
                brandColorLight: '#FEFEFE',
                topBarBg: '#0D0D0D',
                headerBg: '#FEFEFE'
            };
        case 'elwg':
            return {
                primary: '#71220B',
                secondary: '#A57C1E',
                accent: '#D4AF37',
                textDark: '#1C1C1C',
                textLight: '#7F7F7F',
                brandColor: '#71220B',
                brandColorDark: '#511808',
                brandColorLight: '#FAF9F6',
                topBarBg: '#71220B',
                headerBg: '#FAF9F6'
            };
        case 'noel':
            return {
                primary: '#2E7D32',
                secondary: '#A5D6A7',
                accent: '#F9F6F1',
                textDark: '#1C1C1C',
                textLight: '#78716C',
                brandColor: '#2E7D32',
                brandColorDark: '#1B5E20',
                brandColorLight: '#F9F6F1',
                topBarBg: '#1C1C1C',
                headerBg: '#FFFFFF'
            };
        case 'dmlabs':
            return {
                primary: '#22c55e',
                secondary: '#1a3673',
                accent: '#FF0000',
                textDark: '#FFFFFF',
                textLight: 'rgba(255, 255, 255, 0.7)',
                brandColor: '#22c55e',
                brandColorDark: '#0C1F47',
                brandColorLight: '#1a3673',
                topBarBg: '#0C1F47',
                headerBg: '#0C1F47'
            };
        case 'aitasol':
            return {
                primary: '#1E3A5F',
                secondary: '#2D5F9E',
                accent: '#F59E0B',
                textDark: '#111827',
                textLight: '#6B7280',
                brandColor: '#1E3A5F',
                brandColorDark: '#11223F',
                brandColorLight: '#FAFAF9',
                topBarBg: '#1E3A5F',
                headerBg: '#FFFFFF'
            };
        case 'phcg':
            return {
                primary: '#1B4FD8',
                secondary: '#0F2057',
                accent: '#F59E0B',
                textDark: '#6B7280',
                textLight: '#9CA3AF',
                brandColor: '#1B4FD8',
                brandColorDark: '#0F2057',
                brandColorLight: '#EFF4FF',
                topBarBg: '#0F2057',
                headerBg: '#FFFFFF'
            };
        case 'havens':
            return {
                primary: '#0F2537',
                secondary: '#1B365D',
                accent: '#1E847F',
                textDark: '#1C2A38',
                textLight: '#FFFFFF',
                brandColor: '#0F2537',
                brandColorDark: '#1B365D',
                brandColorLight: '#F4F7F6',
                topBarBg: '#0F2537',
                headerBg: '#FFFFFF'
            };
        default:
            return {
                primary: '#3C50E0',
                secondary: '#80CAEE',
                accent: '#F2F4F7',
                textDark: '#1C2434',
                textLight: '#64748B',
                brandColor: '#3C50E0',
                brandColorDark: '#1A233A',
                brandColorLight: '#E2E8F0',
                topBarBg: '#1C2434',
                headerBg: '#FFFFFF'
            };
    }
};
