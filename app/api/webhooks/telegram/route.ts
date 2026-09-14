import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

const DMTEC_FIREBASE_CONFIG = {
    apiKey: process.env.DMTEC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "dmlabssupport.firebaseapp.com",
    projectId: "dmlabssupport",
    storageBucket: "dmlabssupport.firebasestorage.app",
    messagingSenderId: "510219015352",
    appId: "1:510219015352:web:f170d4e29981b33974504d",
    measurementId: "G-V9XHVH7YZZ"
};

function getFirestoreDb() {
    const appName = "dmtec-ticketing-bridge";
    let app = getApps().find(a => a.name === appName);
    if (!app) {
        app = initializeApp(DMTEC_FIREBASE_CONFIG, appName);
    }
    return getFirestore(app);
}

function calculateResolutionDuration(createdAtStr?: string): string {
    if (!createdAtStr) return 'N/A';
    try {
        const createdDate = new Date(createdAtStr);
        const now = new Date();
        const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${Math.max(1, minutes)} mins`;
    } catch {
        return 'N/A';
    }
}

async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN || '8881596795:AAF4Jk_JkfbbQDBa1ssUO0pftXAqSmRZL_Q';
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                ...(replyMarkup ? { reply_markup: replyMarkup } : {})
            })
        });
    } catch (e) {
        console.error('sendTelegramMessage failed:', e);
    }
}

async function answerTelegramCallback(callbackQueryId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN || '8881596795:AAF4Jk_JkfbbQDBa1ssUO0pftXAqSmRZL_Q';
    try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
                show_alert: false
            })
        });
    } catch (e) {
        console.error('answerTelegramCallback failed:', e);
    }
}

async function processTicketAction(
    rawTicketNumber: string,
    actionType: 'ack' | 'start' | 'resolve',
    agentName: string
) {
    const db = getFirestoreDb();
    const cleanNumber = rawTicketNumber.trim().replace(/^#/, '').toUpperCase();
    const formattedTicketNumber = cleanNumber.startsWith('TICK-') ? cleanNumber : `TICK-${cleanNumber}`;

    let targetDocId: string | null = null;
    let ticketData: any = null;

    // Check direct doc ID or ticketNumber in customFields
    const directRef = doc(db, 'tickets', rawTicketNumber);
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
        targetDocId = directSnap.id;
        ticketData = directSnap.data();
    } else {
        const q1 = query(collection(db, 'tickets'), where('customFields.ticketNumber', '==', formattedTicketNumber));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
            targetDocId = snap1.docs[0].id;
            ticketData = snap1.docs[0].data();
        } else {
            const q2 = query(collection(db, 'tickets'), where('customFields.ticketNumber', '==', cleanNumber));
            const snap2 = await getDocs(q2);
            if (!snap2.empty) {
                targetDocId = snap2.docs[0].id;
                ticketData = snap2.docs[0].data();
            }
        }
    }

    if (!targetDocId || !ticketData) {
        return { success: false, error: `Ticket <b>${formattedTicketNumber}</b> could not be found.` };
    }

    let newStatus = 'In Progress';
    let isClosing = false;
    let actionLabel = 'updated';

    if (actionType === 'ack') {
        newStatus = 'Assigned';
        actionLabel = '👀 acknowledged / assigned';
    } else if (actionType === 'start') {
        newStatus = 'In Progress';
        actionLabel = '▶️ started work on';
    } else if (actionType === 'resolve') {
        newStatus = 'Solved';
        isClosing = true;
        actionLabel = '✅ marked resolved';
    }

    const nowIso = new Date().toISOString();
    const durationStr = isClosing ? calculateResolutionDuration(ticketData.createdAt) : (ticketData.resolutionDuration || null);

    const updatePayload: any = {
        status: newStatus,
        updatedAt: nowIso,
        assignedToName: ticketData.assignedToName || agentName,
        'sync.originOfLastChange': 'telegram',
        'sync.lastSyncedAt': Timestamp.now()
    };

    if (isClosing) {
        updatePayload.closedBy = 'Telegram';
        updatePayload.closedAt = nowIso;
        updatePayload.resolutionDuration = durationStr;
        updatePayload.closureSummary = `Closed via Telegram by @${agentName} on ${new Date().toLocaleString()} (Resolution Time: ${durationStr})`;
    }

    await updateDoc(doc(db, 'tickets', targetDocId), updatePayload);

    // Sync to ClickUp
    const clickupTaskId = ticketData.clickupTaskId;
    const clickupKey = process.env.CLICKUP_API_KEY || 'pk_2444706_DNYFB7D8SPGMZYXHB8YT24GFEMP54I6D';
    if (clickupTaskId && clickupKey) {
        try {
            const cuStatus = isClosing ? 'resolved' : (newStatus === 'In Progress' ? 'in progress' : 'open');
            await fetch(`https://api.clickup.com/api/v2/task/${clickupTaskId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': clickupKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: cuStatus })
            });

            if (isClosing) {
                await fetch(`https://api.clickup.com/api/v2/task/${clickupTaskId}/comment`, {
                    method: 'POST',
                    headers: {
                        'Authorization': clickupKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        comment_text: `✅ Ticket resolved via Telegram by @${agentName} (Resolution Time: ${durationStr})`
                    })
                });
            }
        } catch (cuErr) {
            console.warn('ClickUp sync failed from Telegram action:', cuErr);
        }
    }

    return {
        success: true,
        ticketNumber: formattedTicketNumber,
        subject: ticketData.subject || 'Support Ticket',
        newStatus,
        actionLabel,
        durationStr,
        isClosing
    };
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const update = await req.json();

        // 1. Handle Inline Button Callback Query (Button Clicks)
        if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const dataStr = callbackQuery.data || ''; // e.g. "ack:TICK-408578"
            const fromUser = callbackQuery.from?.first_name || callbackQuery.from?.username || 'Agent';
            const chatId = callbackQuery.message?.chat?.id;

            if (dataStr.includes(':')) {
                const [actionType, ticketNum] = dataStr.split(':') as ['ack' | 'start' | 'resolve', string];
                const res = await processTicketAction(ticketNum, actionType, fromUser);

                if (res.success) {
                    await answerTelegramCallback(callbackQuery.id, `Status updated to ${res.newStatus}`);
                    const confirmationText = `⚡ <b>Ticket ${res.ticketNumber}</b> ${res.actionLabel} by <b>@${fromUser}</b>\n` +
                        `<b>Subject:</b> ${res.subject}\n` +
                        `<b>Current Status:</b> <code>${res.newStatus?.toUpperCase()}</code>` +
                        (res.isClosing ? `\n<b>Resolution Time:</b> ${res.durationStr}` : '');
                    
                    await sendTelegramMessage(chatId, confirmationText);
                } else {
                    await answerTelegramCallback(callbackQuery.id, 'Ticket not found');
                    if (chatId) {
                        await sendTelegramMessage(chatId, `⚠️ ${res.error}`);
                    }
                }
            }
            return NextResponse.json({ ok: true });
        }

        // 2. Handle Message (Slash Commands or Live Chat Replies)
        const message = update.message;
        if (!message || !message.text) {
            return NextResponse.json({ ok: true });
        }

        const text = message.text.trim();
        const chatId = message.chat.id;
        const agentName = message.from?.first_name || message.from?.username || 'Agent';

        // Check for Slash Commands: /ack, /start, /resolve, /status, /help
        if (text.startsWith('/')) {
            const parts = text.split(/\s+/);
            const cmd = parts[0].toLowerCase().replace(/@dmlabs_support_bot$/, '');
            const targetArg = parts[1];

            if (cmd === '/help') {
                const helpText = `🛠️ <b>DMLabs Support Bot Commands</b>\n\n` +
                    `• <code>/ack &lt;ticket_id&gt;</code> - Acknowledge and assign a ticket\n` +
                    `• <code>/start &lt;ticket_id&gt;</code> - Start work on ticket (In Progress)\n` +
                    `• <code>/resolve &lt;ticket_id&gt;</code> - Mark ticket resolved & sync duration\n` +
                    `• <code>/status &lt;ticket_id&gt;</code> - Check current status of a ticket\n\n` +
                    `<i>Example:</i> <code>/resolve 408578</code> or tap the interactive buttons beneath each ticket alert.`;
                await sendTelegramMessage(chatId, helpText);
                return NextResponse.json({ ok: true });
            }

            let resolvedTicketNumber = targetArg;

            // If no ID given, inspect if the user replied to a ticket message
            if (!resolvedTicketNumber && replyTo && replyTo.text) {
                const match = replyTo.text.match(/(?:Ticket ID:\s*|TICK-|#)([A-Za-z0-9_-]+)/i);
                if (match) {
                    resolvedTicketNumber = match[0].replace(/^Ticket ID:\s*/i, '').replace(/^#/, '');
                }
            }

            if (!resolvedTicketNumber) {
                await sendTelegramMessage(chatId, `⚠️ Please provide a ticket ID or reply to a ticket alert.\n\n<i>Examples:</i>\n• <code>${cmd} 408578</code>\n• Reply to any ticket alert and simply type <code>${cmd}</code>`);
                return NextResponse.json({ ok: true });
            }

            if (cmd === '/ack' || cmd === '/acknowledge') {
                const res = await processTicketAction(resolvedTicketNumber, 'ack', agentName);
                if (res.success) {
                    await sendTelegramMessage(chatId, `👀 <b>Ticket ${res.ticketNumber}</b> acknowledged & assigned by <b>@${agentName}</b>.\nStatus: <code>${res.newStatus?.toUpperCase()}</code>`);
                } else {
                    await sendTelegramMessage(chatId, `⚠️ ${res.error}`);
                }
                return NextResponse.json({ ok: true });
            }

            if (cmd === '/start' || cmd === '/progress') {
                const res = await processTicketAction(resolvedTicketNumber, 'start', agentName);
                if (res.success) {
                    await sendTelegramMessage(chatId, `▶️ <b>Ticket ${res.ticketNumber}</b> marked <b>IN PROGRESS</b> by <b>@${agentName}</b>.`);
                } else {
                    await sendTelegramMessage(chatId, `⚠️ ${res.error}`);
                }
                return NextResponse.json({ ok: true });
            }

            if (cmd === '/resolve' || cmd === '/close') {
                const res = await processTicketAction(resolvedTicketNumber, 'resolve', agentName);
                if (res.success) {
                    await sendTelegramMessage(chatId, `✅ <b>Ticket ${res.ticketNumber}</b> marked <b>RESOLVED</b> by <b>@${agentName}</b>.\n<b>Resolution Time:</b> ${res.durationStr}`);
                } else {
                    await sendTelegramMessage(chatId, `⚠️ ${res.error}`);
                }
                return NextResponse.json({ ok: true });
            }

            if (cmd === '/status') {
                const db = getFirestoreDb();
                const cleanNumber = resolvedTicketNumber.trim().replace(/^#/, '').toUpperCase();
                const formattedNumber = cleanNumber.startsWith('TICK-') ? cleanNumber : `TICK-${cleanNumber}`;
                const q = query(collection(db, 'tickets'), where('customFields.ticketNumber', '==', formattedNumber));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const t = snap.docs[0].data();
                    const statusText = `📋 <b>Ticket ${formattedNumber} Status</b>\n\n` +
                        `<b>Subject:</b> ${t.subject}\n` +
                        `<b>Organization:</b> ${t.organizationName || 'Internal'}\n` +
                        `<b>Status:</b> <code>${(t.status || 'New').toUpperCase()}</code>\n` +
                        `<b>Assigned:</b> ${t.assignedToName || 'Unassigned'}\n` +
                        `<b>Created:</b> ${t.createdAt}\n` +
                        (t.resolutionDuration ? `<b>Resolution Time:</b> ${t.resolutionDuration}\n` : '');
                    await sendTelegramMessage(chatId, statusText);
                } else {
                    await sendTelegramMessage(chatId, `⚠️ Ticket <b>${formattedNumber}</b> not found.`);
                }
                return NextResponse.json({ ok: true });
            }
        }

        // 3. Check for Live Chat session reply
        const replyTo = message.reply_to_message;
        let sessionIdMatch: string | null = null;
        if (replyTo && replyTo.text) {
            const match = replyTo.text.match(/Session:\s*([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                sessionIdMatch = match[1];
            }
        }

        if (sessionIdMatch) {
            const db = getFirestoreDb();
            const timestamp = new Date().toISOString();
            await addDoc(collection(db, 'live_chats', sessionIdMatch, 'messages'), {
                text,
                sender: 'agent',
                senderName: agentName,
                createdAt: timestamp
            });
            console.log(`Saved agent Telegram reply to live chat session: ${sessionIdMatch}`);
        }

        return NextResponse.json({ ok: true, session: sessionIdMatch });
    } catch (err: any) {
        console.error('Telegram webhook handler error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
