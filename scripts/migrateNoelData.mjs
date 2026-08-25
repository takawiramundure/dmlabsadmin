import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase config (shared for the project)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "",
    authDomain: "nspc-web.firebaseapp.com",
    projectId: "nspc-web",
    storageBucket: "nspc-web.firebasestorage.app",
    messagingSenderId: "272421073172",
    appId: "1:272421073172:web:7250912c8b371828ff1201"
};

const app = initializeApp(firebaseConfig);

// Source database (default)
const dbDefault = getFirestore(app, '(default)');

// Target database (noel-web)
const dbNoel = getFirestore(app, 'noel-web');

const collectionsToMigrate = [
    'noel_content',
    'noel_projects',
    'noel_caseStudies',
    'noel_settings'
];

async function migrate() {
    console.log('Starting migration from (default) to noel-web...');
    
    try {
        const auth = getAuth(app);
        console.log('Attempting to sign in anonymously...');
        const userCredential = await signInAnonymously(auth);
        console.log('Authenticated as:', userCredential.user.uid);
    } catch (e) {
        console.error('Failed to authenticate anonymously:', e.message);
        console.log('Proceeding without authentication (might fail if rules require it)...');
    }
    
    for (const colName of collectionsToMigrate) {
        console.log(`\nMigrating collection: ${colName}`);
        try {
            const snapshot = await getDocs(collection(dbDefault, colName));
            console.log(`Found ${snapshot.size} documents in ${colName}`);
            
            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                const docId = docSnapshot.id;
                
                // Write to target database with same ID
                await setDoc(doc(dbNoel, colName, docId), data);
                console.log(`  ✓ Copied doc: ${docId}`);
            }
        } catch (error) {
            console.error(`  ❌ Error migrating ${colName}:`, error);
        }
    }
    
    console.log('\n✅ Migration completed!');
}

migrate();
