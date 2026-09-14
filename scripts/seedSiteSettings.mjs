import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase configuration - should match your firebaseConfig.ts
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
    authDomain: "digital-maples-agency.firebaseapp.com",
    projectId: "digital-maples-agency",
    storageBucket: "digital-maples-agency.firebasestorage.app",
    messagingSenderId: "251751498453",
    appId: "1:251751498453:web:c64b5dd8f02c3be99b3f8a",
    measurementId: "G-HDKPBXMFV6"
};

// Settings seed data
const SETTINGS_SEED = {
    nspc: {
        siteId: 'nspc',
        branding: {
            logo: '/nspc-logo.png',
            siteName: 'Niagara Suicide Prevention Coalition',
            favicon: '/favicon.ico'
        },
        theme: {
            primary: '#00A8B4',
            accent: '#A5C93F',
            secondary: '#2C3E50',
            textDark: '#1A1A1A',
            textLight: '#FFFFFF',
            brandColor: '#00A8B4',
            brandColorDark: '#008C96',
            brandColorLight: '#A5C93F',
            topBarBg: '#2C3E50',
            headerBg: '#FFFFFF'
        },
        navigation: [
            { id: 'n1', name: 'Home', path: '/', order: 1 },
            { id: 'n2', name: 'About', path: '/about', order: 2 },
            { id: 'n3', name: 'Resources', path: '/resources', order: 3 },
            { id: 'n4', name: 'Programs', path: '/programs', order: 4 },
            { id: 'n5', name: 'Contact', path: '/contact', order: 5 }
        ],
        metadata: {
            lastUpdated: new Date().toISOString(),
            updatedBy: 'system'
        }
    },
    bweic: {
        siteId: 'bweic',
        branding: {
            logo: '/logo.png',
            siteName: 'Black Women\'s Empowerment Initiative - Canada',
            favicon: '/favicon.ico'
        },
        theme: {
            primary: '#C5A059',
            secondary: '#1A1A1A',
            accent: '#8B7355',
            textDark: '#1B1B1B',
            textLight: '#FFFFFF',
            brandColor: '#C5A059',
            brandColorDark: '#A68746',
            brandColorLight: '#D4B272',
            topBarBg: '#7C2529',
            headerBg: '#FFFFFF'
        },
        navigation: [
            {
                id: 'w1',
                name: 'WHO WE ARE',
                path: '/who-we-are',
                order: 1,
                subItems: [
                    { id: 'w1-1', name: 'Our Story', path: '/our-story', order: 1 },
                    { id: 'w1-2', name: 'Leadership', path: '/leadership', order: 2 },
                    { id: 'w1-3', name: 'Board Members', path: '/board-members', order: 3 },
                    { id: 'w1-4', name: 'Partners', path: '/partners', order: 4 },
                    { id: 'w1-5', name: 'Careers', path: '/careers', order: 5 }
                ]
            },
            {
                id: 'o1',
                name: 'OUR WORK',
                path: '/our-work',
                order: 2,
                subItems: [
                    { id: 'o1-1', name: 'Healing & Wellness', path: '/signature-programs', order: 1 },
                    { id: 'o1-2', name: 'Empowerment & Capacity Building', path: '/special-initiatives', order: 2 },
                    { id: 'o1-3', name: 'Community & Belonging', path: '/policy-research', order: 3 },
                    { id: 'o1-4', name: 'The Sovereignty Circle', path: '/publications', order: 4 }
                ]
            },
            { id: 't1', name: 'TAKE ACTION', path: '/take-action', order: 3 },
            {
                id: 'm1',
                name: 'MEDIA CENTER',
                path: '/media-center',
                order: 4,
                subItems: [
                    { id: 'm1-1', name: 'Videos', path: '/videos', order: 1 },
                    { id: 'm1-2', name: 'Upcoming Events', path: '/upcoming-events', order: 2 },
                    { id: 'm1-3', name: 'Partners', path: '/partners', order: 3 }
                ]
            },
            { id: 'b1', name: 'BLOG', path: '/blogs', order: 5 },
            { id: 's1', name: 'SHOP', path: '/shop', order: 6 }
        ],
        metadata: {
            lastUpdated: new Date().toISOString(),
            updatedBy: 'system'
        }
    }
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedSiteSettings() {
    console.log('🌱 Starting site settings seeding...\n');

    try {
        // Seed NSPC settings
        console.log('📝 Seeding NSPC settings...');
        const nspcDocRef = doc(db, 'nspc_settings', 'config');
        await setDoc(nspcDocRef, {
            ...SETTINGS_SEED.nspc,
            metadata: {
                lastUpdated: new Date().toISOString(),
                updatedBy: 'seeding-script'
            }
        }, { merge: true });
        console.log('✅ NSPC settings seeded successfully!\n');

        // Seed BWEIC settings
        console.log('📝 Seeding BWEIC settings...');
        const bweicDocRef = doc(db, 'bweic_settings', 'config');
        await setDoc(bweicDocRef, {
            ...SETTINGS_SEED.bweic,
            metadata: {
                lastUpdated: new Date().toISOString(),
                updatedBy: 'seeding-script'
            }
        }, { merge: true });
        console.log('✅ BWEIC settings seeded successfully!\n');

        console.log('🎉 All site settings seeded successfully!');
        console.log('\nSeeded collections:');
        console.log('  - nspc_settings/config');
        console.log('  - bweic_settings/config');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error seeding site settings:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedSiteSettings();
