"use client";

import React, { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { 
  Sparkles, 
  Plus, 
  Save, 
  History, 
  ExternalLink,
  Check,
  RotateCcw
} from "lucide-react";
import { SEED_DATA } from "@/config/seedData";
import { Modal } from "@/components/ui/modal";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";
import BlockSectionEditor from "@/components/cms/BlockSectionEditor";
import InsertSidebar from "@/components/common/InsertSidebar";

const getSectionsConfig = (siteId: string) => {
  const normalized = (siteId || "").toLowerCase();

  if (normalized === 'nspc') {
    return [
      { id: 'hero_slider', label: 'Hero Banner Slider' },
      { id: 'understanding', label: 'Understanding Suicide' },
      { id: 'coping', label: 'Coping & Mental Wellness' },
      { id: 'crisis_support', label: 'Crisis Support & Hotlines' },
      { id: 'programs', label: 'Programs & Training' },
      { id: 'resources', label: 'Helpful Resources & Guides' },
      { id: 'suicide_facts', label: 'Suicide Prevention Facts' },
      { id: 'about', label: 'About NSPC' },
      { id: 'partners', label: 'Community Partners' }
    ];
  }
  if (normalized === 'aitasol') {
    return [
      { id: 'hero', label: 'Hero Section' },
      { id: 'stats', label: 'Impact Statistics' },
      { id: 'services', label: 'AI & Global Services' },
      { id: 'destinations', label: 'Global Destinations' },
      { id: 'process', label: 'Our Process & Roadmap' },
      { id: 'testimonials', label: 'Client Testimonials' },
      { id: 'cta', label: 'Call To Action' }
    ];
  }
  if (normalized === 'noel') {
    return [
      { id: 'hero', label: 'Hero Section' },
      { id: 'services', label: 'Specialized Medical Services' },
      { id: 'our_story', label: 'Our Story (Home Section)' },
      { id: 'projects', label: 'Recent Projects (Toggle)' },
      { id: 'reviews', label: 'Testimonials (Toggle)' }
    ];
  }
  if (normalized === 'kmfw') {
    return [
      { id: 'hero', label: 'Hero Banner' },
      { id: 'awards_ticker', label: 'Awards & Recognition Ticker' },
      { id: 'mission', label: 'Our Mission & Mandate' },
      { id: 'mindfulness', label: 'Mindful Wellness (Values / Who We Are)' },
      { id: 'coreFoundations', label: 'Core Foundations (Trio)' },
      { id: 'whyWeWorkDifferently', label: 'Why We Work Differently (Impact & 2025–2026 Reach)' },
      { id: 'howItWorks', label: 'Pathways to Wellness (How It Works)' },
      { id: 'slideshow', label: 'Community in Action (Animated Slideshow)' },
      { id: 'slider', label: 'Gallery Slider' },
      { id: 'testimonials', label: 'Stories from Our Families (Testimonials)' }
    ];
  }
  if (normalized === 'dmlabs') {
    return [
      { id: 'hero', label: 'Hero Section' },
      { id: 'ticker', label: 'Ticker Section' },
      { id: 'trusted_by', label: 'Trusted By Section' },
      { id: 'who_we_are', label: 'Who We Are' },
      { id: 'pricing', label: 'Pricing Section' },
      { id: 'final_cta', label: 'Final Call to Action' }
    ];
  }
  if (normalized === 'havens') {
    return [
      { id: 'hero', label: 'Hero Section' },
      { id: 'overview', label: 'Overview Section' },
      { id: 'services', label: 'What We Deliver' },
      { id: 'credentials', label: 'Why Homes Choose Us' },
      { id: 'contact', label: 'Book a Review & Contact' }
    ];
  }
  if (normalized === 'elwg') {
    return [
      { id: 'hero', label: 'Hero Section' },
      { id: 'mission', label: 'Mission & Vision' },
      { id: 'programs', label: 'Empowerment Programs' },
      { id: 'impact', label: 'Our Impact' },
      { id: 'events', label: 'Upcoming Gatherings' },
      { id: 'contact', label: 'Get In Touch' }
    ];
  }
  if (normalized === 'phcg') {
    return [
      { id: 'hero', label: 'Hero Section' },
      { id: 'about', label: 'About PHCG' },
      { id: 'services', label: 'Clinical Services' },
      { id: 'team', label: 'Our Healthcare Team' },
      { id: 'testimonials', label: 'Patient Testimonials' },
      { id: 'contact', label: 'Appointment & Contact' }
    ];
  }
  if (normalized === 'bweic') {
    return [
      { id: 'hero', label: 'Hero Slider Banner' },
      { id: 'founder', label: "Message from the Founder" },
      { id: 'mission', label: 'Why Choose BWEIC & 3 Pillars' },
      { id: 'slider', label: 'Image Gallery Divider' },
      { id: 'blog', label: 'Latest News & Stories' },
      { id: 'events_embed', label: 'Live Upcoming Events Stream' },
      { id: 'impact', label: 'Measurable Impact Statistics' }
    ];
  }
  return [
    { id: 'hero', label: 'Hero Section' },
    { id: 'about', label: 'About Section' },
    { id: 'services', label: 'Services Section' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'cta', label: 'Call To Action' }
  ];
};

export default function HomePageManager() {
  const { currentSite } = useSite();
  const { confirm } = useDialog();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Insert Sidebar & Reusable State
  const [isInsertSidebarOpen, setIsInsertSidebarOpen] = useState(false);
  const [reusableComponents, setReusableComponents] = useState<any[]>([]);
  const [archivedComponents, setArchivedComponents] = useState<any[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagSectionId, setTagSectionId] = useState<string | null>(null);
  const [reusableLabel, setReusableLabel] = useState("");

  const sectionsConfig = React.useMemo(() => getSectionsConfig(currentSite.id), [currentSite.id]);

  // Section Order & Discovery: Strictly mirrors the 1:1 frontend default
  const sortedSections = React.useMemo(() => {
    const configMap = new Map(sectionsConfig.map((s) => [s.id, s]));
    const dynamicConfigs: { id: string; label: string }[] = [];

    // 1. If explicit sectionOrder exists and contains items, respect it
    if (content?.sectionOrder && Array.isArray(content.sectionOrder) && content.sectionOrder.length > 0) {
      content.sectionOrder.forEach((id: string) => {
        if (configMap.has(id)) {
          dynamicConfigs.push(configMap.get(id)!);
          configMap.delete(id);
        } else {
          const customSec = content?.[id] || content?.sections?.[id];
          const label = customSec?.heading || customSec?.reusableLabel || customSec?.title || id.replace(/[-_]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
          dynamicConfigs.push({ id, label });
        }
      });

      // Append any base configs that were omitted from sectionOrder
      configMap.forEach((val) => {
        dynamicConfigs.push(val);
      });

      return dynamicConfigs;
    }

    // 2. Default sequence: strictly use the canonical 1:1 frontend layout order!
    const baseConfigs = sectionsConfig.map(s => {
      configMap.delete(s.id);
      return s;
    });

    // 3. Append custom sections that were manually added
    const ignoreKeys = new Set(['sectionOrder', 'updatedAt', 'createdAt', 'siteId', 'pageId', 'id', 'seo', 'meta', 'published', 'status', 'lastUpdated']);
    const customConfigs: { id: string; label: string }[] = [];
    if (content) {
      const allKeys = new Set([...Object.keys(content), ...Object.keys(content.sections || {})]);
      allKeys.forEach(key => {
        if (!ignoreKeys.has(key) && !sectionsConfig.some(s => s.id === key)) {
          const customSec = content?.[key] || content?.sections?.[key];
          if (customSec && typeof customSec === 'object') {
            const label = customSec?.heading || customSec?.reusableLabel || customSec?.title || key.replace(/[-_]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
            customConfigs.push({ id: key, label });
          }
        }
      });
    }

    return [...baseConfigs, ...customConfigs];
  }, [content, sectionsConfig]);

  // Load Content strictly for current tenant
  const loadContent = async () => {
    setContent(null);
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const siteId = currentSite.id;
      const data = await FirestoreService.getPageContent("home", siteId);
      const reusables = await FirestoreService.getReusableSections(siteId);
      const archived = await FirestoreService.getArchivedSections(siteId, "home");

      setReusableComponents(reusables || []);
      setArchivedComponents(archived || []);

      if (data && (Object.keys(data).length > 0 || (data.sections && Object.keys(data.sections).length > 0))) {
        setContent(data);
      } else {
        const seed = (SEED_DATA as any)[siteId]?.home;
        if (seed) {
          setContent(seed);
        } else {
          const defaultSections = getSectionsConfig(siteId);
          const initialSections: Record<string, any> = {};
          defaultSections.forEach((s) => {
            initialSections[s.id] = { enabled: true, heading: s.label };
          });
          setContent({
            sections: initialSections,
            sectionOrder: defaultSections.map((s) => s.id)
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to load content for tenant", currentSite.id, err);
      setError("Failed to load content: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [currentSite.id]);

  // Save Content
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const siteId = currentSite.id;
      const currentOrder = sortedSections.map(s => s.id);
      const flatPayload: any = {
        ...content,
        sectionOrder: currentOrder,
        lastUpdated: new Date().toISOString()
      };

      if (content.sections) {
        Object.keys(content.sections).forEach((key) => {
          flatPayload[key] = content.sections[key];
        });
      }

      await FirestoreService.savePageContent("home", flatPayload, siteId);
      setSuccessMsg("Home page saved and published successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      console.error("Save error:", err);
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSectionChange = (sectionId: string, field: string, value: any) => {
    setContent((prev: any) => {
      if (!prev) return prev;
      const currentSec = prev[sectionId] || prev?.sections?.[sectionId] || {};
      const updatedSec = { ...currentSec, [field]: value };
      return {
        ...prev,
        [sectionId]: updatedSec,
        sections: {
          ...(prev.sections || {}),
          [sectionId]: updatedSec
        }
      };
    });
  };

  const handleSectionBatchUpdate = (sectionId: string, updates: Record<string, any>) => {
    setContent((prev: any) => {
      if (!prev) return prev;
      const currentSec = prev[sectionId] || prev?.sections?.[sectionId] || {};
      const updatedSec = { ...currentSec, ...updates };
      return {
        ...prev,
        [sectionId]: updatedSec,
        sections: {
          ...(prev.sections || {}),
          [sectionId]: updatedSec
        }
      };
    });
  };

  const handleToggleSectionEnabled = (sectionId: string, enabled: boolean) => {
    handleSectionChange(sectionId, "enabled", enabled);
  };

  const handleReorder = (newOrder: string[]) => {
    setContent((prev: any) => ({
      ...prev,
      sectionOrder: newOrder
    }));
  };

  // Add reusable or blank component from InsertSidebar
  const handleInsertReusable = (comp: any) => {
    const newId = comp.id ? `${comp.id}_${Date.now()}` : `section_${Date.now()}`;
    const cleanComp = { ...comp, id: newId, enabled: true };
    const currentOrder = sortedSections.map(s => s.id);
    
    setContent((prev: any) => ({
      ...prev,
      [newId]: cleanComp,
      sections: {
        ...(prev?.sections || {}),
        [newId]: cleanComp
      },
      sectionOrder: [...currentOrder, newId]
    }));
    setIsInsertSidebarOpen(false);
    setSuccessMsg(`Added "${cleanComp.heading || comp.reusableLabel || newId}" section.`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Duplicate Section
  const handleDuplicateSection = (secId: string) => {
    const currentSec = content?.[secId] || content?.sections?.[secId] || {};
    const newId = `${secId}_copy_${Date.now()}`;
    const duplicatedSec = {
      ...currentSec,
      id: newId,
      heading: `${currentSec.heading || currentSec.title || secId} (Copy)`,
      enabled: true
    };
    const currentOrder = sortedSections.map(s => s.id);
    const secIndex = currentOrder.indexOf(secId);
    const newOrder = [...currentOrder];
    if (secIndex !== -1) {
      newOrder.splice(secIndex + 1, 0, newId);
    } else {
      newOrder.push(newId);
    }

    setContent((prev: any) => ({
      ...prev,
      [newId]: duplicatedSec,
      sections: {
        ...(prev?.sections || {}),
        [newId]: duplicatedSec
      },
      sectionOrder: newOrder
    }));
    setSuccessMsg(`Duplicated section as "${duplicatedSec.heading}".`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Delete Section
  const handleDeleteSection = async (secId: string) => {
    const isConfirmed = await confirm({
      title: "Remove Section",
      message: `Are you sure you want to remove "${secId}" from the home page?`,
      variant: "danger",
      confirmLabel: "Remove"
    });
    if (!isConfirmed) return;

    const currentOrder = sortedSections.map(s => s.id).filter(id => id !== secId);
    setContent((prev: any) => {
      const updated = { ...prev };
      delete updated[secId];
      if (updated.sections) {
        delete updated.sections[secId];
      }
      updated.sectionOrder = currentOrder;
      return updated;
    });
    setSuccessMsg(`Removed section "${secId}".`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Open Tag Reusable Modal
  const handleOpenTagReusable = (secId: string, data: any) => {
    setTagSectionId(secId);
    setReusableLabel(data.heading || data.title || secId);
    setIsTagModalOpen(true);
  };

  // Confirm Save to Reusable Library
  const handleConfirmTagReusable = async () => {
    if (!tagSectionId || !reusableLabel.trim()) return;
    try {
      const secData = content?.[tagSectionId] || content?.sections?.[tagSectionId] || {};
      await FirestoreService.saveReusableSection(currentSite.id, tagSectionId, {
        ...secData,
        reusableLabel: reusableLabel.trim()
      });
      const reusables = await FirestoreService.getReusableSections(currentSite.id);
      setReusableComponents(reusables || []);
      setIsTagModalOpen(false);
      setTagSectionId(null);
      setReusableLabel("");
      setSuccessMsg("Saved to Reusable Library! You can now insert this component on any page.");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (e: any) {
      setError("Failed to save to Reusable Library: " + e.message);
    }
  };

  const handleSeedData = async () => {
    const isConfirmed = await confirm({
      title: "Reset to Default Layout",
      message: `This will reset and synchronize the default 1:1 home page sections for "${currentSite.name}".`,
      variant: "warning",
      confirmLabel: "Reset to Defaults"
    });

    if (!isConfirmed) return;
    setSaving(true);
    try {
      const seed = (SEED_DATA as any)[currentSite.id]?.home;
      if (!seed) throw new Error("No seed data for this site.");
      await FirestoreService.savePageContent("home", seed, currentSite.id);
      await loadContent();
      setSuccessMsg("Default content seeded successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError("Seed error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewDomain = currentSite.domain.startsWith("http") 
    ? currentSite.domain 
    : `https://${currentSite.domain}`;

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Content Editor - ${currentSite.name} | Admin Portal`}
        description="Structured block-based section content manager"
      />

      <div className="flex flex-col min-h-[calc(100vh-80px)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 shadow-xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                Home Page Section Editor
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {currentSite.name}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Exact 1:1 frontend layout order. Reorder, edit fields, or insert reusable global blocks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInsertSidebarOpen(true)}
              className="flex items-center gap-1.5 font-semibold"
            >
              <Plus size={15} /> Add Section
            </Button>

            <a
              href={previewDomain}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-1.5 transition-colors"
              title="Open the live website in a new tab"
            >
              <ExternalLink size={14} /> Live Website
            </a>

            <button
              type="button"
              onClick={handleSeedData}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={14} /> Reset Defaults
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <History size={14} /> History
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 shadow-md px-5 font-semibold"
            >
              <Save size={15} />
              {saving ? "Publishing..." : "Save & Publish"}
            </Button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-xs px-6 font-semibold">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-6 font-semibold flex items-center gap-2">
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* Split Screen Layout: Main Editor (Left) + Shopify-Style Always-Visible Add Section Dock (Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Block-Based Section Editor */}
          <div className="flex-1 overflow-y-auto">
            <BlockSectionEditor
              sections={sortedSections}
              content={content}
              onSectionChange={handleSectionChange}
              onSectionBatchUpdate={handleSectionBatchUpdate}
              onReorder={handleReorder}
              onToggleSectionEnabled={handleToggleSectionEnabled}
              onOpenInsertDrawer={() => setIsInsertSidebarOpen(true)}
              onTagReusable={handleOpenTagReusable}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={handleDeleteSection}
            />
          </div>

          {/* Shopify-Style Always-Visible Component Dock */}
          <InsertSidebar
            isOpen={true}
            docked={true}
            reusableComponents={reusableComponents}
            archivedComponents={archivedComponents}
            onAddReusable={handleInsertReusable}
            onAddBlankSection={(title) => {
              const id = title.trim().toLowerCase().replace(/\s+/g, "_");
              handleInsertReusable({ id, heading: title, columns: 3, items: [] });
            }}
          />
        </div>
      </div>

      {/* Save Section to Reusable Library Modal */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title="Save Section to Reusable Library"
      >
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saving this section will make it immediately available to insert on any page in this website.
          </p>
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Reusable Component Name
            </label>
            <input
              type="text"
              value={reusableLabel}
              onChange={(e) => setReusableLabel(e.target.value)}
              placeholder="e.g. Gallery Moments Slider"
              className="w-full mt-1.5 p-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsTagModalOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <Button size="sm" onClick={handleConfirmTagReusable}>
              Save to Library
            </Button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      <VersionHistoryManager
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        siteId={currentSite.id}
        pageId="home"
        collection="pages"
        onRestore={loadContent}
      />
    </>
  );
}
