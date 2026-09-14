import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';

const DMTEC_FIREBASE_CONFIG = {
    apiKey: process.env.DMTEC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "dmlabssupport.firebaseapp.com",
    projectId: "dmlabssupport",
    storageBucket: "dmlabssupport.firebasestorage.app",
    messagingSenderId: "510219015352",
    appId: "1:510219015352:web:f170d4e29981b33974504d",
    measurementId: "G-V9XHVH7YZZ"
};

function getDmtecDb() {
    const appName = "dmtec-slack-action-bridge";
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

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let payload: any = null;

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            const payloadStr = formData.get('payload');
            if (payloadStr) {
                payload = JSON.parse(payloadStr as string);
            }
        } else {
            payload = await request.json();
        }

        if (!payload) {
            return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
        }

        const action = payload.actions?.[0];
        if (!action) {
            return NextResponse.json({ error: 'No action found' }, { status: 400 });
        }

        const value = action.value; // e.g. "acknowledge:TICKET_ID_OR_NUMBER"
        if (!value || !value.includes(':')) {
            return NextResponse.json({ error: 'Invalid action value format' }, { status: 400 });
        }

        const [actionType, rawId] = value.split(':');
        if (!rawId) {
            return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
        }

        const db = getDmtecDb();
        let targetDocId = rawId;
        let ticketData: any = null;

        // Try direct doc lookup
        const directRef = doc(db, 'tickets', rawId);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
            targetDocId = directSnap.id;
            ticketData = directSnap.data();
        } else {
            // Search by ticketNumber custom field
            const q = query(collection(db, 'tickets'), where('customFields.ticketNumber', '==', rawId));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
                targetDocId = qSnap.docs[0].id;
                ticketData = qSnap.docs[0].data();
            }
        }

        const slackUser = payload.user?.name || payload.user?.username || 'Slack Agent';
        const nowIso = new Date().toISOString();

        let newStatus = 'In Progress';
        let isClosing = false;
        let actionLabel = 'updated';

        if (actionType === 'acknowledge' || actionType === 'received') {
            newStatus = 'Assigned';
            actionLabel = 'acknowledged / received';
        } else if (actionType === 'start' || actionType === 'accept' || actionType === 'in_progress') {
            newStatus = 'In Progress';
            actionLabel = 'started work on';
        } else if (actionType === 'resolve' || actionType === 'close' || actionType === 'complete') {
            newStatus = 'Solved';
            isClosing = true;
            actionLabel = 'marked resolved / completed';
        }

        const durationStr = isClosing ? calculateResolutionDuration(ticketData?.createdAt) : (ticketData?.resolutionDuration || null);

        if (ticketData) {
            const updatePayload: any = {
                status: newStatus,
                updatedAt: nowIso,
                assignedToName: ticketData.assignedToName || slackUser,
                'sync.originOfLastChange': 'slack',
                'sync.lastSyncedAt': Timestamp.now()
            };

            if (isClosing) {
                updatePayload.closedBy = 'Slack';
                updatePayload.closedAt = nowIso;
                updatePayload.resolutionDuration = durationStr;
                updatePayload.closureSummary = `Closed via Slack by @${slackUser} on ${new Date().toLocaleString()} (Resolution Time: ${durationStr})`;
            }

            await updateDoc(doc(db, 'tickets', targetDocId), updatePayload);

            // Sync status to ClickUp if clickupTaskId exists
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
                                comment_text: `✅ Ticket resolved via Slack by @${slackUser} (Resolution Time: ${durationStr})`
                            })
                        });
                    }
                } catch (cuErr) {
                    console.warn('Could not sync Slack action to ClickUp:', cuErr);
                }
            }

            // Alert Telegram
            const tgToken = process.env.TELEGRAM_BOT_TOKEN || '8881596795:AAF4Jk_JkfbbQDBa1ssUO0pftXAqSmRZL_Q';
            const tgChatId = process.env.TELEGRAM_CHAT_ID || '886640506';
            if (tgToken && tgChatId) {
                try {
                    const icon = isClosing ? '✅' : '🔄';
                    const text = `${icon} <b>TICKET #${rawId} STATUS UPDATED</b>\n\n` +
                        `<b>Status:</b> <code>${newStatus.toUpperCase()}</code>\n` +
                        `<b>Updated By:</b> Slack (@${slackUser})\n` +
                        (isClosing ? `<b>Resolution Time:</b> ${durationStr}\n` : '');

                    await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: tgChatId,
                            text,
                            parse_mode: 'HTML'
                        })
                    });
                } catch (tgErr) {
                    console.warn('Could not alert Telegram:', tgErr);
                }
            }
        }

        // Return message update to Slack
        return NextResponse.json({
            replace_original: false,
            text: `⚡ *Ticket #${rawId}* was ${actionLabel} by *@${slackUser}* (Status: *${newStatus.toUpperCase()}*${isClosing ? ` | Resolution Time: ${durationStr}` : ''}).`
        });

    } catch (error: any) {
        console.error('Slack Action API Endpoint Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
