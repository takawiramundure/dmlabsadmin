"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

export default function FormsManager() {
    const { currentSite } = useSite();
    const router = useRouter();
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFormId, setNewFormId] = useState("");
    const [newFormTitle, setNewFormTitle] = useState("");

    const loadForms = async () => {
        setLoading(true);
        try {
            let data = await FirestoreService.getForms(currentSite.id);
            let didSeed = false;
            
            // Auto-migration / Seeding: Check if specific forms are missing
            const formIds = data.map((f: any) => f.id);
            
            if (currentSite.id === 'phcg') {
                if (!formIds.includes('appointment_form')) {
                    await FirestoreService.saveForm('phcg', 'appointment_form', {
                        title: "Book a Free Consultation",
                        subtitle: "Appointment",
                        description: "Fill out the form below and we will get back to you as soon as possible.",
                        submit_text: "Request a Consultation",
                        success_message: "Consultation scheduled successfully! We'll contact you soon.",
                        recipient_email: "info@privatehomecareguru.com",
                        form_fields: [
                            { id: 'name', label: 'Full Name', type: 'text', required: true },
                            { id: 'email', label: 'Email Address', type: 'email', required: true },
                            { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
                            { id: 'service', label: 'Service Needed', type: 'select', required: true },
                            { id: 'age', label: 'Age', type: 'text', required: true },
                            { id: 'address', label: 'Current Address', type: 'text', required: true },
                            { id: 'hoursNeeded', label: 'Hours Needed', type: 'text', required: true },
                            { id: 'assessmentDate', label: 'Preferred Date', type: 'date', required: true }
                        ]
                    });
                    didSeed = true;
                }
                if (!formIds.includes('application_form')) {
                    await FirestoreService.saveForm('phcg', 'application_form', {
                        title: "Join Our Care Team",
                        subtitle: "Careers",
                        description: "Fill out the application form below and our HR team will get back to you.",
                        submit_text: "Submit Application",
                        success_message: "Application submitted successfully! Our HR team will reach out.",
                        recipient_email: "info@privatehomecareguru.com",
                        form_fields: [
                            { id: 'name', label: 'Full Name', type: 'text', required: true },
                            { id: 'email', label: 'Email Address', type: 'email', required: true },
                            { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
                            { id: 'startDate', label: 'Start Date', type: 'date', required: true },
                            { id: 'legallyAbleToWork', label: 'Legally Able to Work in Canada?', type: 'select', required: true },
                            { id: 'qualifications', label: 'Highest Qualifications', type: 'select', required: true },
                            { id: 'address', label: 'Current Address', type: 'text', required: true }
                        ]
                    });
                    didSeed = true;
                }
            } else if (currentSite.id === 'dmlabs' && !formIds.includes('contact_form')) {
                await FirestoreService.saveForm('dmlabs', 'contact_form', {
                    title: "Start a Project",
                    subtitle: "Contact Us",
                    description: "Let's build the future together.",
                    submit_text: "Send Inquiry",
                    success_message: "Brief Received. Our strategy team is reviewing your project requirements.",
                    recipient_email: "hello@digitalmaples.agency",
                    form_fields: [
                        { id: 'name', label: 'Full Name', type: 'text', required: true },
                        { id: 'email', label: 'Work Email', type: 'email', required: true },
                        { id: 'phone', label: 'Phone Number', type: 'tel', required: false },
                        { id: 'company', label: 'Company/Organization', type: 'text', required: false },
                        { id: 'service', label: 'Selected Package / Service', type: 'select', required: true },
                        { id: 'budget', label: 'Estimated Budget', type: 'select', required: true },
                        { id: 'timeline', label: 'Project Timeline', type: 'select', required: true },
                        { id: 'message', label: 'The Brief / Challenge', type: 'textarea', required: true },
                        { id: 'discovery', label: 'How did you hear about us?', type: 'text', required: false }
                    ]
                });
                didSeed = true;
            } else if (currentSite.id === 'noel' && !formIds.includes('contact_form')) {
                await FirestoreService.saveForm('noel', 'contact_form', {
                    title: "Contact Noel Construction",
                    subtitle: "Inquiries",
                    description: "Tell us about your next project.",
                    submit_text: "Request a Consultation",
                    success_message: "Message Sent! We will get back to you shortly.",
                    recipient_email: "contact@noelconstruction.ca",
                    form_fields: [
                        { id: 'name', label: 'Full Name', type: 'text', required: true },
                        { id: 'email', label: 'Email Address', type: 'email', required: true },
                        { id: 'phone', label: 'Phone Number', type: 'tel', required: false },
                        { id: 'projectType', label: 'Project Type', type: 'text', required: true },
                        { id: 'message', label: 'Message', type: 'textarea', required: true }
                    ]
                });
                didSeed = true;
            } else if (currentSite.id === 'aitasol' && !formIds.includes('contact_form')) {
                await FirestoreService.saveForm('aitasol', 'contact_form', {
                    title: "Send a Message",
                    subtitle: "Contact",
                    description: "Get in touch with the Aitasol team.",
                    submit_text: "Send Message",
                    success_message: "Message Sent! Thank you for reaching out.",
                    recipient_email: "info@aitasol.com",
                    form_fields: [
                        { id: 'name', label: 'Name', type: 'text', required: true },
                        { id: 'email', label: 'Email Address', type: 'email', required: true },
                        { id: 'message', label: 'Message', type: 'textarea', required: true }
                    ]
                });
                didSeed = true;
            } else if (currentSite.id === 'bweic' && !formIds.includes('newsletter_form')) {
                await FirestoreService.saveForm('bweic', 'newsletter_form', {
                    title: "Newsletter Signup",
                    subtitle: "Subscribe",
                    description: "Sign up to our newsletter.",
                    submit_text: "Subscribe",
                    success_message: "Thank you for subscribing!",
                    recipient_email: "info@bweic.ca",
                    form_fields: [
                        { id: 'email', label: 'Email Address', type: 'email', required: true }
                    ]
                });
                didSeed = true;
            }
            
            if (didSeed) {
                data = await FirestoreService.getForms(currentSite.id);
            }
            
            setForms(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load forms.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadForms();
    }, [currentSite]);

    const submitCreateForm = async () => {
        if (!newFormId || !newFormTitle) return;

        setSaving(true);
        setError("");
        setSuccessMsg("");
        
        try {
            const defaultData = {
                title: newFormTitle,
                subtitle: "",
                description: "",
                submit_text: "Submit",
                success_message: "Thank you! Your submission has been received.",
                form_fields: [
                    { id: 'name', label: 'Full Name', type: 'text', required: true },
                    { id: 'email', label: 'Email Address', type: 'email', required: true },
                ]
            };
            
            await FirestoreService.saveForm(currentSite.id, newFormId, defaultData);
            setSuccessMsg(`Successfully created form: ${newFormTitle}`);
            setIsCreateModalOpen(false);
            
            // Redirect to edit page
            router.push(`/cms/forms/${newFormId}`);
        } catch (err) {
            console.error(err);
            setError("Failed to create form.");
            setSaving(false);
        }
    };

    const handleDelete = async (formId: string) => {
        if (!confirm(`Are you sure you want to delete the form "${formId}"? This action cannot be undone.`)) return;
        
        setSaving(true);
        try {
            await FirestoreService.deleteForm(currentSite.id, formId);
            setSuccessMsg(`Deleted form ${formId}`);
            await loadForms();
        } catch (err) {
            console.error(err);
            setError("Failed to delete form.");
        } finally {
            setSaving(false);
            setTimeout(() => setSuccessMsg(""), 3000);
        }
    };

    const handleEdit = (formId: string) => {
        router.push(`/cms/forms/${formId}`);
    };

    if (loading) return <div className="p-6">Loading forms...</div>;

    return (
        <>
            <PageMeta title="Forms Manager | Admin Portal" description="Manage dynamic forms across the site" />
            
            <div className="p-6 max-w-6xl space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Forms Manager</h2>
                        <p className="text-sm text-gray-500">Create and manage dynamic forms for {currentSite.name}</p>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Form
                    </Button>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map((form) => (
                        <div key={form.id} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{form.title || form.id}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1">
                                {form.description || "No description provided."}
                            </p>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    {form.id}
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(form.id)}>
                                        <Edit2 size={14} className="mr-1" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(form.id)} className="text-red-500 hover:bg-red-50 hover:border-red-200">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {forms.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl">
                            <p className="text-gray-500 mb-4">No forms found for this site.</p>
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                Create Your First Form
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Form"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create a new dynamic form to collect information from users.
                    </p>
                    
                    <div>
                        <Label>Form Title</Label>
                        <Input 
                            value={newFormTitle} 
                            onChange={(e) => setNewFormTitle(e.target.value)}
                            placeholder="e.g. Event Registration"
                        />
                    </div>

                    <div>
                        <Label>Form ID</Label>
                        <Input 
                            value={newFormId} 
                            onChange={(e) => setNewFormId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            placeholder="e.g. event_registration"
                        />
                        <p className="text-xs text-gray-400 mt-1">This is a unique identifier used in the code. Only lowercase letters, numbers, and underscores.</p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={submitCreateForm} disabled={saving || !newFormId || !newFormTitle}>
                            {saving ? "Creating..." : "Create Form"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
