import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getSiteById } from "@/config/sites";

const defaultApiKey = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (typeof atob === 'function' ? atob('QUl6YVN5QmYxQ0JQT1czVXJxZkVsZWRrRU9TalVDb0gzMWEwdFRF') : ''))
    : (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || Buffer.from('QUl6YVN5QmYxQ0JQT1czVXJxZkVsZWRrRU9TalVDb0gzMWEwdFRF', 'base64').toString('ascii'));

export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultApiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nspc-web.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nspc-web",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nspc-web.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "272421073172",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:272421073172:web:7250912c8b371828ff1201"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth and default Storage
export const auth = getAuth(app);
export const storage = getStorage(app);

// Memoized databases for multi-tenancy
const dbCache: Record<string, any> = {};

/**
 * Gets the Firestore instance for a specific site.
 * Supports multiple databases within a single Firebase project.
 */
export const getDb = (siteId: string) => {
    const site = getSiteById(siteId);
    const dbId = site?.databaseId || '(default)';

    if (!dbCache[dbId]) {
        dbCache[dbId] = getFirestore(app, dbId);
    }
    return dbCache[dbId];
};

// Default export for backward compatibility
export const db = getFirestore(app);

export default app;
