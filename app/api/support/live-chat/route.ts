import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, limit, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';

const DMTEC_FIREBASE_CONFIG = {
    apiKey: process.env.DMTEC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "dmlabssupport.firebaseapp.com",
    projectId: "dmlabssupport",
    storageBucket: "dmlabssupport.firebasestorage.app",
    messagingSenderId: "510219015352",
    appId: "1:510219015352:web:f170d4e29981b33974504d",
    measurementId: "G-V9XHVH7YZZ"
};

function getLiveChatFirestore() {
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

// Process incoming Telegram replies automatically (works on localhost & production)
async function syncTelegramReplies(db: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN || '8881596795:AAF4Jk_JkfbbQDBa1ssUO0pftXAqSmRZL_Q';
    if (!token) return;

    try {
        const offsetRef = doc(db, 'system_configs', 'telegram_chat_offset');
        const offsetSnap = await getDoc(offsetRef);
        const lastOffset = offsetSnap.exists() ? (offsetSnap.data().lastUpdateId || 0) : 0;

        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastOffset + 1}&limit=20`, {
            cache: 'no-store'
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.ok || !data.result || data.result.length === 0) return;

        let maxUpdateId = lastOffset;

        for (const update of data.result) {
            if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;

            const msg = update.message;
            if (!msg || !msg.text) continue;

            const replyTo = msg.reply_to_message;
            if (replyTo && replyTo.text) {
                // Extract session ID from the replied message: "Session: <siteId>_<sessionId>"
                const match = replyTo.text.match(/Session:\s*([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    const matchedSession = match[1];
                    const agentName = msg.from?.first_name || 'Support Engineer';
                    const text = msg.text;
                    const timestamp = new Date(msg.date * 1000).toISOString();

                    // Check if already inserted to avoid duplicate entries
                    const existingQ = query(
                        collection(db, 'live_chats', matchedSession, 'messages'),
                        where('text', '==', text),
                        where('sender', '==', 'agent'),
                        limit(1)
                    );
                    const existingSnap = await getDocs(existingQ);

                    if (existingSnap.empty) {
                        await addDoc(collection(db, 'live_chats', matchedSession, 'messages'), {
                            text,
                            sender: 'agent',
                            senderName: agentName,
                            createdAt: timestamp,
                            telegramMessageId: msg.message_id
                        });
                        console.log(`Synced Telegram reply to session: ${matchedSession}`);
                    }
                }
            }
        }

        if (maxUpdateId > lastOffset) {
            await setDoc(offsetRef, { lastUpdateId: maxUpdateId, updatedAt: new Date().toISOString() }, { merge: true });
        }
    } catch (err) {
        console.warn('Telegram reply sync warning:', err);
    }
}

// GET: Retrieve live chat message history for a tenant session
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const siteId = searchParams.get('siteId');
        const sessionId = searchParams.get('sessionId');

        if (!siteId || !sessionId) {
            return NextResponse.json({ error: 'siteId and sessionId are required' }, { status: 400 });
        }

        const fullSessionKey = sessionId.startsWith(`${siteId}_`) ? sessionId : `${siteId}_${sessionId}`;
        const db = getLiveChatFirestore();

        // 1. Sync any new Telegram replies into Firestore
        await syncTelegramReplies(db);

        // 2. Fetch all messages for this session
        const chatRef = collection(db, 'live_chats', fullSessionKey, 'messages');
        const q = query(chatRef, orderBy('createdAt', 'asc'), limit(100));

        const snap = await getDocs(q);
        const messages: any[] = [];
        snap.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        return NextResponse.json({ success: true, messages, sessionKey: fullSessionKey }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
    } catch (err: any) {
        console.error('Error fetching live chat messages:', err);
        return NextResponse.json({ error: err.message || 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST: Client sends a message in live chat -> save to Firestore & ping Telegram bot
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { siteId, siteName, sessionId, userEmail, userName = 'Client', text, pageUrl = '' } = body;

        if (!siteId || !sessionId || !text) {
            return NextResponse.json({ error: 'siteId, sessionId, and text are required' }, { status: 400 });
        }

        const fullSessionKey = sessionId.startsWith(`${siteId}_`) ? sessionId : `${siteId}_${sessionId}`;
        const db = getLiveChatFirestore();
        const timestamp = new Date().toISOString();

        // 1. Save client message to Firestore
        const docRef = await addDoc(collection(db, 'live_chats', fullSessionKey, 'messages'), {
            text,
            sender: 'client',
            senderName: userName,
            senderEmail: userEmail || `client@${siteId}.ca`,
            siteId,
            siteName,
            sessionId: fullSessionKey,
            createdAt: timestamp,
        });

        // 2. Dispatch alert to Telegram Bot
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '8881596795:AAF4Jk_JkfbbQDBa1ssUO0pftXAqSmRZL_Q';
        const telegramChatId = process.env.TELEGRAM_CHAT_ID || '886640506';

        if (telegramToken && telegramChatId) {
            const telegramText = `💬 <b>LIVE CHAT: [${siteName}]</b>\n\n` +
                `<b>From:</b> ${userName} (${userEmail || 'Portal User'})\n` +
                `<b>Session:</b> <code>${fullSessionKey}</code>\n\n` +
                `<b>Message:</b>\n"${text}"\n\n` +
                `<i>Swipe right and reply to this message on Telegram to respond directly to this client!</i>`;

            try {
                await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: telegramChatId,
                        text: telegramText,
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    })
                });
            } catch (tgErr) {
                console.error('Failed to dispatch live chat message to Telegram:', tgErr);
            }
        }

        return NextResponse.json({ success: true, messageId: docRef.id });
    } catch (err: any) {
        console.error('Error posting live chat message:', err);
        return NextResponse.json({ error: err.message || 'Failed to post message' }, { status: 500 });
    }
}
