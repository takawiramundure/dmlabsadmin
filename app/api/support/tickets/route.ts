import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const DMTEC_FIREBASE_CONFIG = {
    apiKey: process.env.DMTEC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "dmlabssupport.firebaseapp.com",
    projectId: "dmlabssupport",
    storageBucket: "dmlabssupport.firebasestorage.app",
    messagingSenderId: "510219015352",
    appId: "1:510219015352:web:f170d4e29981b33974504d",
    measurementId: "G-V9XHVH7YZZ"
};

function getDmtecFirestore() {
    const appName = "dmtec-ticketing-bridge";
    let app;
    const existing = getApps().find(a => a.name === appName);
    if (existing) {
        app = existing;
    } else {
        app = initializeApp(DMTEC_FIREBASE_CONFIG, appName);
    }
    return getFirestore(app);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get('siteId');

        if (!siteId) {
            return NextResponse.json({ error: 'siteId parameter is required' }, { status: 400 });
        }

        const db = getDmtecFirestore();
        const ticketsRef = collection(db, 'tickets');
        
        // Strict tenant isolation: only retrieve tickets where organizationId == siteId
        const q = query(
            ticketsRef,
            where('organizationId', '==', siteId),
            limit(50)
        );

        const snap = await getDocs(q);
        const tickets: any[] = [];
        snap.forEach(doc => {
            tickets.push({ id: doc.id, ...doc.data() });
        });

        // Sort descending by createdAt
        tickets.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        return NextResponse.json(
            { success: true, tickets, tenantId: siteId },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            }
        );
    } catch (err: any) {
        console.error('Error fetching tenant tickets:', err);
        return NextResponse.json({ error: err.message || 'Failed to fetch tickets' }, { status: 500 });
    }
}
