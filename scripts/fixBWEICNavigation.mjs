import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp({
    projectId: 'nspc-web'
});

const db = admin.firestore();

async function fixBWEICNavigation() {
    console.log('Fixing BWEIC navigation settings...');
    
    const navigation = [
        {
            id: 'nav-1',
            name: 'WHO WE ARE',
            path: '/who-we-are',
            order: 1,
            subItems: [
                { id: 'nav-1-1', name: 'Our Story', path: '/our-story', order: 1 },
                { id: 'nav-1-2', name: 'Leadership', path: '/leadership', order: 2 },
                { id: 'nav-1-3', name: 'Board Members', path: '/board-members', order: 3 },
                { id: 'nav-1-4', name: 'Partners', path: '/partners', order: 4 },
                { id: 'nav-1-5', name: 'Careers', path: '/careers', order: 5 },
            ]
        },
        {
            id: 'nav-2',
            name: 'OUR WORK',
            path: '/our-work',
            order: 2,
            subItems: [
                { id: 'nav-2-1', name: 'Healing & Wellness', path: '/our-work/healing-wellness', order: 1 },
                { id: 'nav-2-2', name: 'Empowerment & Capacity Building', path: '/our-work/empowerment', order: 2 },
                { id: 'nav-2-3', name: 'Community & Belonging', path: '/our-work/community', order: 3 },
                { id: 'nav-2-4', name: 'The Sovereignty Circle', path: '/our-work/sovereignty-circle', order: 4 },
            ]
        },
        { id: 'nav-3', name: 'TAKE ACTION', path: '/take-action', order: 3 },
        {
            id: 'nav-4',
            name: 'MEDIA CENTER',
            path: '/media-center',
            order: 4,
            subItems: [
                { id: 'nav-4-1', name: 'Videos', path: '/videos', order: 1 },
                { id: 'nav-4-2', name: 'Upcoming Events', path: '/upcoming-events', order: 2 },
                { id: 'nav-4-3', name: 'Partners', path: '/partners', order: 3 },
            ]
        },
        { id: 'nav-5', name: 'BLOG', path: '/blogs', order: 5 },
        { id: 'nav-6', name: 'SHOP', path: '/shop', order: 6 },
    ];

    try {
        // Get current settings
        const settingsRef = db.collection('bweic_settings').doc('config');
        const settingsDoc = await settingsRef.get();
        
        if (settingsDoc.exists) {
            const currentSettings = settingsDoc.data();
            
            // Update navigation
            await settingsRef.update({
                navigation: navigation,
                'metadata.lastUpdated': new Date().toISOString(),
                'metadata.updatedBy': 'system'
            });
            
            console.log('✅ Navigation updated successfully!');
        } else {
            console.log('❌ Settings document not found');
        }
    } catch (error) {
        console.error('❌ Error updating navigation:', error);
    }
    
    process.exit(0);
}

fixBWEICNavigation();
