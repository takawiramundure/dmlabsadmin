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
import { Eye, EyeOff, ChevronDown, ChevronUp, Trash2, Search, Pin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { SEED_DATA } from "@/config/seedData";
import SEOEditor from "@/components/form/SEOEditor";
import { useDialog } from "@/context/DialogContext";
import InsertSidebar from "@/components/common/InsertSidebar";
import { Modal } from "@/components/ui/modal";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface AboutSection extends SectionContent {
    enabled?: boolean;
}

interface AboutPageContent extends PageContent {
    sections: Record<string, AboutSection>;
    seo?: {
        title?: string;
        description?: string;
        image?: string;
    };
}

const getSectionsConfig = (siteId: string) => {
    if (siteId === 'kmfw') {
        return [
            { id: 'header', label: 'Header & Philosophy' },
            { id: 'strategicPlan', label: 'Strategic Plan Summary' },
            { id: 'coreValues', label: 'Core Values' }
        ];
    }
    if (siteId === 'dmlabs') {
        return [
            { id: 'hero', label: 'Hero Section' },
            { id: 'mission', label: 'Mission Section' },
            { id: 'approach', label: 'Approach Section' },
            { id: 'stats', label: 'Stats Section' },
            { id: 'values', label: 'Core Values Section' },
            { id: 'ai_for_good', label: 'AI For Good Section' },
            { id: 'team', label: 'Team Section' }
        ];
    }
    if (siteId === 'aitasol') {
        return [
            { id: 'hero', label: 'Hero Section' },
            { id: 'mission', label: 'Mission & Vision' },
            { id: 'values', label: 'Core Values' }
        ];
    }
    if (siteId === 'phcg') {
        return [
            { id: 'hero', label: 'Hero Section' },
            { id: 'journey', label: 'Our Journey Section' },
            { id: 'mission', label: 'Our Mission Section' },
            { id: 'vision', label: 'Our Vision Section' },
            { id: 'team', label: 'Expert Team Section' },
            { id: 'join', label: 'Join Our Team Section' }
        ];
    }
    if (siteId === 'bweic') {
        return [
            { id: 'hero', label: 'Hero Section' },
            { id: 'mission', label: 'Mission & Vision' },
            { id: 'values', label: 'Guiding Values' }
        ];
    }
    // Fallback general config
    return [
        { id: 'header', label: 'About Header' },
        { id: 'mission', label: 'Mission & Vision' }
    ];
};

const getDefaultContent = (siteId: string): Record<string, SectionContent> => {
    if (siteId === 'kmfw') {
        return {
            header: {
                heading: "A gentle hand reaching out when you need it most.",
                subtitle: "Our Philosophy",
                content: "<p>Kind Minds Family Wellness was born from a simple belief: that mental health support should be accessible, warm, and free of clinical coldness.</p><p>We're not just a health portal; we're a community of professionals and families working together to build resilient, healthy homes.</p>",
                enabled: true,
                images: [{ url: '/assets/illustrations/wellness.jpg', alt: 'Culturally grounded wellness' }],
                stats: [{ value: '10+ Years', label: 'Supporting families in our community with compassionate care.' }],
                items: [
                    { title: 'Human Centered', desc: 'We prioritize real connection over clinical labels.', icon: 'Sun' },
                    { title: 'Family Focused', desc: 'Support that encompasses the whole family unit.', icon: 'Heart' }
                ]
            },
            strategicPlan: {
                heading: "Our Strategic Plan",
                content: "<p>Our five-year roadmap focuses on scaling our impact while maintaining the deeply personal, culturally grounded care that defines Kind Minds. We are committed to expanding our evidence-based research and advocacy efforts to create systemic change.</p>",
                enabled: true,
                stats: [{ value: '5+ Years', label: 'Of dedicated service to our community and growing stronger every year.' }],
                items: [
                    { title: 'Expanding mental health services for Black families.', icon: 'Award' },
                    { title: 'Strengthening community advocacy and system navigation.', icon: 'Shield' },
                    { title: 'Building a larger repository of culturally-informed research.', icon: 'BookOpen' }
                ]
            },
            coreValues: {
                heading: "The Values We Live By",
                content: "",
                enabled: true,
                items: [
                    { title: 'Compassion', desc: 'Leading with empathy and understanding in every interaction.', icon: 'Heart' },
                    { title: 'Excellence', desc: 'Committed to the highest quality of care and professionalism.', icon: 'Award' },
                    { title: 'Advocacy', desc: 'Standing up for our community and navigating complex systems.', icon: 'Shield' },
                    { title: 'Community', desc: 'Growing together through shared experiences and support.', icon: 'Users' }
                ]
            }
        };
    }
    
    if (siteId === 'dmlabs') {
        return {
            hero: {
                heading: "About Us",
                content: "At Digital Maples Labs, we specialize in helping nonprofits amplify their impact through modern web development, powerful digital marketing, and smart software solutions. We believe even the smallest organizations can create big change with the right digital tools.",
                enabled: true
            },
            mission: {
                heading: "Our Mission",
                content: "At Digital Maples Labs Inc, we believe every nonprofit deserves the right technology to thrive—tech that’s not only smart but also ethical. Our mission is to bridge the gap between social impact and digital innovation by empowering organizations with custom websites, strategic tools, and responsible AI solutions.",
                enabled: true
            },
            approach: {
                heading: "Our Approach",
                content: "We help nonprofits grow online with custom websites, smart marketing strategies, and powerful software solutions that make an impact. But we don’t stop there—we also make sure your AI behaves responsibly.",
                enabled: true
            },
            values: {
                heading: "The principles that drive every pixel we build.",
                subtitle: "Our Core Values",
                enabled: true,
                items: [
                    { title: "Impact First", desc: "We measure our success by the success of your mission. Every line of code is written to amplify your social footprint.", icon: "🎯" },
                    { title: "Radical Excellence", desc: "Nonprofits shouldn't settle for 'good enough'. We bring enterprise-grade quality to every budget-driven project.", icon: "💎" },
                    { title: "Ethical Partnership", desc: "We don't just build for you; we build with you. Transparency and mission-alignment are at the heart of our work.", icon: "🤝" }
                ]
            },
            ai_for_good: {
                heading: "Responsible AI for Nonprofit Success",
                subtitle: "[ AI FOR GOOD ]",
                content: "AI is changing the world, but it must be handled with care. We help nonprofits implement AI responsibly—auditing for bias, ensuring mission alignment, and training teams to use these powerful tools ethically.",
                enabled: true,
                items: [
                    { text: "Ethical AI Audits & Governance" },
                    { text: "AI Policy Development for Nonprofits" },
                    { text: "Mission-Aligned Algorithm Design" },
                    { text: "Responsible AI Training & Workshops" }
                ],
                images: [{ url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2940&auto=format&fit=crop", alt: "Responsible AI" }]
            },
            stats: {
                list: [
                    { label: 'PROJECTS COMPLETED', value: '24+' },
                    { label: 'YEARS OF EXPERIENCE', value: '05+' },
                    { label: 'CLIENT SATISFACTION', value: '99%' }
                ],
                enabled: true
            },
            team: {
                heading: "Meet the Team",
                content: "Our diverse team of designers, engineers, and strategists are united by one mission: helping good organizations do more good in the world.",
                enabled: true
            }
        };
    }

    if (siteId === 'aitasol') {
        return {
            hero: {
                heading: "Your Partner in Global Education Excellence",
                subtitle: "Empowering Students Since 2014",
                content: "<p>Aitasol is a leading education consultancy dedicated to helping students achieve their dreams of international education.</p>",
                enabled: true,
                images: [{ url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1920&h=1080&fit=crop', alt: 'Education consultancy' }]
            },
            mission: {
                heading: "Our Mission & Vision",
                content: "<p>Our mission is to simplify the complex process of international university applications and visa processing.</p>",
                enabled: true
            },
            values: {
                heading: "The Values That Guide Us",
                subtitle: "Our Core Principles",
                enabled: true,
                items: [
                    { title: "Integrity", desc: "Honest guidance throughout the process.", icon: "ShieldCheck" },
                    { title: "Excellence", desc: "High success rates in admissions.", icon: "Award" }
                ]
            }
        };
    }
    if (siteId === 'phcg') {
        return {
            hero: {
                heading: "About Us",
                subtitle: "Dedicated to Excellence in Care",
                images: [{ url: "https://storage.googleapis.com/nspc-web.firebasestorage.app/phcg/senior_care_1.png", alt: "About Us" }],
                enabled: true
            },
            journey: {
                heading: "Our Journey",
                content: "<p>Home Care Guru Inc. was founded with a singular vision: to redefine senior care in Ontario. What started as a small team of passionate nurses has grown into a leading provider of holistic home care, serving hundreds of families with unwavering commitment.</p>",
                images: [{ url: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=1000", alt: "Our Journey" }],
                enabled: true
            },
            mission: {
                heading: "Our Mission",
                content: "<p>Our mission is to empower seniors to age with dignity and independence in the comfort of their own homes. We provide medical expertise combined with genuine human connection, ensuring that every patient feels seen, heard, and valued.</p>",
                images: [{ url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000", alt: "Our Mission" }],
                enabled: true
            },
            vision: {
                heading: "Our Vision",
                content: "<p>We envision a future where high-quality healthcare is accessible to every senior in their home. By integrating technology with personalized nursing, we aim to be the gold standard of home care services in Canada.</p>",
                images: [{ url: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=1000", alt: "Our Vision" }],
                enabled: true
            },
            team: {
                heading: "Our Expert Team",
                content: "<p>Our team consists of Registered Nurses (RNs), Registered Practical Nurses (RPNs), and Personal Support Workers (PSWs) who are fully vetted, insured, and committed to your well-being.</p>",
                images: [{ url: "https://storage.googleapis.com/nspc-web.firebasestorage.app/phcg/senior_care_3.png", alt: "Our Expert Team" }],
                enabled: true
            },
            join: {
                heading: "Join Home Care Guru Team",
                content: "<p>Become part of a mission-driven organization that values your skills and dedication.</p>",
                enabled: true
            }
        };
    }
    
    if (siteId === 'bweic') {
        return {
            hero: {
                heading: "About BWEIC",
                subtitle: "Empowering Black Women Across Canada",
                content: "<p>Creating pathways from survival to sovereignty through community care, trauma-informed spaces, and culturally grounded mentorship.</p>",
                enabled: true,
                images: [{ url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1920&h=1080&fit=crop&q=80", alt: "About BWEIC" }]
            },
            mission: {
                heading: "Mission & Vision",
                content: "<p><strong>Our Mission:</strong> To create safe, affirming spaces where Black women in Canada can heal, grow, and reclaim their power—emotionally, economically, and socially—through community, education, advocacy, and storytelling.</p><p><strong>Our Vision:</strong> A Canada where Black women are thriving, supported, and leading with confidence, dignity, and shared purpose.</p>",
                enabled: true
            },
            values: {
                heading: "Guiding Principles",
                content: "<p>Safety before visibility, healing is power, community over competition, access over perfection, and lived experience matters.</p>",
                enabled: true
            }
        };
    }
    
    // Default general fallback
    return {
        header: {
            heading: "About Us",
            content: "<p>Welcome to our organization.</p>",
            enabled: true
        },
        mission: {
            heading: "Our Mission",
            content: "<p>Our mission is to create lasting positive impact.</p>",
            enabled: true
        }
    };
};

export default function AboutPageManager() {
    const { currentSite } = useSite();
    const searchParams = useSearchParams();
    const slug = searchParams.get('slug') || 'about';
    const [content, setContent] = useState<AboutPageContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const { confirm } = useDialog();

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
        if (!tagReusableSectionId || !content) return;
        const currentSection = content.sections?.[tagReusableSectionId];
        if (!currentSection) return;

        try {
            await FirestoreService.saveReusableSection(currentSite.id, tagReusableSectionId, {
                ...currentSection,
                reusableLabel: reusableLabel || tagReusableSectionId
            });
            setSuccessMsg(`Section "${reusableLabel || tagReusableSectionId}" tagged as reusable!`);
            setIsTagModalOpen(false);
            setTagReusableSectionId(null);
            setTimeout(() => setSuccessMsg(""), 3000);
            await loadReusableComponents();
        } catch (e) {
            console.error("Error saving reusable section:", e);
            setError("Failed to tag section as reusable.");
        }
    };

    const handleInsertReusableSection = (reusableSec: any) => {
        if (!content) return;
        const newId = `${reusableSec.id.split('_')[0] || 'reusable'}_${Date.now()}`;
        const clonedData = { ...reusableSec };
        delete clonedData.reusableLabel;
        delete clonedData.lastUpdated;

        setContent({
            ...content,
            sections: {
                ...(content.sections || {}),
                [newId]: clonedData
            }
        });
        setIsInsertSidebarOpen(false);
        setSuccessMsg(`Added reusable component "${reusableSec.reusableLabel || reusableSec.heading || reusableSec.id}"! Remember to save changes.`);
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const sectionsConfig = getSectionsConfig(currentSite.id);
    const defaultContentForSite = getDefaultContent(currentSite.id);

    const activeSectionsConfig = [...sectionsConfig];
    if (content?.sections) {
        Object.keys(content.sections).forEach(key => {
            if (!activeSectionsConfig.some(s => s.id === key)) {
                activeSectionsConfig.push({ id: key, label: content.sections[key]?.heading || key });
            }
        });
    }

    useEffect(() => {
        loadContent();
        loadReusableComponents();
    }, [currentSite]);

    const loadContent = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await FirestoreService.getPageContent(slug, currentSite.id);
            const mergedSections: Record<string, AboutSection> = {};

            Object.keys(defaultContentForSite).forEach(key => {
                mergedSections[key] = { ...defaultContentForSite[key] };
            });

            if (data && data.sections) {
                const sections = data.sections;
                Object.keys(sections).forEach(key => {
                    if (mergedSections[key]) {
                        mergedSections[key] = { ...mergedSections[key], ...sections[key] };
                    } else {
                        mergedSections[key] = sections[key];
                    }
                });
                setContent({ ...data, sections: mergedSections } as AboutPageContent);
            } else {
                const initialSections: Record<string, AboutSection> = {};
                sectionsConfig.forEach(sec => {
                    initialSections[sec.id] = {
                        enabled: true,
                        ...(defaultContentForSite[sec.id] || { heading: sec.label, content: "" })
                    };
                });
                setContent({ title: "About Page", sections: initialSections });
            }
        } catch (err: any) {
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
            await FirestoreService.savePageContent(slug, content, currentSite.id);
            setSuccessMsg("About page settings saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            console.error(err);
            setError("Failed to save content.");
        } finally {
            setSaving(false);
        }
    };

    const handleSeedData = async () => {
        const isConfirmed = await confirm({
            title: "Seed About Page",
            message: `Are you sure you want to initialize the "${currentSite.name}" About Page with professional seed data? This will overwrite your current settings.`,
            variant: "warning",
            confirmLabel: "Seed Data"
        });

        if (!isConfirmed) return;
        setSaving(true);
        try {
            const seed = (SEED_DATA as any)[currentSite.id]?.about;
            if (!seed) {
                throw new Error("No seed data found for this site's about page.");
            }
            await FirestoreService.savePageContent("about", seed, currentSite.id);
            setContent(seed);
            setSuccessMsg("🌱 Seeded about page defaults successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to seed data: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const handleSectionChange = (sectionId: string, field: keyof AboutSection, value: any) => {
        if (!content) return;
        setContent({
            ...content,
            sections: {
                ...content.sections,
                [sectionId]: {
                    ...content.sections[sectionId],
                    [field]: value
                }
            }
        });
    };

    const updateItem = (sectionId: string, idx: number, field: string, value: string) => {
        if (!content) return;
        const newItems = [...(content.sections[sectionId].items || [])];
        newItems[idx] = { ...newItems[idx], [field]: value };
        handleSectionChange(sectionId, "items", newItems);
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const handleSEOChange = (seoData: any) => {
        if (!content) return;
        setContent({
            ...content,
            seo: seoData
        });
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <PageMeta
                title={`About Page Manager - ${currentSite.name} | Admin Portal`}
                description="Manage About Page sections and content"
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            {slug === 'about' ? 'About Page Manager' : `Editing Page: ${slug}`}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Manage content for the {currentSite.name} {slug} page.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <VersionHistoryManager documentId="about" siteId={currentSite.id} />
                        <Button requireSuperAdmin variant="outline" onClick={handleSeedData} disabled={saving} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300">
                            🌱 Seed Default Data
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsInsertSidebarOpen(true)}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 animate-pulse hover:animate-none"
                        >
                            + Add Component / Section
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                {/* SEO Settings Section */}
                <div className="mb-8 p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Search size={20} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Search Engine Optimization</h3>
                    </div>
                    <SEOEditor 
                        data={content?.seo || {}} 
                        onChange={handleSEOChange}
                    />
                </div>

                <div className="space-y-4">
                    {activeSectionsConfig.map((config) => {
                        const section = content?.sections[config.id] || { heading: config.label, content: "", enabled: true };
                        const isExpanded = expandedSections[config.id];

                        return (
                            <div key={config.id} className={`border rounded-lg transition-all duration-200 ${section.enabled ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02]' : 'border-gray-200 bg-gray-100 opacity-75 dark:bg-gray-900'}`}>
                                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleSection(config.id)}>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSectionChange(config.id, 'enabled', !section.enabled);
                                            }}
                                            className={`p-1.5 rounded-md transition-colors ${section.enabled ? 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-200 dark:text-gray-500'}`}
                                        >
                                            {section.enabled ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleTagAsReusableClick(config.id, section); }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            title="Tag as Reusable"
                                        >
                                            <Pin size={18} />
                                        </button>
                                        {!sectionsConfig.some(s => s.id === config.id) && (
                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const isConfirmed = await confirm({
                                                        title: "Remove Section",
                                                        message: `Are you sure you want to remove the custom section "${config.label}"?`,
                                                        variant: "danger",
                                                        confirmLabel: "Delete"
                                                    });
                                                    if (isConfirmed && content) {
                                                        const newSections = { ...content.sections };
                                                        delete newSections[config.id];
                                                        setContent({
                                                            ...content,
                                                            sections: newSections
                                                        });
                                                    }
                                                }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete Custom Section"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <h3 className={`font-medium ${section.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                                            {config.label}
                                        </h3>
                                    </div>
                                    <div className="text-gray-400">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700 mt-2">
                                        <div className="grid gap-5">
                                            <div>
                                                <Label>Heading</Label>
                                                <Input
                                                    type="text"
                                                    value={section.heading || ""}
                                                    onChange={(e) => handleSectionChange(config.id, "heading", e.target.value)}
                                                />
                                            </div>

                                            {(!sectionsConfig.some(s => s.id === config.id) || ['header', 'hero', 'values'].includes(config.id)) && (
                                                <div>
                                                    <Label>Subtitle / Secondary Heading</Label>
                                                    <Input
                                                        type="text"
                                                        value={section.subtitle || ""}
                                                        onChange={(e) => handleSectionChange(config.id, "subtitle", e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            {!sectionsConfig.some(s => s.id === config.id) && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Button Text (Optional)</Label>
                                                        <Input
                                                            type="text"
                                                            value={section.buttonText || ""}
                                                            onChange={(e) => handleSectionChange(config.id, "buttonText", e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Button URL / Action (Optional)</Label>
                                                        <Input
                                                            type="text"
                                                            value={section.buttonUrl || ""}
                                                            onChange={(e) => handleSectionChange(config.id, "buttonUrl", e.target.value)}
                                                            placeholder="/contact or https://..."
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(!sectionsConfig.some(s => s.id === config.id) || ['header', 'strategicPlan', 'mission', 'approach', 'hero', 'team', 'values', 'ai_for_good'].includes(config.id)) && (
                                                <div>
                                                    <div className="mb-2"><Label>Body Content</Label></div>
                                                    <RichTextEditor
                                                        label=""
                                                        value={section.content || ""}
                                                        onChange={(newContent: string) => handleSectionChange(config.id, "content", newContent)}
                                                    />
                                                </div>
                                            )}

                                            {/* Generic Array Items */}
                                            {['header', 'strategicPlan', 'coreValues', 'values'].includes(config.id) && (
                                                <div className="mt-4">
                                                    <Label>List Items</Label>
                                                    <div className="space-y-3">
                                                        {(section.items || []).map((item: any, idx: number) => (
                                                            <div key={idx} className="flex flex-col gap-3 bg-white p-4 border rounded shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="font-bold text-sm text-gray-500">Item {idx + 1}</span>
                                                                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => {
                                                                        const newItems = [...(section.items || [])];
                                                                        newItems.splice(idx, 1);
                                                                        handleSectionChange(config.id, "items", newItems);
                                                                    }}>Remove</Button>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div><Label>Title/Icon Label</Label><Input value={item.title || ''} onChange={(e) => updateItem(config.id, idx, 'title', e.target.value)} /></div>
                                                                    <div><Label>Icon/Emoji (e.g. 🎯)</Label><Input value={item.icon || ''} onChange={(e) => updateItem(config.id, idx, 'icon', e.target.value)} /></div>
                                                                    {config.id !== 'strategicPlan' && <div className="col-span-2"><Label>Description</Label><Input value={item.desc || ''} onChange={(e) => updateItem(config.id, idx, 'desc', e.target.value)} /></div>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            const newItems = [...(section.items || []), {}];
                                                            handleSectionChange(config.id, "items", newItems);
                                                        }}>+ Add Item</Button>
                                                    </div>
                                                </div>
                                            )}

                                            {config.id === 'ai_for_good' && (
                                                <div className="mt-4">
                                                    <Label>Feature Points</Label>
                                                    <div className="space-y-3">
                                                        {(section.items || []).map((item: any, idx: number) => (
                                                            <div key={idx} className="flex gap-4 items-center bg-white p-3 border rounded shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                                                <div className="flex-1">
                                                                    <Input 
                                                                        value={item.text} 
                                                                        onChange={(e) => updateItem(config.id, idx, 'text', e.target.value)} 
                                                                        placeholder="Point text"
                                                                    />
                                                                </div>
                                                                <Button variant="outline" size="sm" className="text-red-500" onClick={() => {
                                                                    const newItems = [...(section.items || [])];
                                                                    newItems.splice(idx, 1);
                                                                    handleSectionChange(config.id, "items", newItems);
                                                                }}>Remove</Button>
                                                            </div>
                                                        ))}
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            const newItems = [...(section.items || []), { text: "" }];
                                                            handleSectionChange(config.id, "items", newItems);
                                                        }}>+ Add Point</Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Feature Images */}
                                            {(config.id === 'header' || config.id === 'ai_for_good' || config.id === 'hero') && (
                                                <div className="mt-4">
                                                    <ImagePicker
                                                        label="Main Feature Image / Hero Image"
                                                        value={section.images?.[0]?.url || section.imageUrl || ""}
                                                        onChange={(url) => {
                                                            const newImages = [...(section.images || [])];
                                                            if (!newImages[0]) newImages[0] = { url: "", alt: "" };
                                                            newImages[0].url = url;
                                                            // Also update imageUrl for backward compatibility/different field names
                                                            handleSectionChange(config.id, "images", newImages);
                                                            handleSectionChange(config.id, "imageUrl", url);
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Emphasized Stats / Badges (Legacy/Header) */}
                                            {['header', 'strategicPlan'].includes(config.id) && (
                                                <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                                                    <h4 className="font-bold mb-3 text-sm text-gray-700 dark:text-gray-300">Feature Badge / Statistic</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Highlight Value (e.g. "10+ Years")</Label>
                                                            <Input 
                                                                value={section.stats?.[0]?.value || ""} 
                                                                onChange={(e) => {
                                                                    const newStats = [...(section.stats || [])];
                                                                    if (!newStats[0]) newStats[0] = { value: "", label: "" };
                                                                    newStats[0].value = e.target.value;
                                                                    handleSectionChange(config.id, "stats", newStats);
                                                                }} 
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Label Description</Label>
                                                            <Input 
                                                                value={section.stats?.[0]?.label || ""} 
                                                                onChange={(e) => {
                                                                    const newStats = [...(section.stats || [])];
                                                                    if (!newStats[0]) newStats[0] = { value: "", label: "" };
                                                                    newStats[0].label = e.target.value;
                                                                    handleSectionChange(config.id, "stats", newStats);
                                                                }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Specialized Stats List for DMLabs */}
                                            {config.id === 'stats' && currentSite.id === 'dmlabs' && (
                                                <div className="mt-4 space-y-4">
                                                    <Label>Impact Metrics List</Label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {(section.list || []).map((item: any, idx: number) => (
                                                            <div key={idx} className="bg-white dark:bg-gray-900/50 p-4 border rounded-lg space-y-3 relative">
                                                                <button 
                                                                    className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                                    onClick={() => {
                                                                        const newList = [...(section.list || [])];
                                                                        newList.splice(idx, 1);
                                                                        handleSectionChange(config.id, "list", newList);
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                                <div>
                                                                    <Label className="text-xs mb-1">Value (e.g. 50+)</Label>
                                                                    <Input value={item.value || ''} onChange={(e) => {
                                                                        const newList = [...(section.list || [])];
                                                                        newList[idx] = { ...newList[idx], value: e.target.value };
                                                                        handleSectionChange(config.id, "list", newList);
                                                                    }} />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs mb-1">Label (e.g. Projects Done)</Label>
                                                                    <Input value={item.label || ''} onChange={(e) => {
                                                                        const newList = [...(section.list || [])];
                                                                        newList[idx] = { ...newList[idx], label: e.target.value };
                                                                        handleSectionChange(config.id, "list", newList);
                                                                    }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => {
                                                        const newList = [...(section.list || []), { value: '', label: '' }];
                                                        handleSectionChange(config.id, "list", newList);
                                                    }}>+ Add Impact Metric</Button>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <InsertSidebar
                isOpen={isInsertSidebarOpen}
                onClose={() => setIsInsertSidebarOpen(false)}
                reusableComponents={reusableComponents}
                onAddReusable={handleInsertReusableSection}
                onAddBlankSection={(title) => {
                    if (!content) return;
                    const id = title.trim().toLowerCase().replace(/\s+/g, "_");
                    setContent({
                        ...content,
                        sections: {
                            ...(content.sections || {}),
                            [id]: {
                                heading: title,
                                content: "",
                                enabled: true
                            }
                        }
                    });
                    setIsInsertSidebarOpen(false);
                    setSuccessMsg(`Added blank section "${title}"!`);
                    setTimeout(() => setSuccessMsg(""), 3000);
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
                                placeholder="e.g. History Summary, Philosophy Inset"
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
