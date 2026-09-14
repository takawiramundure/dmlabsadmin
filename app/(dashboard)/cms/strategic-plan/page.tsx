"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import ImagePicker from "@/components/form/ImagePicker";
import { Eye, EyeOff, Plus, Trash2, ChevronDown, ChevronUp, Search, Pin } from 'lucide-react';
import { FilePicker } from "@/components/form/FilePicker";
import SEOEditor from "@/components/form/SEOEditor";
import { Modal } from "@/components/ui/modal";
import { useDialog } from "@/context/DialogContext";
import InsertSidebar from "@/components/common/InsertSidebar";
import RichTextEditor from "@/components/form/RichTextEditor";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

const DEFAULT_DATA = {
    enabled: true,
    hero: {
        title: "Strategic Plan",
        subtitle: "Our Roadmap",
        description: "Visionary goals for a more equitable community."
    },
    roadmap: {
        title: "Our Roadmap",
        intro: [
            "As a Black-led, Black-serving, and Black-mandated organization, we have meticulously crafted a two-year strategic plan to define our vision, mission, and objectives in alignment with our unwavering commitment to addressing the distinctive needs and aspirations of the Black communities in our Region.",
            "This strategic blueprint functions as a comprehensive roadmap, delineating essential initiatives, resource allocations, and timelines to ensure the effective realization of our goals.",
            "In essence, this plan stands as a pivotal communication and alignment instrument, underscoring KMFW's steadfast dedication to advancing the well-being and prosperity of the Black population we serve."
        ],
        pillars: [
            {
                icon: 'Target',
                color: 'bg-primary/10 text-primary',
                title: 'Define Vision & Mission',
                desc: 'Articulate a clear, Black-centered vision and mission that reflects the distinctive needs and aspirations of the Black communities in our Region.'
            },
            {
                icon: 'Eye',
                color: 'bg-highlight/10 text-highlight',
                title: 'Transparency & Trust',
                desc: 'By openly sharing our plan with stakeholders, members of the Black communities, supporters, and partners, KMFW cultivates transparency and fosters trust.'
            },
            {
                icon: 'CheckCircle',
                color: 'bg-accent/10 text-accent',
                title: 'Accountability Framework',
                desc: 'The strategic plan serves as a tool for accountability, safeguarding our unwavering focus on our mission and ensuring meaningful progress.'
            }
        ]
    },
    flyer: {
        enabled: true,
        image: "/assets/strategic-plan-flyer.png",
        alt: "KMFW 2024-2026 Strategic Plan Flyer"
    },
    downloads: {
        pdf: {
            title: "Detailed Strategic Plan",
            description: "We encourage you to explore the full details of our strategic plan. Feel free to reach out if you have any questions — your engagement and feedback are valuable to us.",
            link: "https://www.kindmindsfamilywellness.org/s/KMFW-Strategic-Plan-Booklet-2024-2026.pdf"
        },
        contact: {
            title: "Have Questions?",
            description: "If you have any questions about our strategic plan, feel free to reach out. We are here to answer any questions and provide more information. Your thoughts and input are important to us.",
            email: "info@kindmindsfamilywellness.org"
        }
    }
};

const STRATEGIC_PLAN_SECTIONS = [
    { id: 'hero', label: 'Hero Section' },
    { id: 'roadmap', label: 'Roadmap Section' },
    { id: 'flyer', label: 'Strategic Plan Flyer (Full-Width Image)' },
    { id: 'downloads', label: 'Downloads & Contact Cards' }
];

export default function StrategicPlanManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ hero: true, roadmap: true, flyer: false, downloads: false });

    // Reusable tag modal states
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [tagReusableSectionId, setTagReusableSectionId] = useState<string | null>(null);
    const [reusableLabel, setReusableLabel] = useState("");
    const [isInsertSidebarOpen, setIsInsertSidebarOpen] = useState(false);
    const [reusableComponents, setReusableComponents] = useState<any[]>([]);

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
        setReusableLabel(currentSection.heading || currentSection.title || sectionId);
        setIsTagModalOpen(true);
    };

    const handleSaveTagAsReusable = async () => {
        if (!tagReusableSectionId || !content) return;
        const currentSection = content[tagReusableSectionId];
        if (!currentSection) return;

        try {
            await FirestoreService.saveReusableSection(currentSite.id, tagReusableSectionId, {
                ...currentSection,
                reusableLabel: reusableLabel || tagReusableSectionId
            });
            setSuccessMsg(`Section "${reusableLabel || tagReusableSectionId}" tagged as reusable!`);
            setTimeout(() => setSuccessMsg(""), 3000);
            setIsTagModalOpen(false);
        } catch (e: any) {
            console.error("Error tagging section as reusable:", e);
            setError(`Failed to save reusable section: ${e.message}`);
        }
    };

    const handleInsertReusableSection = (reusableSec: any) => {
        if (!content) return;
        const newId = `${reusableSec.id.split('_')[0] || 'reusable'}_${Date.now()}`;
        const clonedData = { ...reusableSec };
        delete clonedData.reusableLabel;
        delete clonedData.lastUpdated;
        
        const newOrder = [...(content.sectionOrder || STRATEGIC_PLAN_SECTIONS.map(s => s.id))];
        newOrder.push(newId);

        setContent({
            ...content,
            [newId]: clonedData,
            sectionOrder: newOrder
        });
        setIsInsertSidebarOpen(false);
        setSuccessMsg(`Added reusable component "${reusableSec.reusableLabel || reusableSec.heading || reusableSec.id}"! Remember to save changes.`);
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        if (!content) return;
        const currentOrder = content.sectionOrder || STRATEGIC_PLAN_SECTIONS.map(s => s.id);
        const newOrder = [...currentOrder];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= newOrder.length) return;
        [newOrder[index], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[index]];
        set(['sectionOrder'], newOrder);
    };

    const currentOrder = content?.sectionOrder || STRATEGIC_PLAN_SECTIONS.map(s => s.id);
    const fullOrder = [...currentOrder];
    STRATEGIC_PLAN_SECTIONS.forEach(s => {
        if (!fullOrder.includes(s.id)) {
            fullOrder.push(s.id);
        }
    });
    if (content) {
        Object.keys(content).forEach(key => {
            if (key !== 'title' && key !== 'seo' && key !== 'id' && key !== 'sections' && key !== 'enabled' && key !== 'sectionOrder' && !fullOrder.includes(key)) {
                fullOrder.push(key);
            }
        });
    }
    const sortedSections = fullOrder
        .map(id => STRATEGIC_PLAN_SECTIONS.find(s => s.id === id) || { id, label: content?.[id]?.heading || content?.[id]?.title || id })
        .filter(Boolean);

    useEffect(() => { 
        loadContent(); 
        loadReusableComponents();
    }, [currentSite?.id]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getPageContent('strategic-plan', currentSite.id);
            setContent(data || DEFAULT_DATA);
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
        setSuccessMsg(""); setError("");
        try {
            await FirestoreService.savePageContent('strategic-plan', content, currentSite.id);
            setSuccessMsg("Strategic Plan saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            console.error(err);
            setError("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const set = (path: string[], value: any) => {
        setContent((prev: any) => {
            const next = JSON.parse(JSON.stringify(prev)); // deep clone
            let node = next;
            for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
            node[path[path.length - 1]] = value;
            return next;
        });
    };

    const handleSEOChange = (seoData: any) => {
        if (!content) return;
        setContent((prev: any) => ({
            ...prev,
            seo: seoData
        }));
    };

    const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <>
            <PageMeta title="Strategic Plan Manager | Admin Portal" description="Manage the strategic plan page content" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Strategic Plan Manager</h2>
                        <p className="text-sm text-gray-500">Manage the KMFW Strategic Plan page content and visibility.</p>
                    </div>
                    <div className="flex gap-3">
                        <VersionHistoryManager documentId="strategic-plan" siteId={currentSite.id} />
                        <Button 
                            variant="outline" 
                            onClick={async () => { 
                                const isConfirmed = await confirm({
                                    title: "Reset Defaults",
                                    message: "Are you sure you want to reset to defaults? This will overwrite your current changes and cannot be undone.",
                                    variant: "warning",
                                    confirmLabel: "Reset Data"
                                });
                                if (isConfirmed) setContent(DEFAULT_DATA); 
                            }}
                        >
                            Reset Defaults & Seed
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
                {successMsg && <div className="mb-4"><Alert variant="success" title="Saved!" message={successMsg} /></div>}

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
                    {/* Page Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-lg ${content.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                {content.enabled ? <Eye size={20} /> : <EyeOff size={20} />}
                            </span>
                            <div>
                                <h3 className="font-bold text-gray-800">Page Visibility</h3>
                                <p className="text-xs text-gray-500">{content.enabled ? 'Visible to public' : 'Hidden from public'}</p>
                            </div>
                        </div>
                        <button onClick={() => set(['enabled'], !content.enabled)} className={`w-12 h-6 rounded-full transition-colors relative ${content.enabled ? 'bg-primary' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${content.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {sortedSections.map((config, index) => (
                        <React.Fragment key={config.id}>
                            {config.id === 'hero' && (
                                <Section id="hero" title="Hero Section" expanded={expanded.hero} onToggle={toggle} index={index} total={sortedSections.length} onMove={moveSection} onTagReusable={() => handleTagAsReusableClick('hero', content.hero)}>
                                    <div className="grid gap-4">
                                        <div><Label>Subtitle (Tagline)</Label><Input value={content.hero.subtitle} onChange={e => set(['hero', 'subtitle'], e.target.value)} /></div>
                                        <div><Label>Main Title</Label><Input value={content.hero.title} onChange={e => set(['hero', 'title'], e.target.value)} /></div>
                                        <div><Label>Description</Label><textarea className="w-full px-4 py-2 border rounded-xl" rows={2} value={content.hero.description} onChange={e => set(['hero', 'description'], e.target.value)} /></div>
                                    </div>
                                </Section>
                            )}

                            {config.id === 'roadmap' && (
                                <Section id="roadmap" title="Roadmap Section" expanded={expanded.roadmap} onToggle={toggle} index={index} total={sortedSections.length} onMove={moveSection} onTagReusable={() => handleTagAsReusableClick('roadmap', content.roadmap)}>
                                    <div className="space-y-6">
                                        <div><Label>Section Title</Label><Input value={content.roadmap.title} onChange={e => set(['roadmap', 'title'], e.target.value)} /></div>

                                        <div>
                                            <Label>Intro Paragraphs</Label>
                                            <div className="space-y-2">
                                                {content.roadmap.intro.map((para: string, i: number) => (
                                                    <div key={i} className="flex gap-2 items-start">
                                                        <textarea
                                                            className="w-full px-4 py-2 border rounded-xl text-sm"
                                                            rows={3}
                                                            value={para}
                                                            onChange={e => {
                                                                const newIntro = [...content.roadmap.intro];
                                                                newIntro[i] = e.target.value;
                                                                set(['roadmap', 'intro'], newIntro);
                                                            }}
                                                        />
                                                        <button onClick={() => {
                                                            const newIntro = content.roadmap.intro.filter((_: any, idx: number) => idx !== i);
                                                            set(['roadmap', 'intro'], newIntro);
                                                        }} className="text-red-400 hover:text-red-600 mt-1 flex-shrink-0"><Trash2 size={16} /></button>
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={() => set(['roadmap', 'intro'], [...content.roadmap.intro, ''])}>
                                                    <Plus size={14} className="mr-1" /> Add Paragraph
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Strategic Pillars</Label>
                                            <div className="space-y-4 mt-2">
                                                {content.roadmap.pillars.map((pillar: any, i: number) => (
                                                    <div key={i} className="p-4 border rounded-xl bg-gray-50/50">
                                                        <div className="flex justify-between mb-3">
                                                            <span className="text-xs font-bold uppercase text-gray-400">Pillar {i + 1}</span>
                                                            <button onClick={() => {
                                                                const p = content.roadmap.pillars.filter((_: any, idx: number) => idx !== i);
                                                                set(['roadmap', 'pillars'], p);
                                                            }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                                        </div>
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            <div><Label>Title</Label><Input value={pillar.title} onChange={e => {
                                                                const p = [...content.roadmap.pillars];
                                                                p[i] = { ...p[i], title: e.target.value };
                                                                set(['roadmap', 'pillars'], p);
                                                            }} /></div>
                                                            <div><Label>Icon (e.g. Target, Eye, CheckCircle)</Label><Input value={pillar.icon} onChange={e => {
                                                                const p = [...content.roadmap.pillars];
                                                                p[i] = { ...p[i], icon: e.target.value };
                                                                set(['roadmap', 'pillars'], p);
                                                            }} /></div>
                                                            <div className="md:col-span-2"><Label>Description</Label><textarea className="w-full px-4 py-2 border rounded-xl text-sm" rows={3} value={pillar.desc} onChange={e => {
                                                                const p = [...content.roadmap.pillars];
                                                                p[i] = { ...p[i], desc: e.target.value };
                                                                set(['roadmap', 'pillars'], p);
                                                            }} /></div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={() => set(['roadmap', 'pillars'], [...content.roadmap.pillars, { icon: 'Star', color: 'bg-primary/10 text-primary', title: '', desc: '' }])}>
                                                    <Plus size={14} className="mr-1" /> Add Pillar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {config.id === 'flyer' && (
                                <Section
                                    id="flyer"
                                    title="Strategic Plan Flyer (Full-Width Image)"
                                    expanded={expanded.flyer}
                                    onToggle={toggle}
                                    index={index}
                                    total={sortedSections.length}
                                    onMove={moveSection}
                                    onTagReusable={() => handleTagAsReusableClick('flyer', content.flyer)}
                                    action={
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <span className="text-[10px] font-bold uppercase text-gray-400">{content.flyer.enabled ? 'Shown' : 'Hidden'}</span>
                                            <button onClick={() => set(['flyer', 'enabled'], !content.flyer.enabled)} className={`w-8 h-4 rounded-full relative transition-colors ${content.flyer.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${content.flyer.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    }
                                >
                                    <div className="grid gap-4">
                                        <ImagePicker label="Flyer Image" value={content.flyer.image} onChange={url => set(['flyer', 'image'], url)} />
                                        <div><Label>Alt Text</Label><Input value={content.flyer.alt} onChange={e => set(['flyer', 'alt'], e.target.value)} /></div>
                                        {content.flyer.image && (
                                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                                <img src={content.flyer.image} alt={content.flyer.alt} className="w-full object-cover max-h-64" />
                                            </div>
                                        )}
                                    </div>
                                </Section>
                            )}

                            {config.id === 'downloads' && (
                                <Section id="downloads" title="Downloads & Contact Cards" expanded={expanded.downloads} onToggle={toggle} index={index} total={sortedSections.length} onMove={moveSection} onTagReusable={() => handleTagAsReusableClick('downloads', content.downloads)}>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                                            <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">PDF Download Card</h4>
                                            <div><Label>Title</Label><Input value={content.downloads.pdf.title} onChange={e => set(['downloads', 'pdf', 'title'], e.target.value)} /></div>
                                            <div><Label>Description</Label><textarea className="w-full px-4 py-2 border rounded-xl text-sm" rows={3} value={content.downloads.pdf.description} onChange={e => set(['downloads', 'pdf', 'description'], e.target.value)} /></div>
                                            <FilePicker
                                                 label="PDF Document"
                                                 value={content.downloads.pdf.link}
                                                 onChange={url => set(['downloads', 'pdf', 'link'], url)}
                                                 placeholder="Paste a URL or browse the media library"
                                                 description="Upload a PDF to the media library, or paste an external link."
                                             />
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                                            <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Contact Card</h4>
                                            <div><Label>Title</Label><Input value={content.downloads.contact.title} onChange={e => set(['downloads', 'contact', 'title'], e.target.value)} /></div>
                                            <div><Label>Description</Label><textarea className="w-full px-4 py-2 border rounded-xl text-sm" rows={3} value={content.downloads.contact.description} onChange={e => set(['downloads', 'contact', 'description'], e.target.value)} /></div>
                                            <div><Label>Email</Label><Input value={content.downloads.contact.email} onChange={e => set(['downloads', 'contact', 'email'], e.target.value)} /></div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {!STRATEGIC_PLAN_SECTIONS.some(s => s.id === config.id) && (
                                <Section 
                                    id={config.id} 
                                    title={config.label || config.id} 
                                    expanded={expanded[config.id]} 
                                    onToggle={toggle} 
                                    index={index} 
                                    total={sortedSections.length} 
                                    onMove={moveSection} 
                                    onTagReusable={() => handleTagAsReusableClick(config.id, content[config.id])}
                                    onDelete={async () => {
                                        const isConfirmed = await confirm({
                                            title: "Remove Section",
                                            message: `Are you sure you want to remove the custom section "${config.label || config.id}"?`,
                                            variant: "danger",
                                            confirmLabel: "Delete"
                                        });
                                        if (isConfirmed) {
                                            const newContent = { ...content };
                                            delete newContent[config.id];
                                            const newOrder = (content.sectionOrder || []).filter((id: string) => id !== config.id);
                                            newContent.sectionOrder = newOrder;
                                            setContent(newContent);
                                        }
                                    }}
                                >
                                    <div className="grid gap-4">
                                        <div><Label>Heading</Label><Input value={content[config.id]?.heading || ""} onChange={e => set([config.id, 'heading'], e.target.value)} /></div>
                                        <div><Label>Subtitle / Secondary Heading</Label><Input value={content[config.id]?.subtitle || ""} onChange={e => set([config.id, 'subtitle'], e.target.value)} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Button Text (Optional)</Label><Input value={content[config.id]?.buttonText || ""} onChange={e => set([config.id, 'buttonText'], e.target.value)} /></div>
                                            <div><Label>Button URL / Action (Optional)</Label><Input value={content[config.id]?.buttonUrl || ""} onChange={e => set([config.id, 'buttonUrl'], e.target.value)} placeholder="/contact or https://..." /></div>
                                        </div>
                                        <div>
                                            <div className="mb-2"><Label>Body Content</Label></div>
                                            <RichTextEditor label="" value={content[config.id]?.content || ""} onChange={val => set([config.id, 'content'], val)} />
                                        </div>
                                    </div>
                                </Section>
                            )}
                        </React.Fragment>
                    ))}
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
                    const newOrder = [...(content.sectionOrder || STRATEGIC_PLAN_SECTIONS.map(s => s.id))];
                    newOrder.push(id);
                    setContent({
                        ...content,
                        [id]: {
                            heading: title,
                            content: "",
                            enabled: true
                        },
                        sectionOrder: newOrder
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
                                placeholder="e.g. Strategic Plan Road Map, Hero Carousel"
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

function Section({ id, title, expanded, onToggle, action, children, index, total, onMove, onTagReusable, onDelete }: any) {
    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => onToggle(id)}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {onMove && (
                            <>
                                <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => onMove(index, 'up')}
                                    className="p-1 hover:text-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-colors text-gray-400 hover:text-gray-700"
                                    title="Move Up"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <button
                                    type="button"
                                    disabled={index === total - 1}
                                    onClick={() => onMove(index, 'down')}
                                    className="p-1 hover:text-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-colors text-gray-400 hover:text-gray-700"
                                    title="Move Down"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </>
                        )}
                        {onTagReusable && (
                            <button
                                type="button"
                                onClick={onTagReusable}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Tag as Reusable"
                            >
                                <Pin size={16} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Delete Custom Section"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    <h3 className="font-bold text-gray-700 dark:text-white">{title}</h3>
                    {action}
                </div>
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expanded && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-800">{children}</div>
            )}
        </div>
    );
}
