import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { SETTINGS_SEED } from '../src/config/seedData';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
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
