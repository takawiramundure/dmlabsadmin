import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService } from '@/services/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

// DMTEC Ticketing Firebase Config (from dmtec project)
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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            type = 'help_chat', // 'help_chat' | 'feature_request'
            siteId = 'global',
            siteName = 'Agency Tenant',
            userEmail = 'anonymous@client.org',
            userName = 'Client User',
            title,
            message,
            category = 'General',
            urgency = 'normal', // 'low' | 'normal' | 'high' | 'urgent'
            pageUrl = '',
            screenshotUrl = ''
        } = body;

        if (!message && !title) {
            return NextResponse.json({ error: 'Message or title is required.' }, { status: 400 });
        }

        const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;
        const timestamp = new Date().toISOString();

        // 1. Fetch Tenant's Integration Settings from Firestore
        let integrations: any = {};
        if (siteId && siteId !== 'global') {
            try {
                const settings = await FirestoreService.getSiteSettings(siteId);
                integrations = settings?.integrations || {};
            } catch (err) {
                console.warn('Could not load site integrations:', err);
            }
        }

        const n8nWebhook = integrations.n8nWebhookUrl || process.env.N8N_SUPPORT_WEBHOOK_URL;
        const slackWebhook = integrations.slackWebhookUrl || process.env.SLACK_SUPPORT_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || '';
        const ticketApiUrl = integrations.ticketSystemApiUrl || process.env.TICKET_SYSTEM_API_URL;
        const ticketApiKey = integrations.ticketSystemApiKey || process.env.TICKET_SYSTEM_API_KEY;
        const supportEmail = integrations.supportEmail || process.env.SUPPORT_ALERT_EMAIL || 'support@digitalmaples.ca';

        const priorityCode = urgency === 'urgent' ? 'P1' : urgency === 'high' ? 'P2' : 'P3';
        const subjectTitle = title || (type === 'feature_request' ? `[Feature Request] ${category} - ${siteName}` : `[Support] ${category} - ${siteName}`);

        const recordPayload = {
            ticketNumber,
            type,
            siteId,
            siteName,
            userEmail,
            userName,
            title: subjectTitle,
            message,
            category,
            urgency,
            pageUrl,
            screenshotUrl,
            status: 'open',
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        let dmtecDocRefId: string | null = null;
        const dispatchResults: Record<string, boolean> = {};

        const numericTicketId = ticketNumber.replace(/^TICK-/, '').replace(/^#/, '');
        const cleanBaseSubject = (title || (type === 'feature_request' ? `Feature Request: ${category}` : `Support: ${category}`)).replace(/^\[[^\]]+\]\s*-?\s*/, '').trim();
        const formattedSubject = `[${numericTicketId}]-${cleanBaseSubject}`;

        // 2. Direct Sync into DMTEC Ticketing Service (dmlabssupport Firestore)
        try {
            const dmtecDb = getDmtecFirestore();
            const dmtecDocRef = await addDoc(collection(dmtecDb, 'tickets'), {
                subject: formattedSubject,
                description: message,
                descriptionHtml: `<p>${message.replace(/\n/g, '<br/>')}</p><hr/><p><small>Origin: Digital Maples Agency Admin Portal (${siteName}) | Page: <a href="${pageUrl}">${pageUrl}</a> | Tracking: ${ticketNumber}</small></p>`,
                category: category || (type === 'feature_request' ? 'Feature Request' : 'Support'),
                organizationId: siteId,
                organizationName: siteName,
                requestedBy: userEmail,
                status: 'New',
                priority: priorityCode,
                responseDueAt: null,
                resolutionDueAt: null,
                labels: [type, siteId, 'admin-portal', urgency],
                unreadByAdmin: true,
                unreadByUser: false,
                customFields: {
                    portalOrigin: 'DigitalMaplesAgency_AdminPortal',
                    pageUrl: pageUrl,
                    ticketNumber: ticketNumber,
                    urgency: urgency
                },
                createdAt: timestamp,
                updatedAt: timestamp
            });
            dmtecDocRefId = dmtecDocRef.id;
            dispatchResults.dmtecTicketCreated = !!dmtecDocRef.id;
        } catch (err) {
            console.error('DMTEC Ticket direct write failed:', err);
            dispatchResults.dmtecTicketCreated = false;
        }

        // 3. Dispatch to Slack Webhook
        if (slackWebhook) {
            try {
                const urgencyEmoji = urgency === 'urgent' ? '🚨' : urgency === 'high' ? '⚠️' : '💬';
                const typeLabel = type === 'feature_request' ? '💡 Feature Request' : '🆘 Support Request';

                const slackBody = {
                    text: `${urgencyEmoji} [${siteName.toUpperCase()}] ${typeLabel}: ${subjectTitle}`,
                    blocks: [
                        {
                            type: "header",
                            text: {
                                type: "plain_text",
                                text: `${urgencyEmoji} ${typeLabel} - ${siteName}`,
                                emoji: true
                            }
                        },
                        {
                            type: "section",
                            fields: [
                                { type: "mrkdwn", text: `*Ticket ID:*\n\`${ticketNumber}\`` },
                                { type: "mrkdwn", text: `*Priority:*\n\`${priorityCode}\` (${urgency.toUpperCase()})` },
                                { type: "mrkdwn", text: `*User:*\n${userName} (${userEmail})` },
                                { type: "mrkdwn", text: `*Category:*\n${category}` }
                            ]
                        },
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: `*Message / Details:*\n>${message.replace(/\n/g, '\n>')}`
                            }
                        },
                        ...(pageUrl ? [{
                            type: "context",
                            elements: [{ type: "mrkdwn", text: `*Triggered From:* <${pageUrl}|${pageUrl}>` }]
                        }] : []),
                        {
                            type: "actions",
                            block_id: `ticket_actions_${ticketNumber}`,
                            elements: [
                                {
                                    type: "button",
                                    text: { type: "plain_text", text: "👀 Acknowledge", emoji: true },
                                    style: "primary",
                                    action_id: "action_acknowledge",
                                    value: `acknowledge:${dmtecDocRefId || ticketNumber}`
                                },
                                {
                                    type: "button",
                                    text: { type: "plain_text", text: "▶️ Start Work", emoji: true },
                                    action_id: "action_start",
                                    value: `start:${dmtecDocRefId || ticketNumber}`
                                },
                                {
                                    type: "button",
                                    text: { type: "plain_text", text: "✅ Mark Resolved", emoji: true },
                                    style: "danger",
                                    action_id: "action_resolve",
                                    value: `resolve:${dmtecDocRefId || ticketNumber}`
                                }
                            ]
                        }
                    ]
                };

                const slackToken = process.env.SLACK_BOT_TOKEN;
                const slackChannel = process.env.NEXT_PUBLIC_SLACK_CHANNEL_ID || 'C09BTPX3K0D';

                if (slackToken) {
                    const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${slackToken}`
                        },
                        body: JSON.stringify({
                            channel: slackChannel,
                            ...slackBody
                        })
                    });
                    const resData = await slackRes.json();
                    dispatchResults.slack = resData.ok === true;
                    if (!resData.ok && slackWebhook) {
                        const fallbackRes = await fetch(slackWebhook, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(slackBody)
                        });
                        dispatchResults.slack = fallbackRes.ok;
                    }
                } else if (slackWebhook) {
                    const slackRes = await fetch(slackWebhook, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(slackBody)
                    });
                    dispatchResults.slack = slackRes.ok;
                }
            } catch (err) {
                console.error('Slack Webhook dispatch failed:', err);
                dispatchResults.slack = false;
            }
        }

        // 4. Dispatch to n8n Webhook (which triggers Telegram, ClickUp, and Central Ticketing)
        if (n8nWebhook) {
            try {
                const n8nRes = await fetch(n8nWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: type,
                        ticket: recordPayload,
                        workflow: ['slack', 'clickup', 'telegram', 'email'],
                        meta: {
                            origin: 'DigitalMaplesAgency_AdminPortal',
                            timestamp
                        }
                    })
                });
                dispatchResults.n8n = n8nRes.ok;
            } catch (err) {
                console.error('n8n Webhook dispatch failed:', err);
                dispatchResults.n8n = false;
            }
        }

        // 5. Dispatch to External Ticket System API (if configured)
        if (ticketApiUrl) {
            try {
                const ticketRes = await fetch(ticketApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(ticketApiKey ? { 'Authorization': `Bearer ${ticketApiKey}` } : {})
                    },
                    body: JSON.stringify({
                        title: recordPayload.title,
                        description: recordPayload.message,
                        priority: priorityCode,
                        category,
                        client_email: userEmail,
                        tenant_id: siteId,
                        metadata: {
                            ticketNumber,
                            pageUrl,
                            screenshotUrl
                        }
                    })
                });
                dispatchResults.externalTicketSystem = ticketRes.ok;
            } catch (err) {
                console.error('External Ticket System dispatch failed:', err);
                dispatchResults.externalTicketSystem = false;
            }
        }

        // 6. Direct Dispatch to Telegram Bot API
        const telegramToken = integrations.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '8881596795:AAF4Jk_JkfbbQDBa1ssUO0pftXAqSmRZL_Q';
        const telegramChatId = integrations.telegramChatId || process.env.TELEGRAM_CHAT_ID || '886640506';
        if (telegramToken && telegramChatId) {
            try {
                const urgencyEmoji = urgency === 'urgent' ? '🚨' : urgency === 'high' ? '⚠️' : '💬';
                const typeLabel = type === 'feature_request' ? '💡 Feature Request' : '🆘 Support Request';
                const telegramText = `<b>${urgencyEmoji} [${siteName}] ${typeLabel}</b>\n\n` +
                    `<b>Ticket ID:</b> <code>${ticketNumber}</code>\n` +
                    `<b>Priority:</b> <code>${priorityCode}</code> (${urgency.toUpperCase()})\n` +
                    `<b>Requester:</b> ${userName} (${userEmail})\n` +
                    `<b>Category:</b> ${category}\n` +
                    `<b>Subject:</b> ${subjectTitle}\n\n` +
                    `<b>Details:</b>\n${message.slice(0, 500)}\n\n` +
                    (pageUrl ? `<a href="${pageUrl}">Open In Portal</a>` : '');

                const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: telegramChatId,
                        text: telegramText,
                        parse_mode: 'HTML',
                        disable_web_page_preview: true,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "👀 Acknowledge", callback_data: `ack:${ticketNumber}` },
                                    { text: "▶️ Start", callback_data: `start:${ticketNumber}` },
                                    { text: "✅ Resolve", callback_data: `resolve:${ticketNumber}` }
                                ]
                            ]
                        }
                    })
                });
                dispatchResults.telegram = tgRes.ok;
            } catch (err) {
                console.error('Telegram Bot direct dispatch failed:', err);
                dispatchResults.telegram = false;
            }
        }

        // 7. Direct Dispatch to ClickUp Task API with Auto-Populated Custom Fields
        let clickupTaskId: string | null = null;
        const clickupKey = integrations.clickupApiKey || process.env.CLICKUP_API_KEY || 'pk_2444706_DNYFB7D8SPGMZYXHB8YT24GFEMP54I6D';
        const clickupListId = integrations.clickupListId || process.env.CLICKUP_LIST_ID || '901406892753';
        if (clickupKey && clickupListId) {
            try {
                // Format ClickUp Task Name: [934260]-Subject Title
                const numericTicketId = ticketNumber.replace(/^TICK-/, '');
                const formattedTaskName = `[${numericTicketId}]-${subjectTitle}`;

                // Client Option Mapping
                const clientOptionMap: Record<string, string> = {
                    'elwg': 'f6a736c4-0789-4d25-9ceb-7a6da84f13c4', // ELWG
                    'nspc': 'f85ada29-bc10-49b9-889e-a0d0003f73e6', // NSPC
                    'phcg': 'a2c6fadf-290a-47dc-b828-6cb42b9aa16c', // HOME CARE GURU
                    'home care guru': 'a2c6fadf-290a-47dc-b828-6cb42b9aa16c',
                    'ima': '4a6df99e-d145-4174-b3a4-5f5630a885ab', // IMA
                    'platedcultures': 'c04b1bbf-3684-4b5b-b2b6-85cf11b9db13', // PLATEDCULTURES
                    'dsync': 'a7df1895-071e-4aa2-9238-2eee742647b5', // DSYNC
                    'dmlabs': '8a175d2e-9ac5-4e27-a4ef-5d8a8669c667', // INTERNAL
                    'bweic': '8a175d2e-9ac5-4e27-a4ef-5d8a8669c667', // INTERNAL
                    'kmfw': '8a175d2e-9ac5-4e27-a4ef-5d8a8669c667', // INTERNAL
                    'aitasol': '8a175d2e-9ac5-4e27-a4ef-5d8a8669c667', // INTERNAL
                    'noel': '8a175d2e-9ac5-4e27-a4ef-5d8a8669c667', // INTERNAL
                };
                const clientOptionId = clientOptionMap[siteId.toLowerCase()] || clientOptionMap[siteName.toLowerCase()] || '8a175d2e-9ac5-4e27-a4ef-5d8a8669c667';

                // Complexity Mapping
                const complexityOptionId = urgency === 'urgent' 
                    ? 'ce74a572-b6ce-4523-a87a-625b58cae9cc' // High
                    : urgency === 'high'
                    ? 'd2dc0777-c099-4024-95b9-70ff027fdfa9' // Medium
                    : '7508162f-0882-47d7-8226-2e66a49e8d5a'; // Simple

                // Department Mapping
                const departmentOptionId = type === 'feature_request'
                    ? '721e11cc-b64b-4e0f-85c9-7db89b76bdf2' // Engineering
                    : 'e5325bba-6a77-470e-89d5-bd9ef58a560e'; // Support

                // Custom Fields payload
                const customFieldsPayload = [
                    ...(userEmail ? [{ id: '21fecb7b-81d4-4d16-b1e9-6b21f51f6f77', value: userEmail }] : []), // Email
                    { id: '2ac77a47-3b4d-4485-a21b-6141743fc3f9', value: complexityOptionId }, // IT Incident Complexity
                    { id: '330ce74d-b1f5-40de-855e-475f7b40e0e7', value: 'b24b5b5d-1b47-48ba-9608-992a30df1e31' }, // Office: Remote
                    { id: '5051d8fc-6c23-44fe-8849-b677752dd883', value: clientOptionId }, // Client
                    { id: '6d6ea4cd-b791-4ac5-98bd-7e5120cbbff5', value: '76dac097-76e2-40da-8bf7-03938f572677' }, // IT Category: Software - Internal application
                    { id: '9bfe6f3f-0d94-4881-a756-013005161363', value: departmentOptionId } // Department
                ];

                const cuRes = await fetch(`https://api.clickup.com/api/v2/list/${clickupListId}/task`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': clickupKey
                    },
                    body: JSON.stringify({
                        name: formattedTaskName,
                        description: `${message}\n\nTicket ID: ${ticketNumber}`,
                        start_date: Date.now(),
                        priority: urgency === 'urgent' ? 1 : urgency === 'high' ? 2 : 3,
                        tags: [siteId, type, 'monorepo-admin-portal'],
                        custom_fields: customFieldsPayload
                    })
                });
                if (cuRes.ok) {
                    const cuData = await cuRes.json();
                    clickupTaskId = cuData.id || null;
                    dispatchResults.clickup = true;

                    // Update DMTEC ticket with clickupTaskId if created
                    if (clickupTaskId && dmtecDocRefId) {
                        try {
                            const dmtecDb = getDmtecFirestore();
                            await updateDoc(doc(dmtecDb, 'tickets', dmtecDocRefId), {
                                clickupTaskId: clickupTaskId,
                                'sync.clickup.taskId': clickupTaskId,
                                'sync.clickup.listId': clickupListId,
                                'sync.clickup.lastSyncedStatus': 'New'
                            });
                        } catch (e) {
                            console.warn('Could not link clickupTaskId to DMTEC ticket:', e);
                        }
                    }
                } else {
                    dispatchResults.clickup = false;
                }
            } catch (err) {
                console.error('ClickUp direct task dispatch failed:', err);
                dispatchResults.clickup = false;
            }
        }

        return NextResponse.json({
            success: true,
            ticketNumber,
            message: 'Your request has been successfully submitted and dispatched to DMTEC and the support team.',
            dispatchResults
        });

    } catch (err: any) {
        console.error('Support dispatch error:', err);
        return NextResponse.json({ error: err.message || 'Failed to dispatch support request.' }, { status: 500 });
    }
}
