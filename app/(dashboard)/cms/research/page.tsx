"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService, PageContent, SectionContent } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import RichTextEditor from "@/components/form/RichTextEditor";
import Alert from "@/components/ui/alert/Alert";
import ImagePicker from "@/components/form/ImagePicker";
import { Eye, EyeOff, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface ResearchSection extends SectionContent {
    enabled?: boolean;
}

interface ResearchPageContent extends PageContent {
    sections: {
        youthSurvey: ResearchSection & { enLink?: string; arLink?: string; listItems?: string[] };
        overview: ResearchSection;
        quotes: ResearchSection & { quotes?: { text: string; author: string }[] };
        activeProjects: ResearchSection & { description?: string; items?: { id: string; title: string; description: string; icon: string; color: string }[] };
        leadConsultant: ResearchSection & { name?: string; bio?: string };
        additionalServices: ResearchSection & { items?: string[] };
        contactCTA: ResearchSection & { buttonText?: string; link?: string };
    };
}

const getDefaultContent = (): ResearchPageContent['sections'] => ({
    youthSurvey: {
        enabled: true,
        heading: "Calling all Black Muslim Youth Across Waterloo Region",
        content: "Are you a Black Muslim youth between the ages of 13-18 within the Waterloo Region? We see you and recognize how important your mental wellbeing is. That’s why we’re creating a peer support network just for you! \n\nThis program will be designed to be culturally attuned to your unique experiences!\n\nWe’d love your insight to help shape the content and ensure it truly services your needs! To share your voice and help us finalize the program, you can scan the QR code or the links below. The survey is offered in English and Arabic!\n\nThis is your chance to tell us what topics matter most to you regarding mental well-being and peer support. Your input will directly shape a program that truly serves our community. We can’t wait to hear from you! 🙌🏾",
        enLink: "https://forms.gle/wQATqreWGLu7mhG26",
        arLink: "https://docs.google.com/forms/d/e/1FAIpQLSeTnYNtL6YH6uQFm80ojtbTjJVDqIOlKEgXdwwTuyyy1wc8Cg/viewform",
    },
    overview: {
        enabled: true,
        heading: "Research and Consulting",
        content: "At KMFW our goal is to foster culturally sensitive evidence-based practice. Our research department hosts some of the best and most experienced minds in innovative and practice research and is set up to apply cutting-edge insights and tools to promote research and informed practice within the Black community. Quality is our goal, and the passion for knowledge building and application is our driver. We stand apart from our colleagues in our commitment to culturally-informed research practices and to research that yields actionable outcomes for those who need it the most.",
    },
    quotes: {
        enabled: true,
        heading: "A Vision for Education",
        content: "",
        images: [{ url: "https://images.pexels.com/photos/1181569/pexels-photo-1181569.jpeg", alt: "Black student studying" }],
        quotes: [
            { text: "Education remains one of any community’s most enduring values. It is sustained by the belief that freedom and education go hand in hand, that learning and training are essential to economic quality and independence", author: "Marian Wright Edelman" },
            { text: "The function of education is to teach one to think intensively and to think critically. Intelligence plus character; that is the goal of true education", author: "Dr. Martin Luther King, Jr." }
        ]
    },
    activeProjects: {
        enabled: true,
        heading: "Active Research Projects",
        content: "",
        description: "Delve into our current initiatives focused on community wellness, systemic change, and neurodivergent advocacy.",
        items: [
            { id: "black-wellness", title: "Black Wellness Project", description: "Focused on mental wellness and the gap between measurement and lived experience in ACB communities.", icon: "FlaskConical", color: "primary" },
            { id: "phac-child-welfare", title: "PHAC Child Welfare", description: "A four-year initiative co-designing culturally grounded interventions for child welfare response.", icon: "Target", color: "highlight" },
            { id: "umoja-neurodivergent", title: "Umoja Program", description: "Centering race and identity in the conversation around Black neurodivergence and peer support.", icon: "Users", color: "primary" }
        ]
    },
    leadConsultant: {
        enabled: true,
        heading: "Founder & Lead Consultant",
        content: "",
        name: "Ajirioghene Evi",
        bio: "Ajirioghene holds a master’s degree in Social Work (Community Development) and has the expertise and knowledge related to strategic service expansion visioning and strategy, as well as strategic implementation and service/product launch. A recent example is a magnification of KMFW from an Afrocentric-counselling individual counselling provider to a multi-service organization with expertise in prevention focus groups, prevention-oriented addictions care, settlement services for families and groups, and collective advocacy. As a consultant, she has mastery of involving and facilitating dialogue between and with internal and external stakeholders in stakeholder engagements and implementation plans, bringing her experience with stakeholder and community needs assessments into line.",
        images: [{ url: "/images/team/ajirioghene-evi.jpg", alt: "Ajirioghene Evi" }]
    },
    additionalServices: {
        enabled: true,
        heading: "Other Research & Consultancy Services",
        content: "",
        items: [
            "Education/Training for students and professionals seeking to conduct culturally sensitive research",
            "Proposal and Report writing",
            "Workshops/Training on Organizational Change Management",
            "Diversity, Equity, Inclusion, Belonging, and Access",
            "Organizing and Facilitating Family Meetings, Mediations, and Case Conferences",
            "Data Collection and Statistical Analysis support"
        ]
    },
    contactCTA: {
        enabled: true,
        heading: "Have a unique ask or need?",
        content: "You can connect with us for a FREE 15 minutes engagement to explore your specific needs by completing the form below. Thank you.",
        buttonText: "Contact Us",
        link: "/contact"
    }
});

export default function ResearchPageManager() {
    const { currentSite } = useSite();
    const [content, setContent] = useState<ResearchPageContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ youthSurvey: true });

    useEffect(() => {
        loadContent();
    }, [currentSite]);

    const loadContent = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await FirestoreService.getPageContent('research', currentSite.id);
            const defaults = getDefaultContent();
            
            if (data && data.sections) {
                // Merge existing data with defaults to ensure all sections exist
                const mergedSections = { ...defaults };
                Object.keys(data.sections).forEach(key => {
                    if (mergedSections[key as keyof typeof defaults]) {
                        mergedSections[key as keyof typeof defaults] = {
                            ...mergedSections[key as keyof typeof defaults],
                            ...(data.sections as any)[key]
                        } as any;
                    }
                });
                setContent({ ...data, sections: mergedSections } as ResearchPageContent);
            } else {
                setContent({
                    title: "Research Page",
                    sections: defaults
                });
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load content.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        setSaving(true);
        setSuccessMsg("");
        setError("");
        try {
            await FirestoreService.savePageContent('research', content, currentSite.id);
            setSuccessMsg("Research page settings saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to save content.");
        } finally {
            setSaving(false);
        }
    };

    const handleSectionUpdate = (sectionId: keyof ResearchPageContent['sections'], updates: any) => {
        if (!content) return;
        setContent({
            ...content,
            sections: {
                ...content.sections,
                [sectionId]: {
                    ...content.sections[sectionId],
                    ...updates
                }
            }
        });
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    if (loading) return <div className="p-6">Loading...</div>;

    const renderSectionControls = (id: keyof ResearchPageContent['sections'], label: string) => {
        const section = content?.sections[id];
        if (!section) return null;
        const isExpanded = expandedSections[id];

        return (
            <div key={id} className={`border rounded-lg transition-all duration-200 ${section.enabled ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-100 opacity-75'}`}>
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleSection(id)}>
                    <div className="flex items-center gap-3">
                        <VersionHistoryManager documentId="research" siteId={currentSite.id} />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSectionUpdate(id, { enabled: !section.enabled });
                            }}
                            className={`p-1.5 rounded-md transition-colors ${section.enabled ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}
                        >
                            {section.enabled ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                        <h3 className={`font-medium ${section.enabled ? 'text-gray-900' : 'text-gray-500'}`}>{label}</h3>
                    </div>
                    <div className="text-gray-400">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>

                {isExpanded && (
                    <div className="p-4 pt-0 border-t border-gray-200 mt-2 space-y-4">
                        <div>
                            <Label>Heading</Label>
                            <Input 
                                value={section.heading || ""} 
                                onChange={(e) => handleSectionUpdate(id, { heading: e.target.value })} 
                            />
                        </div>

                        {id === 'activeProjects' && (
                            <div className="space-y-6">
                                <div>
                                    <Label>Section Description</Label>
                                    <textarea 
                                        className="w-full border rounded p-2 text-sm" 
                                        rows={3}
                                        value={(section as any).description || ""} 
                                        onChange={(e) => handleSectionUpdate(id, { description: e.target.value })} 
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label>Project Cards</Label>
                                    {((section as any).items || []).map((project: any, idx: number) => (
                                        <div key={idx} className="bg-white p-4 border rounded space-y-4 relative group">
                                            <button 
                                                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    const newItems = [...(section as any).items];
                                                    newItems.splice(idx, 1);
                                                    handleSectionUpdate(id, { items: newItems });
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs">Project ID (slug)</Label>
                                                    <Input 
                                                        value={project.id} 
                                                        onChange={(e) => {
                                                            const newItems = [...(section as any).items];
                                                            newItems[idx].id = e.target.value;
                                                            handleSectionUpdate(id, { items: newItems });
                                                        }} 
                                                        placeholder="e.g. black-wellness"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Title</Label>
                                                    <Input 
                                                        value={project.title} 
                                                        onChange={(e) => {
                                                            const newItems = [...(section as any).items];
                                                            newItems[idx].title = e.target.value;
                                                            handleSectionUpdate(id, { items: newItems });
                                                        }} 
                                                        placeholder="e.g. Black Wellness Project"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs">Description</Label>
                                                <textarea 
                                                    className="w-full border rounded p-2 text-sm" 
                                                    rows={2}
                                                    value={project.description} 
                                                    onChange={(e) => {
                                                        const newItems = [...(section as any).items];
                                                        newItems[idx].description = e.target.value;
                                                        handleSectionUpdate(id, { items: newItems });
                                                    }} 
                                                    placeholder="Short summary for the card"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs">Icon (FlaskConical, Target, Users)</Label>
                                                    <Input 
                                                        value={project.icon} 
                                                        onChange={(e) => {
                                                            const newItems = [...(section as any).items];
                                                            newItems[idx].icon = e.target.value;
                                                            handleSectionUpdate(id, { items: newItems });
                                                        }} 
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Accent Color (primary, highlight)</Label>
                                                    <select 
                                                        className="w-full border rounded p-2 text-sm bg-white"
                                                        value={project.color}
                                                        onChange={(e) => {
                                                            const newItems = [...(section as any).items];
                                                            newItems[idx].color = e.target.value;
                                                            handleSectionUpdate(id, { items: newItems });
                                                        }}
                                                    >
                                                        <option value="primary">Primary (Green/Charcoal)</option>
                                                        <option value="highlight">Highlight (Orange/Gold)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const newItems = [...((section as any).items || []), { id: "", title: "", description: "", icon: "FlaskConical", color: "primary" }];
                                        handleSectionUpdate(id, { items: newItems });
                                    }}>
                                        <Plus size={16} className="mr-2" /> Add Project Card
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Custom fields based on section ID */}
                        {id === 'youthSurvey' && (
                            <>
                                <RichTextEditor 
                                    label="Description" 
                                    value={section.content || ""} 
                                    onChange={(val) => handleSectionUpdate(id, { content: val })} 
                                />
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <Label>English Survey Link</Label>
                                        <Input 
                                            value={(section as any).enLink || ""} 
                                            onChange={(e) => handleSectionUpdate(id, { enLink: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <Label>Arabic Survey Link</Label>
                                        <Input 
                                            value={(section as any).arLink || ""} 
                                            onChange={(e) => handleSectionUpdate(id, { arLink: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {id === 'overview' && (
                            <RichTextEditor 
                                label="Content" 
                                value={section.content || ""} 
                                onChange={(val) => handleSectionUpdate(id, { content: val })} 
                            />
                        )}

                        {id === 'quotes' && (
                             <>
                                <ImagePicker 
                                    label="Feature Image" 
                                    value={section.images?.[0]?.url || ""} 
                                    onChange={(url) => handleSectionUpdate(id, { images: [{ url, alt: section.images?.[0]?.alt || "" }] })} 
                                />
                                <div className="space-y-4 mt-6">
                                    <Label>Quotes</Label>
                                    {((section as any).quotes || []).map((q: any, idx: number) => (
                                        <div key={idx} className="bg-white p-4 border rounded relative group">
                                            <button 
                                                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    const newQuotes = [...(section as any).quotes];
                                                    newQuotes.splice(idx, 1);
                                                    handleSectionUpdate(id, { quotes: newQuotes });
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="space-y-2">
                                                <textarea 
                                                    className="w-full border rounded p-2 text-sm" 
                                                    placeholder="Quote text"
                                                    value={q.text}
                                                    onChange={(e) => {
                                                        const newQuotes = [...(section as any).quotes];
                                                        newQuotes[idx].text = e.target.value;
                                                        handleSectionUpdate(id, { quotes: newQuotes });
                                                    }}
                                                />
                                                <Input 
                                                    placeholder="Author" 
                                                    value={q.author}
                                                    onChange={(e) => {
                                                        const newQuotes = [...(section as any).quotes];
                                                        newQuotes[idx].author = e.target.value;
                                                        handleSectionUpdate(id, { quotes: newQuotes });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const newQuotes = [...((section as any).quotes || []), { text: "", author: "" }];
                                        handleSectionUpdate(id, { quotes: newQuotes });
                                    }}>
                                        <Plus size={16} className="mr-2" /> Add Quote
                                    </Button>
                                </div>
                             </>
                        )}

                        {id === 'leadConsultant' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <ImagePicker 
                                        label="Consultant Photo" 
                                        value={section.images?.[0]?.url || ""} 
                                        onChange={(url) => handleSectionUpdate(id, { images: [{ url, alt: section.images?.[0]?.alt || "" }] })} 
                                    />
                                    <div>
                                        <Label>Consultant Name</Label>
                                        <Input 
                                            value={(section as any).name || ""} 
                                            onChange={(e) => handleSectionUpdate(id, { name: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <RichTextEditor 
                                    label="Bio" 
                                    value={(section as any).bio || ""} 
                                    onChange={(val) => handleSectionUpdate(id, { bio: val })} 
                                />
                            </div>
                        )}

                        {id === 'additionalServices' && (
                            <div className="space-y-4">
                                <Label>Bullet Points</Label>
                                {((section as any).items || []).map((item: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                            value={item} 
                                            onChange={(e) => {
                                                const newItems = [...(section as any).items];
                                                newItems[idx] = e.target.value;
                                                handleSectionUpdate(id, { items: newItems });
                                            }} 
                                        />
                                        <Button variant="outline" size="sm" onClick={() => {
                                            const newItems = [...(section as any).items];
                                            newItems.splice(idx, 1);
                                            handleSectionUpdate(id, { items: newItems });
                                        }}>
                                            <Trash2 size={16} className="text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => {
                                    const newItems = [...((section as any).items || []), ""];
                                    handleSectionUpdate(id, { items: newItems });
                                }}>
                                    <Plus size={16} className="mr-2" /> Add Bullet
                                </Button>
                            </div>
                        )}

                        {id === 'contactCTA' && (
                            <>
                                <RichTextEditor 
                                    label="Content" 
                                    value={section.content || ""} 
                                    onChange={(val) => handleSectionUpdate(id, { content: val })} 
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Button Text</Label><Input value={(section as any).buttonText || ""} onChange={(e) => handleSectionUpdate(id, { buttonText: e.target.value })} /></div>
                                    <div><Label>Link (e.g. /contact)</Label><Input value={(section as any).link || ""} onChange={(e) => handleSectionUpdate(id, { link: e.target.value })} /></div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <PageMeta 
                title="Research Page Manager | Admin Portal" 
                description="Manage research overview, services, and consultant profiles." 
            />
            
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold">Research Page Manager</h2>
                        <p className="text-gray-500">Manage research overview, services, and consultant profiles.</p>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <div className="space-y-6">
                    {renderSectionControls('youthSurvey', 'Black Muslim Youth Survey Banner')}
                    {renderSectionControls('overview', 'Main Research Overview')}
                    {renderSectionControls('quotes', 'Quotes & Educational Vision')}
                    {renderSectionControls('activeProjects', 'Active Research Projects Grid')}
                    {renderSectionControls('leadConsultant', 'Founder & Lead Consultant Profile')}
                    {renderSectionControls('additionalServices', 'Other Consultancy Services')}
                    {renderSectionControls('contactCTA', 'Contact/Engagement Call-to-Action')}
                </div>
            </div>
        </>
    );
}
