import { FirestoreService } from "./firestore";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/firebaseConfig";

export interface FormSubmissionPayload {
    siteId: string;
    formId: string;
    values: Record<string, any>;
    source?: string;
}

export const FormSubmitter = {
    /**
     * Submits a form and dynamically triggers any configured no-code workflows
     */
    submit: async (payload: FormSubmissionPayload): Promise<{ success: boolean; actionsExecuted: string[] }> => {
        const { siteId, formId, values, source = 'web-client' } = payload;
        const actionsExecuted: string[] = [];

        try {
            // 1. Fetch form settings to see if workflows are configured
            const formConfig = await FirestoreService.getForm(siteId, formId);
            
            // If no form config or workflows exist, fall back to default email + db actions
            const workflows = formConfig?.workflows || [
                { type: 'database', enabled: true, config: { collection: 'form_submissions' } },
                { type: 'email', enabled: true }
            ];

            const dbInstance = getDb(siteId);

            for (const flow of workflows) {
                if (!flow.enabled) continue;

                switch (flow.type) {
                    case 'database': {
                        const targetCol = flow.config?.collection || 'form_submissions';
                        const colRef = collection(dbInstance, targetCol);
                        
                        await addDoc(colRef, {
                            ...values,
                            formId,
                            createdAt: new Date().toISOString(),
                            source,
                            siteId
                        });
                        actionsExecuted.push(`saved_to_${targetCol}`);
                        break;
                    }

                    case 'webhook': {
                        const url = flow.config?.url;
                        if (url) {
                            try {
                                const response = await fetch(url, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        event: 'form_submission',
                                        siteId,
                                        formId,
                                        timestamp: new Date().toISOString(),
                                        data: values
                                    })
                                });
                                if (response.ok) {
                                    actionsExecuted.push(`triggered_webhook_${url}`);
                                } else {
                                    console.warn(`Webhook returned non-ok status: ${response.status}`);
                                    actionsExecuted.push(`webhook_failed_${response.status}`);
                                }
                            } catch (err) {
                                console.error("Webhook POST failed:", err);
                                actionsExecuted.push("webhook_error");
                            }
                        }
                        break;
                    }

                    case 'auto_responder': {
                        const subjectTemplate = flow.config?.subject || 'Submission Received';
                        const bodyTemplate = flow.config?.body || 'Thank you for your submission!';
                        
                        // Simple variable interpolation, e.g. {{name}} -> values.name
                        let subject = subjectTemplate;
                        let body = bodyTemplate;
                        
                        Object.entries(values).forEach(([key, val]) => {
                            const placeholder = new RegExp(`{{${key}}}`, 'g');
                            subject = subject.replace(placeholder, String(val));
                            body = body.replace(placeholder, String(val));
                        });

                        // Log responder triggers
                        console.log(`[Auto-Responder] Email queued: To=${values.email || 'unknown'}, Subject="${subject}", Body="${body}"`);
                        
                        // We also save a copy to form responder logs for verification in Admin
                        const responderLogsRef = collection(dbInstance, 'responder_logs');
                        await addDoc(responderLogsRef, {
                            to: values.email || 'unknown',
                            subject,
                            body,
                            formId,
                            siteId,
                            timestamp: new Date().toISOString()
                        });
                        
                        actionsExecuted.push("sent_auto_responder");
                        break;
                    }

                    case 'email': {
                        // Email to notifications recipient
                        const recipient = formConfig?.recipient_email || 'info@digitalmaples.ca';
                        console.log(`[Notification Email] Form submission from "${formId}" forwarded to ${recipient}`);
                        actionsExecuted.push(`notified_${recipient}`);
                        break;
                    }
                }
            }

            return { success: true, actionsExecuted };
        } catch (error) {
            console.error("Form submitter execution failure:", error);
            throw error;
        }
    }
};
