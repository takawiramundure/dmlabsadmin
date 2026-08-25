import admin from 'firebase-admin';

const appDefault = admin.initializeApp({
    projectId: 'nspc-web'
}, 'list-app');

const dbDefault = admin.firestore(appDefault);

async function inspectSettings() {
    console.log('Inspecting noel_settings/config in (default) database...');
    const docRef = dbDefault.collection('noel_settings').doc('config');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        console.log(`Data:`, JSON.stringify(docSnap.data(), null, 2));
    } else {
        console.log('Document noel_settings/config does not exist!');
    }
    process.exit(0);
}

inspectSettings();
