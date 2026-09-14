"use client";

import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import MediaLibrary from "@/components/common/MediaLibrary";
import { useDialog } from "@/context/DialogContext";
import {
    PencilIcon,
    TrashBinIcon,
    PlusIcon,
} from "@/icons";
import { ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, Video, Mail, Globe, Layers } from "lucide-react";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";
import { SEED_DATA } from "@/config/seedData";

interface Partner {
    id: string;
    name: string;
    type: string;
    description: string;
    website: string;
    logo: string;
    services: string[];
    published: boolean;
    order: number;
}

export default function PartnerManager() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isSeeding, setIsSeeding] = useState(false);

    // Dynamic Full Page Configuration (Hero, Video/Story, CTA, Inquiries, SEO)
    const [pageConfig, setPageConfig] = useState<any>({
        hero: { subtitle: "Media Center", heading: "Our Partners", content: "", videoUrl: "", enabled: true },
        video: { heading: "Collaborative Impact", content: "", videoUrl: "", enabled: false },
        cta: { subtitle: "Join Our Circle", heading: "Become a Partner", content: "", cta_text: "Partner with Us", cta_url: "/take-action#partner", enabled: true },
        inquiry: { heading: "Partnership Inquiries", content: "", email: "", enabled: true },
        seo: { title: "Our Partners", description: "" }
    });
    const [savingConfig, setSavingConfig] = useState(false);

    // Collapsible Sections State
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        hero: true,
        video: false,
        cta: true,
        inquiry: true,
        seo: false
    });

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState<Partial<Partner>>({
        name: "",
        type: "",
        description: "",
        website: "",
        logo: "",
        services: [],
        published: true,
        order: 0,
    });
    const [servicesInput, setServicesInput] = useState("");

    const {
        currentData: paginatedPartners,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<Partner>({
        data: partners,
        searchKeys: ['name', 'type', 'description', 'website', 'services'],
        initialPageSize: 10
    });

    const getDefaultPageConfig = (siteId: string) => {
        const siteSeed = (SEED_DATA as any)[siteId]?.partners?.sections;
        if (siteSeed) {
            return {
                hero: {
                    heading: siteSeed.hero?.heading || "Our Partners",
                    subtitle: siteSeed.hero?.subtitle || "Media Center",
                    content: siteSeed.hero?.content || "Collaborating with organizations that share our commitment.",
                    videoUrl: siteSeed.hero?.videoUrl || "",
                    enabled: siteSeed.hero?.enabled ?? true
                },
                video: {
                    heading: siteSeed.video?.heading || "Collaborative Impact & Community Care",
                    content: siteSeed.video?.content || "Together we build lasting pathways for our community.",
                    videoUrl: siteSeed.video?.videoUrl || "",
                    enabled: siteSeed.video?.enabled ?? false
                },
                cta: {
                    subtitle: siteSeed.cta?.subtitle || "Join Our Movement",
                    heading: siteSeed.cta?.heading || "Become a Partner",
                    content: siteSeed.cta?.content || "We welcome partnerships with organizations aligned with our mission and values.",
                    cta_text: siteSeed.cta?.cta_text || "Partner with Us",
                    cta_url: siteSeed.cta?.cta_url || "/take-action#partner",
                    enabled: siteSeed.cta?.enabled ?? true
                },
                inquiry: {
                    heading: siteSeed.inquiry?.heading || "Partnership Inquiries",
                    content: siteSeed.inquiry?.content || "To explore partnership opportunities, please reach out to our team.",
                    email: siteSeed.inquiry?.email || "partnerships@bweic.ca",
                    enabled: siteSeed.inquiry?.enabled ?? true
                },
                seo: {
                    title: siteSeed.seo?.title || "Our Partners",
                    description: siteSeed.seo?.description || "Meet our partners who support our mission."
                }
            };
        }
        return {
            hero: {
                heading: "Our Partners",
                subtitle: "Media Center",
                content: "Collaborating with organizations that share our commitment.",
                videoUrl: "",
                enabled: true
            },
            video: {
                heading: "Collaborative Impact",
                content: "",
                videoUrl: "",
                enabled: false
            },
            cta: {
                subtitle: "Join Our Circle",
                heading: "Become a Partner",
                content: "We welcome partnerships with organizations aligned with our mission.",
                cta_text: "Partner with Us",
                cta_url: "/take-action#partner",
                enabled: true
            },
            inquiry: {
                heading: "Partnership Inquiries",
                content: "To explore partnership opportunities, please contact us.",
                email: "contact@digitalmaples.com",
                enabled: true
            },
            seo: {
                title: "Our Partners",
                description: "Meet our partners."
            }
        };
    };

    useEffect(() => {
        loadPartners();
        loadPageConfig();
    }, [currentSite.id]);

    const loadPageConfig = async () => {
        try {
            const defaults = getDefaultPageConfig(currentSite.id);
            const data = await FirestoreService.getPageContent("partners", currentSite.id);
            if (data && data.sections) {
                setPageConfig({
                    hero: { ...defaults.hero, ...data.sections.hero },
                    video: { ...defaults.video, ...data.sections.video },
                    cta: { ...defaults.cta, ...data.sections.cta },
                    inquiry: { ...defaults.inquiry, ...data.sections.inquiry },
                    seo: { ...defaults.seo, ...data.sections.seo }
                });
            } else {
                setPageConfig(defaults);
            }
        } catch (error) {
            console.error("Error loading partners page config:", error);
        }
    };

    const savePageConfig = async () => {
        setSavingConfig(true);
        setError("");
        setSuccessMsg("");
        try {
            await FirestoreService.savePageContent("partners", { sections: pageConfig }, currentSite.id);
            setSuccessMsg("Page configuration saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (error) {
            console.error("Error saving config:", error);
            setError("Failed to save page configuration.");
        } finally {
            setSavingConfig(false);
        }
    };

    const handleRestoreDefaults = async () => {
        const confirmed = await confirm({
            title: "Restore Default Configuration?",
            message: `Are you sure you want to restore the default partner page sections and layout for ${currentSite.name}? Any unsaved edits will be overwritten with the seed configuration.`
        });
        if (!confirmed) return;

        const defaults = getDefaultPageConfig(currentSite.id);
        setPageConfig(defaults);
        try {
            await FirestoreService.savePageContent("partners", { sections: defaults }, currentSite.id);
            setSuccessMsg(`Default configuration for ${currentSite.name} restored successfully!`);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (e) {
            setError("Failed to save restored configuration.");
        }
    };

    useEffect(() => {
        if (isModalOpen && formData.services) {
            setServicesInput(formData.services.join(", "));
        }
    }, [isModalOpen, formData.services]);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getPartners(currentSite.id);
            // Sort by order ascending
            const sorted = data.sort((a: any, b: any) => a.order - b.order);
            setPartners(sorted as Partner[]);
        } catch (err) {
            console.error(err);
            setError("Failed to load partners.");
        } finally {
            setLoading(false);
        }
    };

    const seedPartners = async () => {
        setIsSeeding(true);
        setError("");
        setSuccessMsg("");
        try {
            const siteSeed = (SEED_DATA as any)[currentSite.id]?.partners;
            const partnersToSeed: any[] = Array.isArray(siteSeed)
                ? siteSeed
                : siteSeed?.items || siteSeed?.partners || [];

            if (partnersToSeed.length === 0) {
                setError(`No seed partners found for ${currentSite.name}.`);
                return;
            }

            // Remove existing partners for this tenant to avoid duplication or cross-contamination
            const existingPartners = await FirestoreService.getPartners(currentSite.id);
            for (const ep of existingPartners) {
                await FirestoreService.deletePartner(currentSite.id, ep.id);
            }

            for (let i = 0; i < partnersToSeed.length; i++) {
                const partner = partnersToSeed[i];
                await FirestoreService.savePartner(currentSite.id, {
                    name: partner.name,
                    type: partner.type || "Community Partner",
                    description: partner.description || "",
                    website: partner.website || partner.link || "#",
                    logo: partner.logo || "",
                    services: partner.services || [],
                    published: partner.published !== false,
                    order: partner.order ?? i
                });
            }
            setSuccessMsg(`Successfully seeded ${partnersToSeed.length} partners for ${currentSite.name}!`);
            loadPartners();
        } catch (err: any) {
            console.error(err);
            setError("Failed to seed partners: " + (err.message || String(err)));
        } finally {
            setIsSeeding(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            setError("Partner Name is required.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccessMsg("");

        try {
            // Process services input
            const servicesList = servicesInput
                .split(",")
                .map(s => s.trim())
                .filter(s => s.length > 0);

            await FirestoreService.savePartner(
                currentSite.id,
                {
                    ...formData,
                    services: servicesList,
                },
                currentPartnerId || undefined
            );

            setSuccessMsg(currentPartnerId ? "Partner updated successfully!" : "Partner created successfully!");
            setIsModalOpen(false);
            loadPartners();
            resetForm();
        } catch (err) {
            console.error(err);
            setError("Failed to save partner.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Partner",
            message: "Are you sure you want to delete this partner? This action cannot be undone.",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;

        try {
            await FirestoreService.deletePartner(currentSite.id, id);
            loadPartners();
        } catch (err) {
            console.error(err);
            setError("Failed to delete partner.");
        }
    };

    const handleEdit = (partner: Partner) => {
        setFormData({ ...partner });
        setCurrentPartnerId(partner.id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            type: "",
            description: "",
            website: "",
            logo: "",
            services: [],
            published: true,
            order: partners.length + 1,
        });
        setServicesInput("");
        setCurrentPartnerId(null);
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <>
            <PageMeta
                title="Partner Manager"
                description="Manage partners and collaborators"
            />

            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-2xl font-bold dark:text-white">Partner Manager</h1>
                <div className="flex gap-3">
                    <VersionHistoryManager documentId="partners" siteId={currentSite.id} />
                    <Button requireSuperAdmin variant="outline" onClick={seedPartners} disabled={isSeeding}>
                        {isSeeding ? "Seeding..." : "Seed Partners"}
                    </Button>
                    <Button onClick={openModal} className="flex items-center gap-2">
                        <PlusIcon className="w-4 h-4" /> Add Partner
                    </Button>
                </div>
            </div>

            {error && <Alert variant="error" title="Error" message={error} />}
            {successMsg && <Alert variant="success" title="Success" message={successMsg} />}

            {/* Page Sections Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-600" />
                            <span>Partners Page Sections & Content</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Configure the hero, media story, CTA banners, and inquiries section for {currentSite.name}.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            requireSuperAdmin
                            variant="outline"
                            onClick={handleRestoreDefaults}
                            className="text-xs text-gray-600 dark:text-gray-300"
                        >
                            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" /> Restore Defaults
                        </Button>
                        <Button
                            onClick={savePageConfig}
                            disabled={savingConfig}
                            className="bg-blue-600 hover:bg-blue-700 text-xs px-5 py-2.5"
                        >
                            {savingConfig ? "Saving..." : "Save Page Config"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* 1. HERO SECTION */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div
                            onClick={() => toggleSection('hero')}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="font-semibold text-sm text-gray-800 dark:text-white">1. Hero Section</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                {openSections.hero ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {openSections.hero && (
                            <div className="p-5 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Subtitle / Category Badge</Label>
                                    <Input
                                        placeholder="e.g. Media Center or Partnerships"
                                        value={pageConfig.hero?.subtitle || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            hero: { ...pageConfig.hero, subtitle: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Main Heading</Label>
                                    <Input
                                        placeholder="e.g. Our Partners"
                                        value={pageConfig.hero?.heading || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            hero: { ...pageConfig.hero, heading: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Hero Intro Description</Label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-colors"
                                        rows={3}
                                        placeholder="Introduction text for the partners directory..."
                                        value={pageConfig.hero?.content || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            hero: { ...pageConfig.hero, content: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. VIDEO & IMPACT STORY SECTION */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div
                            onClick={() => toggleSection('video')}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${pageConfig.video?.enabled ? "bg-green-500" : "bg-gray-300"}`} />
                                <span className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                    <Video size={16} className="text-gray-400" />
                                    2. Video & Impact Story Section
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                                <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-xs cursor-pointer font-medium"
                                >
                                    <input
                                        type="checkbox"
                                        checked={pageConfig.video?.enabled || false}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            video: { ...pageConfig.video, enabled: e.target.checked }
                                        })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Enabled</span>
                                </label>
                                {openSections.video ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {openSections.video && (
                            <div className="p-5 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Section Title</Label>
                                    <Input
                                        placeholder="e.g. Collaborative Impact & Community Care"
                                        value={pageConfig.video?.heading || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            video: { ...pageConfig.video, heading: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Video Embed URL (YouTube/Vimeo)</Label>
                                    <Input
                                        placeholder="https://www.youtube.com/embed/..."
                                        value={pageConfig.video?.videoUrl || pageConfig.hero?.videoUrl || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            video: { ...pageConfig.video, videoUrl: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Video Story Description</Label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-colors"
                                        rows={3}
                                        value={pageConfig.video?.content || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            video: { ...pageConfig.video, content: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. BECOME A PARTNER CTA SECTION */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div
                            onClick={() => toggleSection('cta')}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${pageConfig.cta?.enabled !== false ? "bg-green-500" : "bg-gray-300"}`} />
                                <span className="font-semibold text-sm text-gray-800 dark:text-white">3. Become a Partner (Call To Action)</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                                <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-xs cursor-pointer font-medium"
                                >
                                    <input
                                        type="checkbox"
                                        checked={pageConfig.cta?.enabled !== false}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            cta: { ...pageConfig.cta, enabled: e.target.checked }
                                        })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Enabled</span>
                                </label>
                                {openSections.cta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {openSections.cta && (
                            <div className="p-5 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>CTA Subtitle / Tagline</Label>
                                    <Input
                                        placeholder="e.g. Join Our Movement"
                                        value={pageConfig.cta?.subtitle || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            cta: { ...pageConfig.cta, subtitle: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>CTA Heading</Label>
                                    <Input
                                        placeholder="e.g. Become a Partner"
                                        value={pageConfig.cta?.heading || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            cta: { ...pageConfig.cta, heading: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>CTA Description</Label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-colors"
                                        rows={3}
                                        value={pageConfig.cta?.content || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            cta: { ...pageConfig.cta, content: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Button Text</Label>
                                    <Input
                                        placeholder="e.g. Partner with Us"
                                        value={pageConfig.cta?.cta_text || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            cta: { ...pageConfig.cta, cta_text: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Button Destination URL</Label>
                                    <Input
                                        placeholder="e.g. /take-action#partner or mailto:..."
                                        value={pageConfig.cta?.cta_url || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            cta: { ...pageConfig.cta, cta_url: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. PARTNERSHIP INQUIRIES & CONTACT SECTION */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div
                            onClick={() => toggleSection('inquiry')}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${pageConfig.inquiry?.enabled !== false ? "bg-green-500" : "bg-gray-300"}`} />
                                <span className="font-semibold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                                    <Mail size={16} className="text-gray-400" />
                                    4. Partnership Inquiries & Contact
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                                <label
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 text-xs cursor-pointer font-medium"
                                >
                                    <input
                                        type="checkbox"
                                        checked={pageConfig.inquiry?.enabled !== false}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            inquiry: { ...pageConfig.inquiry, enabled: e.target.checked }
                                        })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Enabled</span>
                                </label>
                                {openSections.inquiry ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {openSections.inquiry && (
                            <div className="p-5 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Section Title</Label>
                                    <Input
                                        placeholder="e.g. Partnership Inquiries"
                                        value={pageConfig.inquiry?.heading || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            inquiry: { ...pageConfig.inquiry, heading: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Inquiry Email Address</Label>
                                    <Input
                                        placeholder="e.g. partnerships@bweic.ca"
                                        value={pageConfig.inquiry?.email || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            inquiry: { ...pageConfig.inquiry, email: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label>Inquiry Instructions / Description</Label>
                                    <textarea
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-colors"
                                        rows={2}
                                        value={pageConfig.inquiry?.content || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            inquiry: { ...pageConfig.inquiry, content: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. SEO METADATA */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div
                            onClick={() => toggleSection('seo')}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Globe size={16} className="text-gray-400" />
                                <span className="font-semibold text-sm text-gray-800 dark:text-white">5. SEO & Metadata</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                {openSections.seo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        {openSections.seo && (
                            <div className="p-5 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Meta Title</Label>
                                    <Input
                                        placeholder="e.g. Partners | BWEIC"
                                        value={pageConfig.seo?.title || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            seo: { ...pageConfig.seo, title: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>Meta Description</Label>
                                    <Input
                                        placeholder="e.g. Meet our partners who support our mission..."
                                        value={pageConfig.seo?.description || ""}
                                        onChange={(e) => setPageConfig({
                                            ...pageConfig,
                                            seo: { ...pageConfig.seo, description: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading partners...</div>
            ) : (
                <>
                    <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                        <TableControls
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchPlaceholder="Search partners..."
                        />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-medium">
                                    <th className="p-4">Logo</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Website</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Order</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {paginatedPartners.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            No partners found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPartners.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-4">
                                                {partner.logo ? (
                                                    <img src={partner.logo} alt={partner.name} className="w-12 h-12 object-contain rounded bg-gray-50" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Logo</div>
                                                )}
                                            </td>
                                            <td className="p-4 font-medium dark:text-white">{partner.name}</td>
                                            <td className="p-4 text-sm text-gray-500">{partner.type}</td>
                                            <td className="p-4 text-sm text-blue-500 truncate max-w-xs">{partner.website}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${partner.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {partner.published ? "Published" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">{partner.order}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(partner)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(partner.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <TrashBinIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-6">
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        nextPage={nextPage}
                        prevPage={prevPage}
                    />
                </div>
            </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentPartnerId ? "Edit Partner" : "Add New Partner"}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Partner Name</Label>
                            <Input
                                placeholder="Enter partner name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Partner Type</Label>
                            <Input
                                placeholder="e.g. Community Partner"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Website URL</Label>
                            <Input
                                placeholder="https://..."
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Partner Logo</Label>
                            <div className="flex gap-4 items-start">
                                {formData.logo ? (
                                    <div className="relative group w-20 flex-shrink-0">
                                        <img
                                            src={formData.logo}
                                            alt="Logo"
                                            className="w-full h-20 object-contain rounded-lg border dark:border-gray-600 bg-gray-50"
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, logo: "" })}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                        >
                                            <TrashBinIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsMediaLibraryOpen(true)}
                                        className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors"
                                    >
                                        <span className="text-xs">Logo</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-2">
                                        Select partner logo (preferably transparent PNG).
                                    </p>
                                    <Input
                                        placeholder="Or paste image URL"
                                        value={formData.logo}
                                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <Label>Description</Label>
                            <textarea
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                rows={3}
                                placeholder="Brief description of the partnership"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Services (Comma Separated)</Label>
                            <Input
                                placeholder="Consulting, Strategy, Dev..."
                                value={servicesInput}
                                onChange={(e) => setServicesInput(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Sort Order</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer mt-8">
                                <input
                                    type="checkbox"
                                    checked={formData.published}
                                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium dark:text-gray-300">Published</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : currentPartnerId ? "Update Partner" : "Create Partner"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <MediaLibrary
                isOpen={isMediaLibraryOpen}
                onClose={() => setIsMediaLibraryOpen(false)}
                onSelect={(url) => {
                    setFormData({ ...formData, logo: url });
                    setIsMediaLibraryOpen(false);
                }}
            />
        </>
    );
}
