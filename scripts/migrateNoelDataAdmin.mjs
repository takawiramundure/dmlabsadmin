import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for the default database
const appDefault = admin.initializeApp({
    projectId: 'nspc-web'
}, 'default-app');

// Initialize Firebase Admin SDK for the noel-web database
// Note: In newer versions of firebase-admin, you can pass the database ID to admin.firestore(databaseId).
// But to be safe, we can use the app name or just try to get the firestore instance with database ID.
const dbDefault = admin.firestore(appDefault);

// Let's try to get the noel-web database instance
// If the version doesn't support passing database ID to firestore(), we might need to use a different approach.
// But let's try the standard way for multi-database:
let dbNoel;
try {
    // Attempt to get firestore instance for 'noel-web'
    // If this fails or doesn't support database ID, it might fall back to default.
    // In newer SDKs, it's admin.firestore('noel-web')
    dbNoel = appDefault.firestore('noel-web');
    console.log("Successfully initialized 'noel-web' firestore instance.");
} catch (e) {
    console.log("Could not initialize 'noel-web' firestore instance directly. Error:", e.message);
    console.log("Falling back to default instance (which might fail if rules are strict).");
    dbNoel = admin.firestore(); // Fallback
}

const collectionsToMigrate = [
    'noel_content',
    'noel_projects',
    'noel_caseStudies',
    'noel_settings'
];

async function migrate() {
    console.log('Starting Admin migration from (default) to noel-web...');
    
    for (const colName of collectionsToMigrate) {
        console.log(`\nMigrating collection: ${colName}`);
        try {
            const snapshot = await dbDefault.collection(colName).get();
            console.log(`Found ${snapshot.size} documents in ${colName}`);
            
            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                const docId = docSnapshot.id;
                
                // Write to target database with same ID
                await dbNoel.collection(colName).doc(docId).set(data);
                console.log(`  ✓ Copied doc: ${docId}`);
            }
        } catch (error) {
            console.error(`  ❌ Error migrating ${colName}:`, error);
        }
    }
    
    console.log('\n✅ Migration completed!');
    process.exit(0);
}

migrate();
