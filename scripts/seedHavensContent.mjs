import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const app = admin.initializeApp({
    projectId: 'nspc-web'
}, 'havens-seeder');

const db = getFirestore(app, 'havens-web');

const SEED_DATA = {
    settings: {
        id: 'config',
        siteTitle: "Haven't Social Work Inc.",
        branding: {
            siteName: "Haven't Social Work",
            logo: '/logo.png',
            favicon: '/favicon.ico'
        },
        theme: {
            primary: '#0F2537',
            secondary: '#1B365D',
            accent: '#1E847F',
            textDark: '#1C2A38',
            textLight: '#FFFFFF'
        },
        navigation: [
            { id: 'nav1', name: 'HOME', path: '/' },
            { id: 'nav2', name: 'SERVICES', path: '/services' },
            { id: 'nav3', name: 'WHY US', path: '/why-us' },
            { id: 'nav4', name: 'CONTACT', path: '/contact' }
        ]
    },
    content: {
        id: 'home',
        title: "Haven't Social Work Inc.",
        slug: "home",
        template: "home",
        sections: {
            hero: {
                heading: "Professional psychosocial support, without the hiring overhead.",
                content: "The move into long-term care brings fear, grief, anxiety and loss for residents and families. Under the Fixing Long-Term Care Act, 2021, homes must address residents' psychosocial needs: services you may provide or arrange. We are the partner you arrange them through.",
                buttonText: "Book Your complimentary Review",
                buttonUrl: "#contact"
            },
            services: {
                heading: "WHAT WE DELIVER",
                items: [
                    {
                        title: "ONE-TO-ONE SUPPORT",
                        description: "Crisis support, counseling, psychotherapy and psychoeducation for residents"
                    },
                    {
                        title: "FAMILY & CAREGIVERS",
                        description: "Support through transition, grief, conflict and end of life"
                    },
                    {
                        title: "TAILORED PROGRAM",
                        description: "Scoped to your home's size, acuity and budget"
                    },
                    {
                        title: "DOCUMENTATION",
                        description: "Care-conference participation and scheduled program reviews"
                    }
                ]
            },
            why_us: {
                heading: "WHY HOMES CHOOSE US",
                items: [
                    {
                        title: "QUALIFIED",
                        description: "Registered Social Workers in good standing with the OCSWSSW, each carrying their own $5 million liability insurance"
                    },
                    {
                        title: "FLEXIBLE",
                        description: "From a few hours a week to multiple days, scaled to your beds, with no employment overhead"
                    },
                    {
                        title: "ACCOUNTABLE",
                        description: "Regular program reviews and clear monthly reporting so quality is met, not assumed"
                    }
                ]
            }
        }
    },
    footer: {
        id: 'footer',
        logo_url: '',
        tagline: 'Providing professional psychosocial support without the hiring overhead for long-term care and retirement homes across Ontario.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'lmushore@uwaterloo.ca',
        phone: '+289 547 1923',
        address_line1: 'Ontario, Canada',
        address_line2: '',
        appointment_only: false,
        social_instagram: '', social_twitter: '', social_facebook: '', social_linkedin: '', social_youtube: '',
        nav_columns: [
            { heading: 'Quick Links', links: [
                { label: 'Home', url: '/' },
                { label: 'Services', url: '/services' },
                { label: 'Why Us', url: '/why-us' },
                { label: 'Contact Us', url: '/contact' }
            ]}
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }],
        copyright_text: "Haven's Social Work Inc. All rights reserved.",
        developer_text: 'Designed by Digital Maples Labs Inc.',
        developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: false, show_nav: true, show_policy: true
    },
    about: {
        id: 'about',
        title: 'About Us',
        slug: 'about',
        template: 'about',
        status: 'published',
        sections: {
            header: {
                heading: "About Haven's Social Work",
                content: "We provide professional psychosocial support for long-term care and retirement homes across Ontario.",
                enabled: true
            }
        }
    },
    services: {
        id: 'services',
        title: 'Services',
        slug: 'services',
        template: 'services',
        status: 'published',
        hero: {
            heading: "WHAT WE DELIVER",
            content: "Professional psychosocial support designed specifically to lift the operational burden off your nursing teams."
        },
        services: [
            {
                id: 'svc-1',
                title: "ONE-TO-ONE SUPPORT",
                description: "Crisis support, counseling, psychotherapy and psychoeducation for residents",
                icon: "Heart",
                isActive: true,
                order: 1
            },
            {
                id: 'svc-2',
                title: "FAMILY & CAREGIVERS",
                description: "Support through transition, grief, conflict and end of life",
                icon: "Users",
                isActive: true,
                order: 2
            },
            {
                id: 'svc-3',
                title: "TAILORED PROGRAM",
                description: "Scoped to your home's size, acuity and budget",
                icon: "Settings",
                isActive: true,
                order: 3
            },
            {
                id: 'svc-4',
                title: "DOCUMENTATION",
                description: "Care-conference participation and scheduled program reviews",
                icon: "FileText",
                isActive: true,
                order: 4
            }
        ],
        banner: {
            heading: "Need a custom psychosocial care program?",
            subtitle: "We configure programs based on your home size, acuity levels, and budget. Let's design a package together.",
            buttonText: "BOOK A COMPLIMENTARY REVIEW",
            buttonLink: "/contact"
        }
    },
    whyUsPage: {
        id: 'why-us',
        title: 'Why Us',
        slug: 'why-us',
        template: 'why-us',
        status: 'published',
        sections: {
            why_us: {
                badge: "Credibility & Trust",
                heading: "WHY HOMES CHOOSE US",
                description: "We operate as a fully compliant professional services partner, ensuring your residence meets all psychosocial requirements of the Fixing Long-Term Care Act, 2021 without the legal and staffing burdens of full-time hiring.",
                items: [
                    {
                        title: "QUALIFIED",
                        description: "Registered Social Workers in good standing with the OCSWSSW, each carrying their own $5 million liability insurance"
                    },
                    {
                        title: "FLEXIBLE",
                        description: "From a few hours a week to multiple days, scaled to your beds, with no employment overhead"
                    },
                    {
                        title: "ACCOUNTABLE",
                        description: "Regular program reviews and clear monthly reporting so quality is met, not assumed"
                    }
                ]
            }
        }
    },
    contact: {
        id: 'contact',
        title: 'Contact Us',
        slug: 'contact',
        template: 'contact',
        status: 'published',
        sections: {
            info: {
                heading: "Let's Connect",
                content: "Book your complimentary psychosocial needs review. A no-obligation walkthrough of your gaps and a tailored program proposal.",
                enabled: true
            }
        }
    }
};

async function seed() {
    console.log("Seeding havens-web Firestore database...");
    try {
        // Seed settings collection
        await db.collection('settings').doc(SEED_DATA.settings.id).set(SEED_DATA.settings);
        console.log("✓ Seeded settings/config successfully.");

        // Seed content collection
        await db.collection('content').doc(SEED_DATA.content.id).set(SEED_DATA.content);
        console.log("✓ Seeded content/home successfully.");

        // Seed footer in content collection
        await db.collection('content').doc(SEED_DATA.footer.id).set(SEED_DATA.footer);
        console.log("✓ Seeded content/footer successfully.");

        // Seed other pages
        await db.collection('content').doc(SEED_DATA.about.id).set(SEED_DATA.about);
        await db.collection('content').doc(SEED_DATA.services.id).set(SEED_DATA.services);
        await db.collection('content').doc(SEED_DATA.whyUsPage.id).set(SEED_DATA.whyUsPage);
        await db.collection('content').doc(SEED_DATA.contact.id).set(SEED_DATA.contact);
        console.log("✓ Seeded additional pages successfully.");

        console.log("✅ Seeding completed successfully!");
    } catch (e) {
        console.error("❌ Seeding failed:", e);
    }
    process.exit(0);
}

seed();
