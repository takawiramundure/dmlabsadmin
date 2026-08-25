"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Save, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Type, 
  FileText, 
  Target, 
  Users, 
  Calendar,
  Database,
  LayoutTemplate
} from 'lucide-react';
import { useDialog } from "@/context/DialogContext";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import RichTextEditor from "@/components/form/RichTextEditor";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import PageMeta from "@/components/common/PageMeta";

const ProjectPageManager: React.FC = () => {
    const { projectId } = useParams() as { projectId: string };
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<any>(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            if (!projectId) return;
            
            const legacyProjects = ['black-wellness', 'phac-child-welfare', 'umoja-neurodivergent'];
            const isLegacyProject = projectId.startsWith('project-') || legacyProjects.includes(projectId);
            
            // If it's not a legacy research project, redirect to the full dynamic Multi-Section ContentManager
            if (!isLegacyProject) {
                router.replace(`/cms/content-manager?pageId=${projectId}&slug=${projectId}`);
                return;
            }

            try {
                const pageId = projectId.startsWith('project-') ? projectId : `project-${projectId}`;
                const res = await FirestoreService.getPageContent(pageId, currentSite.id);
                const cleanId = projectId.replace('project-', '');
                setData(res || getDefaults(cleanId));
            } catch (error) {
                console.error("Error loading project content:", error);
                setError("Failed to load project content.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [projectId, currentSite.id, router]);

    const getDefaults = (id: string) => {
        const defaults: any = {
            'black-wellness': {
                title: "Black Wellness Project",
                subtitle: "Community Research Initiative",
                description: "Focused on mental wellness within African, Caribbean, and Black communities in the Region of Waterloo.",
                content: "Across Canada, research shows mixed findings. Some surveys suggest many ACB individuals report good mental health, while other studies show higher levels of depression, anxiety, and stress. This points to a gap between how mental health is measured and how it is actually experienced in our communities.\n\nCultural understandings of wellness, along with systemic factors such as racism, financial insecurity, housing challenges, and barriers within health systems, all play a role in shaping mental health outcomes and access to care.\n\nThrough this research, we aim to better understand how ACB adults in the Region of Waterloo experience mental wellness and navigate services, with the goal of informing more culturally responsive supports.",
                objectives: [
                    "Understand how ACB adults experience mental wellness",
                    "Identify barriers to navigating services",
                    "Inform culturally responsive support frameworks"
                ],
                timeline: "Spring 2025 - 2026",
                status: "Active",
                partners: [
                    { name: "Wilfrid Laurier University", role: "Research Partner" },
                    { name: "Wallenstein Feed & Supply Ltd.", role: "Sponsor" }
                ]
            },
            'phac-child-welfare': {
                title: "Strengthening Child Welfare Response",
                subtitle: "PHAC Funded Initiative",
                description: "A Black-led, culturally grounded intervention in Waterloo Region.",
                content: "This project will strengthen how service providers prevent, recognize, and respond to child maltreatment within Black communities. Working with Black caregivers, youth, and service providers, we will co-design culturally grounded training and tools that help organizations respond more effectively to the needs of Black families.\n\nGrounded in Afrocentric and trauma-informed approaches, the project will support organizations across Waterloo Region to integrate culturally responsive practices and address systemic barriers that impact Black families.",
                objectives: [
                    "Strengthen prevention and response to child maltreatment",
                    "Co-design culturally grounded training and tools",
                    "Address systemic barriers impacting Black families"
                ],
                timeline: "April 2026 - March 2030",
                status: "Coming Soon",
                partners: [
                    { name: "Public Health Agency of Canada (PHAC)", role: "Funder" }
                ]
            },
            'umoja-neurodivergent': {
                title: "Umoja Neurodivergent Program",
                subtitle: "Unity in Diversity",
                description: "A critically necessary program born out of necessity for neurodiverse folks in the ACB community.",
                content: "The name Umoja means 'unity' in Swahili. For too long, neurodiverse folks in the ACB community have felt isolated while navigating mainstream institutions and resources. Likewise, the conversation around neurodiversity more broadly has often been framed through a lens that excludes Black voices.\n\nWhen we talk about Black neurodivergence, we must remember to center race and identity, acknowledging that cultural stigmas, systemic barriers, and the history of misdiagnosis have left many individuals and families feeling isolated. Umoja is our response to that isolation.",
                objectives: [
                    "Peer support led by Black folks with lived experience",
                    "Service navigation for complex systems",
                    "Development of a culturally responsive toolkit built by the community",
                    "Identify cultural stigmas and barriers to diagnosis"
                ],
                timeline: "Ongoing",
                status: "Active",
                partners: [
                    { name: "Ontario Trillium Foundation (OTF)", role: "Support" }
                ]
            }
        };
        return defaults[id] || { title: "", subtitle: "", description: "", content: "", objectives: [], timeline: "", status: "", partners: [] };
    };

    const handleSeed = async () => {
        if (!projectId) return;
        const isConfirmed = await confirm({
            title: "Seed Project Data",
            message: "This will overwrite your current changes with the initial hardcoded data. Are you sure you want to proceed?",
            variant: "warning",
            confirmLabel: "Seed Data"
        });

        if (isConfirmed) {
            const cleanId = projectId.replace('project-', '');
            setData(getDefaults(cleanId));
        }
    };

    const handleSave = async () => {
        if (!projectId) return;
        setSaving(true);
        setSuccessMsg("");
        setError("");
        try {
            const staticPages = ['join-us', 'funders', 'volunteer'];
            const pageId = staticPages.includes(projectId) || projectId.startsWith('project-') 
                ? projectId 
                : `project-${projectId}`;
            await FirestoreService.savePageContent(pageId, data, currentSite.id);
            setSuccessMsg("Project content saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (error) {
            console.error("Error saving project content:", error);
            setError("Failed to save project content.");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
    };

    const addListItem = (field: string, defaultValue: any) => {
        setData((prev: any) => ({
            ...prev,
            [field]: [...(prev[field] || []), defaultValue]
        }));
    };

    const removeListItem = (field: string, index: number) => {
        setData((prev: any) => ({
            ...prev,
            [field]: prev[field].filter((_: any, i: number) => i !== index)
        }));
    };

    const updateListItem = (field: string, index: number, value: any) => {
        setData((prev: any) => ({
            ...prev,
            [field]: prev[field].map((item: any, i: number) => i === index ? value : item)
        }));
    };

    if (loading) return <div className="p-8 text-center">Loading Project Editor...</div>;

    return (
        <>
            <PageMeta 
                title="Project Manager | Admin Portal" 
                description={`Editing project: ${data.title || projectId}`} 
            />

            <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => router.push('/cms/research')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Project Manager</h2>
                                <p className="text-gray-500 text-sm">Editing: <span className="font-medium text-brand-500">{data.title || projectId}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button requireSuperAdmin
                                variant="secondary"
                                onClick={handleSeed}
                                startIcon={<Database className="w-5 h-5" />}
                            >
                                Seed Data
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                startIcon={<Save className="w-5 h-5" />}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>

                {successMsg && <Alert variant="success" title="Success" message={successMsg} />}
                {error && <Alert variant="error" title="Error" message={error} />}

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Core Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Header Content */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-3">
                                <Type className="w-5 h-5 text-brand-500" />
                                <h3 className="font-bold text-gray-800">Header Content</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <Label>Project Title</Label>
                                    <Input 
                                        value={data.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                        placeholder="e.g., Black Wellness Project"
                                    />
                                </div>
                                <div>
                                    <Label>Subtitle</Label>
                                    <Input 
                                        value={data.subtitle}
                                        onChange={(e) => updateField('subtitle', e.target.value)}
                                        placeholder="Research Initiative"
                                    />
                                </div>
                                <div>
                                    <Label>Hero Description (Card Summary)</Label>
                                    <textarea 
                                        value={data.description}
                                        onChange={(e) => updateField('description', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all h-24 resize-none"
                                        placeholder="Brief one-sentence summary..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Initiative Narrative */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-3">
                                <FileText className="w-5 h-5 text-brand-500" />
                                <h3 className="font-bold text-gray-800">Initiative Narrative</h3>
                            </div>
                            <RichTextEditor 
                                label="Detailed Description"
                                value={data.content}
                                onChange={(val: string) => updateField('content', val)}
                            />
                        </div>
                    </div>

                    {/* Right Column - Meta & Details */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-3">
                                <Calendar className="w-5 h-5 text-brand-500" />
                                <h3 className="font-bold text-gray-800">Project Meta</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Timeline</Label>
                                    <Input 
                                        value={data.timeline}
                                        onChange={(e) => updateField('timeline', e.target.value)}
                                        placeholder="e.g., 2025 - 2026"
                                    />
                                </div>
                                <div>
                                    <Label>Project Status</Label>
                                    <select 
                                        value={data.status}
                                        onChange={(e) => updateField('status', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Coming Soon">Coming Soon</option>
                                        <option value="On Hold">On Hold</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Objectives List */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                            <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-brand-500" />
                                    <h3 className="font-bold text-gray-800">Objectives</h3>
                                </div>
                                <button 
                                    onClick={() => addListItem('objectives', '')}
                                    className="p-1 text-brand-500 hover:bg-brand-50 rounded-md transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {data.objectives?.map((obj: string, i: number) => (
                                    <div key={i} className="flex gap-2 group">
                                        <Input 
                                            value={obj}
                                            onChange={(e) => updateListItem('objectives', i, e.target.value)}
                                            placeholder="Objective..."
                                            className="flex-grow"
                                        />
                                        <button 
                                            onClick={() => removeListItem('objectives', i)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {!data.objectives?.length && <p className="text-center text-xs text-gray-400 py-2 italic">No objectives added.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Partners Area - Full Width Bottom */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-500" />
                            <h3 className="font-bold text-gray-800">Partners & Stakeholders</h3>
                        </div>
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => addListItem('partners', { name: "", role: "" })}
                            startIcon={<Plus className="w-4 h-4" />}
                        >
                            Add Partner
                        </Button>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {data.partners?.map((partner: any, i: number) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-xl relative group border border-gray-100">
                                <button 
                                    onClick={() => removeListItem('partners', i)}
                                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-wider mb-1">Entity Name</Label>
                                        <Input 
                                            value={partner.name}
                                            onChange={(e) => updateListItem('partners', i, { ...partner, name: e.target.value })}
                                            placeholder="Partner name"
                                            className="h-9"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase tracking-wider mb-1">Role/Support</Label>
                                        <Input 
                                            value={partner.role}
                                            onChange={(e) => updateListItem('partners', i, { ...partner, role: e.target.value })}
                                            placeholder="Role"
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!data.partners?.length && <p className="col-span-full text-center py-4 text-gray-400 italic text-sm">No partners added yet.</p>}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectPageManager;
