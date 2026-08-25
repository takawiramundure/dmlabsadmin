import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
    authDomain: "nspc-web.firebaseapp.com",
    projectId: "nspc-web",
    storageBucket: "nspc-web.firebasestorage.app",
    messagingSenderId: "272421073172",
    appId: "1:272421073172:web:7250912c8b371828ff1201"
};

const app = initializeApp(firebaseConfig);
const dbDefault = getFirestore(app, '(default)');

const tenantMigrations = [
    {
        tenant: 'noel',
        targetDbId: 'noel-web',
        collections: ['noel_content', 'noel_settings', 'noel_projects', 'noel_caseStudies']
    },
    {
        tenant: 'kmfw',
        targetDbId: 'kmfw-web',
        collections: ['kmfw_content', 'kmfw_settings', 'kmfw_events', 'kmfw_newsletters']
    },
    {
        tenant: 'bweic',
        targetDbId: 'bweic-web',
        collections: ['bweic_content', 'bweic_settings', 'bweic_events']
    },
    {
        tenant: 'nspc',
        targetDbId: 'nspc-web',
        collections: ['nspc_content', 'nspc_settings', 'nspc_events']
    }
];

async function migrateAll() {
    console.log('🚀 Starting Zero-Downtime Database Migration...\n');

    for (const { tenant, targetDbId, collections } of tenantMigrations) {
        console.log(`========================================`);
        console.log(`📦 Tenant: ${tenant.toUpperCase()} -> Database: ${targetDbId}`);
        console.log(`========================================`);

        const targetDb = getFirestore(app, targetDbId);

        for (const colName of collections) {
            try {
                const snapshot = await getDocs(collection(dbDefault, colName));
                console.log(`  📂 Collection: ${colName} (${snapshot.size} docs)`);

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const docId = docSnap.id;
                    await setDoc(doc(targetDb, colName, docId), data);
                    console.log(`     ✓ Copied doc ID: ${docId}`);
                }
            } catch (err) {
                console.error(`     ❌ Error copying ${colName}:`, err.message);
            }
        }
        console.log('');
    }
    console.log('🎉 Migration Completed Successfully!');
}

migrateAll();
