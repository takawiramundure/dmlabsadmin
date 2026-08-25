"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ImagePicker from "@/components/form/ImagePicker";
import RichTextEditor from "@/components/form/RichTextEditor";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import MediaLibrary from "@/components/common/MediaLibrary";
import { useDialog } from "@/context/DialogContext";
import { Modal } from "@/components/ui/modal";
import InsertSidebar from "@/components/common/InsertSidebar";
import { 
    Heart, 
    User, 
    Handshake, 
    Gift, 
    Sparkles, 
    Save, 
    RotateCcw, 
    Upload, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Pin,
    Image as ImageIcon
} from 'lucide-react';
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface Celebrating5YearsData {
    sections: {
        directorMessage: {
            founderName: string;
            founderTitle: string;
            founderImage: string;
            tagline: string;
            heading: string;
            content: string;
            closingLine: string;
        };
        partnerMessages: {
            heading: string;
            content: string;
            images: { url: string; alt: string }[];
        };
        investInKmfw: {
            heading: string;
            subtitle: string;
            content: string;
        };
        [key: string]: any;
    };
    sectionOrder?: string[];
}

const DEFAULT_DATA: Celebrating5YearsData = {
    sections: {
        directorMessage: {
            founderName: "Ajirioghene Evi",
            founderTitle: "Founding Director",
            founderImage: "https://firebasestorage.googleapis.com/v0/b/nspc-web.firebasestorage.app/o/kmfw%2F1774674358502_jiri.jpg?alt=media&token=13f0aac3-9feb-4eb2-9712-bb4c98a265b2",
            tagline: "Celebrating 5 Years of Kind Minds Family Wellness",
            heading: "Celebrating 5 Years of Kind Minds Family Wellness",
            content: `<p>As I pause to reflect on the journey of Kind Minds Family Wellness (KMFW), I am filled with profound gratitude and a deep sense of purpose. Five years ago, what began as a vision that children, youth, adults, and seniors in our communities’ deserved spaces that honour culture, identity, and belonging has now blossomed into a thriving organization. From our earliest days as a fully virtual team, we have grown into a vibrant hub with multiple community partners and collaborations. This growth reminds me every day that meaningful change cannot and must not be done in silos.</p><p>Our <strong>foundations</strong> have been clear from the beginning: cultural grounding, community engagement, and research. These guide us in designing programs that not only serve immediate needs but also build resilience and capacity across generations. We have witnessed the incredible transformation of youth who first joined us in middle school, later graduated from high school, and went on to thrive in universities. Many who were once high school students are now excelling as undergraduates and graduates, with some even advancing into doctoral programs. Their journeys reflect the breaking of barriers that have historically limited Black youth and stand as living proof of what becomes possible when support, advocacy, and opportunity meet determination.</p><p>Equally inspiring has been the growth of our volunteers. Many began by giving their time in small ways and have since become the roots that keep this organization strong. Some joining us as staff, others as interns, and still many continuing to volunteer with deep dedication. Their work has been nothing short of extraordinary. They remind us that service is not simply about giving hours, but about shaping futures, strengthening programs, and walking alongside community members with compassion and care.</p><p>But KMFW is more than a place that gives, it is also a <strong>protected space for those who give of themselves</strong>, a place where advocacy is collective, challenges are validated, and every success is celebrated together. Through family-based programming and intergenerational gatherings, we have witnessed not only friendships but true camaraderie: people finding belonging, creating memories, and carrying forward the richness of culture. KMFW has become a place where settlement support, essential needs, and advocacy are grounded in dignity, and where culture is not just preserved but celebrated as the heart of resilience.</p><p>In the Region of Waterloo, KMFW is uniquely positioned to provide <strong>Afrocentric counseling and wellness support</strong>; services that reflect the lived realities of Black families and are often missing from mainstream systems. We are intentional about weaving wellness and psychoeducation into every program, ensuring that no matter the entry point (be it youth leadership, senior engagement, family settlement, or skill-building) participants leave with tools for healing, resilience, and growth. This holistic and culturally grounded approach is not only a service; it is a model of advocacy and empowerment that strengthens the fabric of our community.</p><p>Often, we are the “go-to” place for community members seeking resources, support, or simply a space to be seen. Even with limited resources, we have navigated challenges with creativity and determination; always with the support of our trusted partners who stand with us in ensuring no one is left behind.</p><p>Looking back, I see impact. Looking forward, I see possibility. KMFW stands as a Black-led, Black-serving, and Black-mandated grassroots organization. One deeply rooted in the realities of our communities. Yet we are also committed to ensuring that our doors, programs, and advocacy extend to all, regardless of racial identity. Culture, equity, and belonging are not exclusive, they are the <strong>roots of inclusive growth</strong>. Whether through our global cooking classes that nourish both body and spirit, our leadership and career readiness programs, or our research, internship, and volunteer pathways, we continue to create spaces for connection, healing, and thriving.</p><p>As we celebrate five years, I am reminded that this work is only possible because of the people who walk this journey with us. To our staff and volunteers, your dedication and creativity are the lifeblood of our programs. To our partners, funders, and sponsors, your belief in our mission has allowed us to scale ideas into impact. And most importantly, to our service users, you are our teachers. Your feedback, your challenges, and your triumphs shape our evaluations, sharpen our strategies, and keep us accountable.</p><p>My vision and hope for the years to come is that our community continues to <strong>invest in this work</strong> so it can remain sustainable for generations. There are many ways to do so: through financial contributions, in-kind donations, sponsorships, partnerships, and volunteering your time and skills. Every act of support makes this collective journey possible.</p><p>To those who wish to walk with us; whether through support, collaboration, or contribution, we welcome you with open arms. KMFW is not just an organization; it is a community. We invite you to be part of this journey, to celebrate culture, to build belonging, and to strengthen the bonds of camaraderie that make us resilient.</p><p><strong>Celebrate 5 years with us by investing in the next 5. Give, partner, or volunteer—your support keeps our community thriving. </strong>Please visit <a href="/donate">here</a> to learn more about donating and supporting our work.</p><p>You can learn more about our programs and services <a href="/services">here.</a></p>`,
            closingLine: "In solidarity,"
        },
        partnerMessages: {
            heading: "Support Along the Way",
            content: "In honour of our 5th year of service, we are proud to share celebratory messages from the organizations that have supported us along the way. We extend our sincerest gratitude to each of our partners for walking alongside us on this journey.",
            images: []
        },
        investInKmfw: {
            heading: "Invest in the Next 5 Years of KMFW",
            subtitle: "Kind Minds Family Wellness is 5 years strong! Help us celebrate 5 years by investing in the next 5. Give, partner, or volunteer—your support keeps our community thriving.",
            content: `<p>For the past five years, Kind Minds Family Wellness has been a home for culture, belonging, and healing. From Afrocentric counseling to intergenerational programs, from youth leadership to senior engagement, we have created a protected space for advocacy, wellness, and celebration.</p><p>As we look to the future, we need our community’s support to ensure this work continues to thrive. You can invest in KMFW by making a financial contribution, donating essential items, partnering on programs, or sharing your professional skills.</p>`
        }
    }
};

const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white';
const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

export default function Celebrating5YearsManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [data, setData] = useState<Celebrating5YearsData>(DEFAULT_DATA);
    const [activeTab, setActiveTab] = useState<'director' | 'partners' | 'invest' | 'custom'>('director');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const [isInsertSidebarOpen, setIsInsertSidebarOpen] = useState(false);
    const [reusableComponents, setReusableComponents] = useState<any[]>([]);
    const [tagReusableSectionId, setTagReusableSectionId] = useState<string | null>(null);
    const [reusableLabel, setReusableLabel] = useState("");
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    const loadReusableComponents = async () => {
        if (!currentSite?.id) return;
        try {
            const data = await FirestoreService.getReusableSections(currentSite.id);
            setReusableComponents(data);
        } catch (e) {
            console.error("Error loading reusable components:", e);
        }
    };

    const handleTagAsReusableClick = (sectionId: string, currentSection: any) => {
        setTagReusableSectionId(sectionId);
        setReusableLabel(currentSection.heading || sectionId);
        setIsTagModalOpen(true);
    };

    const handleSaveTagAsReusable = async () => {
        if (!tagReusableSectionId || !data) return;
        const currentSection = data.sections?.[tagReusableSectionId];
        if (!currentSection) return;

        try {
            await FirestoreService.saveReusableSection(currentSite.id, tagReusableSectionId, {
                ...currentSection,
                reusableLabel: reusableLabel || tagReusableSectionId
            });
            setStatus({ type: 'success', msg: `Section "${reusableLabel || tagReusableSectionId}" tagged as reusable!` });
            setTimeout(() => setStatus(null), 3000);
            setIsTagModalOpen(false);
            await loadReusableComponents();
        } catch (e: any) {
            console.error("Error tagging section as reusable:", e);
            setStatus({ type: 'error', msg: `Failed to save reusable section: ${e.message}` });
        }
    };

    const handleInsertReusableSection = (reusableSec: any) => {
        if (!data) return;
        const newId = `${reusableSec.id.split('_')[0] || 'reusable'}_${Date.now()}`;
        const clonedData = { ...reusableSec };
        delete clonedData.reusableLabel;
        delete clonedData.lastUpdated;

        setData({
            ...data,
            sections: {
                ...(data.sections || {}),
                [newId]: clonedData
            },
            sectionOrder: [...(data.sectionOrder || ['directorMessage', 'partnerMessages', 'investInKmfw']), newId]
        });
        setActiveTab('custom');
        setIsInsertSidebarOpen(false);
        setStatus({ type: 'success', msg: `Added reusable component "${reusableSec.reusableLabel || reusableSec.heading || reusableSec.id}"! Remember to save changes.` });
        setTimeout(() => setStatus(null), 3000);
    };

    useEffect(() => {
        if (currentSite?.id) {
            loadData();
            loadReusableComponents();
        }
    }, [currentSite?.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const doc = await FirestoreService.getPageContent('celebrating-5-years', currentSite.id);
            if (doc) {
                const mergedSections = {
                    ...doc.sections,
                    directorMessage: {
                        ...DEFAULT_DATA.sections.directorMessage,
                        ...(doc.sections?.directorMessage || {})
                    },
                    partnerMessages: {
                        ...DEFAULT_DATA.sections.partnerMessages,
                        ...(doc.sections?.partnerMessages || {})
                    },
                    investInKmfw: {
                        ...DEFAULT_DATA.sections.investInKmfw,
                        ...(doc.sections?.investInKmfw || {})
                    }
                };
                setData({
                    ...doc,
                    sections: mergedSections
                } as any);
            } else {
                setData(DEFAULT_DATA);
            }
        } catch (e) {
            console.error('Error loading Celebrating 5 Years page content:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await FirestoreService.savePageContent('celebrating-5-years', data as any, currentSite.id);
            setStatus({ type: 'success', msg: "Celebrating 5 Years content saved successfully!" });
        } catch (e) {
            console.error('Error saving:', e);
            setStatus({ type: 'error', msg: 'Failed to save. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreDefaults = async () => {
        const isConfirmed = await confirm({
            title: "Restore Defaults?",
            message: "This will reset all sections on this page to the default template. Unsaved changes will be overwritten. Do you want to proceed?",
            variant: "warning",
            confirmLabel: "Restore Defaults"
        });

        if (isConfirmed) {
            setData(DEFAULT_DATA);
            setStatus({ type: 'success', msg: "Default template loaded. Remember to click 'Save Changes' to store them." });
        }
    };

    // State updaters
    const updateDirectorField = (field: keyof typeof DEFAULT_DATA.sections.directorMessage, value: any) => {
        setData(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                directorMessage: {
                    ...prev.sections.directorMessage,
                    [field]: value
                }
            }
        }));
    };

    const updatePartnerField = (field: keyof typeof DEFAULT_DATA.sections.partnerMessages, value: any) => {
        setData(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                partnerMessages: {
                    ...prev.sections.partnerMessages,
                    [field]: value
                }
            }
        }));
    };

    const updateInvestField = (field: keyof typeof DEFAULT_DATA.sections.investInKmfw, value: any) => {
        setData(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                investInKmfw: {
                    ...prev.sections.investInKmfw,
                    [field]: value
                }
            }
        }));
    };

    // Partner Wishes Gallery controls
    const addMultiplePartnerImages = (urls: string[]) => {
        const newImages = urls.map(url => ({ url, alt: "" }));
        setData(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                partnerMessages: {
                    ...prev.sections.partnerMessages,
                    images: [...(prev.sections.partnerMessages.images || []), ...newImages]
                }
            }
        }));
    };

    const removePartnerImage = async (index: number) => {
        const isConfirmed = await confirm({
            title: "Remove Card?",
            message: "Remove this partner wish image card from the gallery?",
            variant: "danger",
            confirmLabel: "Remove"
        });

        if (isConfirmed) {
            setData(prev => {
                const currentImages = [...(prev.sections.partnerMessages.images || [])];
                currentImages.splice(index, 1);
                return {
                    ...prev,
                    sections: {
                        ...prev.sections,
                        partnerMessages: {
                            ...prev.sections.partnerMessages,
                            images: currentImages
                        }
                    }
                };
            });
        }
    };

    const movePartnerImage = (index: number, direction: 'left' | 'right') => {
        setData(prev => {
            const currentImages = [...(prev.sections.partnerMessages.images || [])];
            const targetIndex = direction === 'left' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= currentImages.length) return prev;

            const temp = currentImages[index];
            currentImages[index] = currentImages[targetIndex];
            currentImages[targetIndex] = temp;

            return {
                ...prev,
                sections: {
                    ...prev.sections,
                    partnerMessages: {
                        ...prev.sections.partnerMessages,
                        images: currentImages
                    }
                }
            };
        });
    };

    const updatePartnerImageAlt = (index: number, alt: string) => {
        setData(prev => {
            const currentImages = [...(prev.sections.partnerMessages.images || [])];
            currentImages[index] = { ...currentImages[index], alt };
            return {
                ...prev,
                sections: {
                    ...prev.sections,
                    partnerMessages: {
                        ...prev.sections.partnerMessages,
                        images: currentImages
                    }
                }
            };
        });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
    }

    const partnerImages = data.sections.partnerMessages.images || [];

    return (
        <>
            <PageMeta title="Celebrating 5 Years Manager | Admin" description="Edit the 5 Years celebration page content" />
            <PageBreadcrumb pageTitle="Celebrating 5 Years" />

            <div className="p-6 space-y-6">
                {/* Header Actions */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-teal-600" />
                            Celebrating 5 Years Manager
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Edit KMFW Celebrating 5 Years content, partner wishes gallery, and future investment CTAs.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <VersionHistoryManager documentId="celebrating-5-years" siteId={currentSite.id} />
                        <Button 
                            variant="outline" 
                            onClick={handleRestoreDefaults}
                            className="flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Restore Defaults
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsInsertSidebarOpen(true)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 animate-pulse hover:animate-none flex items-center gap-2"
                        >
                            + Add Component / Section
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {/* Status Alert */}
                {status && (
                    <Alert
                        variant={status.type}
                        title={status.type === 'success' ? 'Success' : 'Error'}
                        message={status.msg}
                    />
                )}

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        {[
                            { id: 'director', name: "Director's Message", icon: Heart },
                            { id: 'partners', name: "Partner Wishes & Cards", icon: Handshake },
                            { id: 'invest', name: "Invest in Future", icon: Gift },
                            { id: 'custom', name: "Additional Sections", icon: Sparkles }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
                                        isActive
                                            ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab content editor panels */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    {/* Tab 1: Founding Director's Message */}
                    {activeTab === 'director' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-3 mb-4">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-white">
                                    <User className="w-5 h-5 text-teal-600" />
                                    <h3 className="text-lg font-bold">Founding Director Message Fields</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTagAsReusableClick('directorMessage', data.sections.directorMessage)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1.5 text-xs font-semibold"
                                    title="Tag as Reusable"
                                >
                                    <Pin size={16} /> Tag as Reusable
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Founder Name</label>
                                        <input 
                                            className={inputClass} 
                                            value={data.sections.directorMessage.founderName} 
                                            onChange={e => updateDirectorField('founderName', e.target.value)} 
                                            placeholder="Ajirioghene Evi" 
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Founder Title</label>
                                        <input 
                                            className={inputClass} 
                                            value={data.sections.directorMessage.founderTitle} 
                                            onChange={e => updateDirectorField('founderTitle', e.target.value)} 
                                            placeholder="Founding Director" 
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tagline</label>
                                        <input 
                                            className={inputClass} 
                                            value={data.sections.directorMessage.tagline} 
                                            onChange={e => updateDirectorField('tagline', e.target.value)} 
                                            placeholder="Celebrating 5 Years of Kind Minds Family Wellness" 
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Section Heading</label>
                                        <input 
                                            className={inputClass} 
                                            value={data.sections.directorMessage.heading} 
                                            onChange={e => updateDirectorField('heading', e.target.value)} 
                                            placeholder="Celebrating 5 Years of Kind Minds Family Wellness" 
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Closing Sign-Off</label>
                                        <input 
                                            className={inputClass} 
                                            value={data.sections.directorMessage.closingLine} 
                                            onChange={e => updateDirectorField('closingLine', e.target.value)} 
                                            placeholder="In solidarity," 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className={labelClass}>Founder Image / Portrait</label>
                                        <ImagePicker
                                            value={data.sections.directorMessage.founderImage}
                                            onChange={url => updateDirectorField('founderImage', url)}
                                            placeholder="Upload or select founder portrait..."
                                            helpText="Aspect ratio (4:5) recommended. Automatically optimized to maximum 3 MB."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Label>Letter Body Content (Rich Text)</Label>
                                <RichTextEditor
                                    value={data.sections.directorMessage.content}
                                    onChange={val => updateDirectorField('content', val)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Partner Wishes */}
                    {activeTab === 'partners' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-3 mb-4">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-white">
                                    <Handshake className="w-5 h-5 text-teal-600" />
                                    <h3 className="text-lg font-bold">Partner Wishes & Congratulatory Cards</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTagAsReusableClick('partnerMessages', data.sections.partnerMessages)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1.5 text-xs font-semibold"
                                    title="Tag as Reusable"
                                >
                                    <Pin size={16} /> Tag as Reusable
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Section Heading</label>
                                    <input 
                                        className={inputClass} 
                                        value={data.sections.partnerMessages.heading} 
                                        onChange={e => updatePartnerField('heading', e.target.value)} 
                                        placeholder="Support Along the Way" 
                                    />
                                </div>

                                <div>
                                    <Label>Section Description (Rich Text)</Label>
                                    <RichTextEditor
                                        value={data.sections.partnerMessages.content}
                                        onChange={val => updatePartnerField('content', val)}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="text-base font-semibold text-gray-800 dark:text-white">Partner Congratulatory Cards</h4>
                                        <p className="text-xs text-gray-400">Select or upload cards from the media library (max 10 images at once, optimized under 3 MB).</p>
                                    </div>
                                    <Button 
                                        onClick={() => setIsLibraryOpen(true)}
                                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Select Cards
                                    </Button>
                                </div>

                                {partnerImages.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {partnerImages.map((img, idx) => (
                                            <div 
                                                key={idx} 
                                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-between"
                                            >
                                                <div className="aspect-video w-full relative bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                                    <img 
                                                        src={img.url} 
                                                        alt={img.alt || `Card ${idx + 1}`} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Alt Text / Title</label>
                                                        <input 
                                                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
                                                            value={img.alt} 
                                                            onChange={e => updatePartnerImageAlt(idx, e.target.value)} 
                                                            placeholder="Congratulatory message from..." 
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
                                                        <div className="flex items-center gap-1">
                                                            <button 
                                                                onClick={() => movePartnerImage(idx, 'left')} 
                                                                disabled={idx === 0}
                                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 disabled:opacity-30"
                                                                title="Move Left"
                                                            >
                                                                <ChevronLeft className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => movePartnerImage(idx, 'right')} 
                                                                disabled={idx === partnerImages.length - 1}
                                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 disabled:opacity-30"
                                                                title="Move Right"
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <button 
                                                            onClick={() => removePartnerImage(idx)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                                                            title="Delete Card"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <h5 className="font-semibold text-gray-600 dark:text-gray-400">No images added</h5>
                                        <p className="text-xs text-gray-400 mt-1 mb-4">Click "Select Cards" to pick congratulatory wishes images.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Invest Section */}
                    {activeTab === 'invest' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-3 mb-4">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-white">
                                    <Gift className="w-5 h-5 text-teal-600" />
                                    <h3 className="text-lg font-bold">Invest in KMFW Future Content</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTagAsReusableClick('investInKmfw', data.sections.investInKmfw)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1.5 text-xs font-semibold"
                                    title="Tag as Reusable"
                                >
                                    <Pin size={16} /> Tag as Reusable
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Section Heading</label>
                                    <input 
                                        className={inputClass} 
                                        value={data.sections.investInKmfw.heading} 
                                        onChange={e => updateInvestField('heading', e.target.value)} 
                                        placeholder="Invest in the Next 5 Years of KMFW" 
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Section Subtitle</label>
                                    <textarea 
                                        className={`${inputClass} min-h-[80px]`}
                                        value={data.sections.investInKmfw.subtitle} 
                                        onChange={e => updateInvestField('subtitle', e.target.value)} 
                                        placeholder="Kind Minds Family Wellness is 5 years strong!..." 
                                    />
                                </div>

                                <div>
                                    <Label>Section Detailed Content (Rich Text)</Label>
                                    <RichTextEditor
                                        value={data.sections.investInKmfw.content}
                                        onChange={val => updateInvestField('content', val)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'custom' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-white border-b pb-3 mb-4">
                                <Sparkles className="w-5 h-5 text-teal-600" />
                                <h3 className="text-lg font-bold">Additional Custom Sections</h3>
                            </div>

                            {(() => {
                                const customKeys = Object.keys(data.sections || {}).filter(
                                    key => !['directorMessage', 'partnerMessages', 'investInKmfw'].includes(key)
                                );
                                const order = data.sectionOrder || [];
                                const sortedCustomKeys = [...customKeys].sort((a, b) => {
                                    const indexA = order.indexOf(a);
                                    const indexB = order.indexOf(b);
                                    if (indexA === -1 && indexB === -1) return 0;
                                    if (indexA === -1) return 1;
                                    if (indexB === -1) return -1;
                                    return indexA - indexB;
                                });

                                if (sortedCustomKeys.length === 0) {
                                    return (
                                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <h5 className="font-semibold text-gray-600 dark:text-gray-400">No additional sections added</h5>
                                            <p className="text-xs text-gray-400 mt-1 mb-4">Click "+ Add Component / Section" at the top right to add dynamic custom sections or reusable components.</p>
                                        </div>
                                    );
                                }

                                const moveSection = (idx: number, direction: 'up' | 'down') => {
                                    const newOrder = [...(data.sectionOrder || ['directorMessage', 'partnerMessages', 'investInKmfw', ...sortedCustomKeys])];
                                    const globalIdx = newOrder.indexOf(sortedCustomKeys[idx]);
                                    const targetGlobalIdx = direction === 'up' ? globalIdx - 1 : globalIdx + 1;
                                    if (targetGlobalIdx < 0 || targetGlobalIdx >= newOrder.length) return;
                                    [newOrder[globalIdx], newOrder[targetGlobalIdx]] = [newOrder[targetGlobalIdx], newOrder[globalIdx]];
                                    setData(prev => ({ ...prev, sectionOrder: newOrder }));
                                };

                                return (
                                    <div className="space-y-4">
                                        {sortedCustomKeys.map((key, idx) => {
                                            const section = data.sections[key] || {};
                                            return (
                                                <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 space-y-4">
                                                    <div className="flex justify-between items-center border-b pb-2">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                disabled={idx === 0}
                                                                onClick={() => moveSection(idx, 'up')}
                                                                className="p-1 hover:text-blue-500 disabled:opacity-30 transition-colors text-gray-400"
                                                                title="Move Up"
                                                            >
                                                                <ChevronUp size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={idx === sortedCustomKeys.length - 1}
                                                                onClick={() => moveSection(idx, 'down')}
                                                                className="p-1 hover:text-blue-500 disabled:opacity-30 transition-colors text-gray-400"
                                                                title="Move Down"
                                                            >
                                                                <ChevronDown size={16} />
                                                            </button>
                                                            <span className="font-bold text-sm text-gray-600 dark:text-white">
                                                                {section.heading || key}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleTagAsReusableClick(key, section)}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="Tag as Reusable"
                                                            >
                                                                <Pin size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    const isConfirmed = await confirm({
                                                                        title: "Remove Section?",
                                                                        message: `Are you sure you want to delete the custom section "${section.heading || key}"?`,
                                                                        variant: "danger",
                                                                        confirmLabel: "Delete"
                                                                    });
                                                                    if (isConfirmed) {
                                                                        setData(prev => {
                                                                            const newSections = { ...prev.sections };
                                                                            delete newSections[key];
                                                                            const newOrder = (prev.sectionOrder || []).filter(id => id !== key);
                                                                            return {
                                                                                ...prev,
                                                                                sections: newSections,
                                                                                sectionOrder: newOrder
                                                                            };
                                                                        });
                                                                    }
                                                                }}
                                                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete Section"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4">
                                                        <div>
                                                            <Label>Heading</Label>
                                                            <Input 
                                                                value={section.heading || ""} 
                                                                onChange={e => setData(prev => ({
                                                                    ...prev,
                                                                    sections: {
                                                                        ...prev.sections,
                                                                        [key]: { ...prev.sections[key], heading: e.target.value }
                                                                    }
                                                                }))} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Subtitle / Secondary Heading</Label>
                                                            <Input 
                                                                value={section.subtitle || ""} 
                                                                onChange={e => setData(prev => ({
                                                                    ...prev,
                                                                    sections: {
                                                                        ...prev.sections,
                                                                        [key]: { ...prev.sections[key], subtitle: e.target.value }
                                                                    }
                                                                }))} 
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Button Text (Optional)</Label>
                                                                <Input 
                                                                    value={section.buttonText || ""} 
                                                                    onChange={e => setData(prev => ({
                                                                        ...prev,
                                                                        sections: {
                                                                            ...prev.sections,
                                                                            [key]: { ...prev.sections[key], buttonText: e.target.value }
                                                                        }
                                                                    }))} 
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Button URL / Action (Optional)</Label>
                                                                <Input 
                                                                    value={section.buttonUrl || ""} 
                                                                    onChange={e => setData(prev => ({
                                                                        ...prev,
                                                                        sections: {
                                                                            ...prev.sections,
                                                                            [key]: { ...prev.sections[key], buttonUrl: e.target.value }
                                                                        }
                                                                    }))} 
                                                                    placeholder="/contact or https://..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="mb-2"><Label>Body Content</Label></div>
                                                            <RichTextEditor 
                                                                value={section.content || ""} 
                                                                onChange={val => setData(prev => ({
                                                                    ...prev,
                                                                    sections: {
                                                                        ...prev.sections,
                                                                        [key]: { ...prev.sections[key], content: val }
                                                                    }
                                                                }))} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            <MediaLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                multiSelect={true}
                onSelectMultiple={addMultiplePartnerImages}
            />

            <InsertSidebar
                isOpen={isInsertSidebarOpen}
                onClose={() => setIsInsertSidebarOpen(false)}
                reusableComponents={reusableComponents}
                onAddReusable={handleInsertReusableSection}
                onAddBlankSection={(title) => {
                    if (!data) return;
                    const id = title.trim().toLowerCase().replace(/\s+/g, "_");
                    setData({
                        ...data,
                        sections: {
                            ...(data.sections || {}),
                            [id]: {
                                heading: title,
                                content: "",
                                enabled: true
                            }
                        },
                        sectionOrder: [...(data.sectionOrder || ['directorMessage', 'partnerMessages', 'investInKmfw']), id]
                    });
                    setActiveTab('custom');
                    setIsInsertSidebarOpen(false);
                    setStatus({ type: 'success', msg: `Added blank section "${title}"!` });
                    setTimeout(() => setStatus(null), 3000);
                }}
            />

            {/* Tag as Reusable Modal */}
            <Modal isOpen={isTagModalOpen} onClose={() => setIsTagModalOpen(false)} className="max-w-md">
                <div className="p-6 bg-white rounded-xl dark:bg-gray-900">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                        <Pin size={18} className="text-blue-600" />
                        Tag Section as Reusable
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Give this component a descriptive label so you can easily identify it when adding it to other pages.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <Label>Component Label / Name</Label>
                            <Input
                                value={reusableLabel}
                                onChange={(e) => setReusableLabel(e.target.value)}
                                placeholder="e.g. Director Letter, Investment Inset"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={() => setIsTagModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTagAsReusable} disabled={!reusableLabel.trim()}>Tag Component</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
