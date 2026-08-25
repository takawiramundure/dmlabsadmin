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
  Sliders, 
  Save, 
  History, 
  Archive, 
  Layers, 
  ArrowLeft,
  Check
} from "lucide-react";
import { SEED_DATA } from "@/config/seedData";
import InsertSidebar from "@/components/common/InsertSidebar";
import { Modal } from "@/components/ui/modal";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";
import VisualPageCanvas from "@/components/cms/VisualPageCanvas";
import PropertiesInspector, { SelectedElement } from "@/components/cms/PropertiesInspector";
import { resolveSectionItems } from "@/utils/sectionUtils";

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
      { id: 'coreFoundations', label: 'Core Foundations' },
      { id: 'mindfulness', label: 'Mindfulness Section' },
      { id: 'mission', label: 'Mission / Objectives' },
      { id: 'whyWeWorkDifferently', label: 'Why We Work Differently' },
      { id: 'slideshow', label: 'Animated Image Slideshow' },
      { id: 'slider', label: 'Gallery Slider' },
      { id: 'howItWorks', label: 'How It Works' },
      { id: 'testimonials', label: 'Testimonials' }
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

  // Inspector & Canvas State
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selected, setSelected] = useState<SelectedElement>({ type: "section", sectionId: "hero" });

  // Reusable Sidebar State
  const [isInsertSidebarOpen, setIsInsertSidebarOpen] = useState(false);
  const [reusableComponents, setReusableComponents] = useState<any[]>([]);
  const [archivedComponents, setArchivedComponents] = useState<any[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagReusableSectionId, setTagReusableSectionId] = useState<string | null>(null);
  const [reusableLabel, setReusableLabel] = useState("");

  // History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const sectionsConfig = React.useMemo(() => getSectionsConfig(currentSite.id), [currentSite.id]);

  // Dynamic Section Order & Discovery per Tenant
  const sortedSections = React.useMemo(() => {
    const configMap = new Map(sectionsConfig.map((s) => [s.id, s]));
    const dynamicConfigs: { id: string; label: string }[] = [];

    // 1. Process custom sectionOrder if present
    if (content?.sectionOrder && Array.isArray(content.sectionOrder) && content.sectionOrder.length > 0) {
      content.sectionOrder.forEach((id: string) => {
        if (configMap.has(id)) {
          dynamicConfigs.push(configMap.get(id)!);
          configMap.delete(id);
        } else {
          const customSec = content?.[id] || content?.sections?.[id];
          const label = customSec?.heading || customSec?.reusableLabel || customSec?.title || id.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          dynamicConfigs.push({ id, label });
        }
      });

      configMap.forEach((val) => {
        dynamicConfigs.push(val);
      });

      return dynamicConfigs;
    }

    // 2. Discover dynamically from tenant's content
    const discoveredKeys = new Set<string>();
    const ignoreKeys = new Set(['sectionOrder', 'updatedAt', 'createdAt', 'siteId', 'pageId', 'id', 'seo', 'meta', 'published', 'status', 'lastUpdated']);

    if (content) {
      Object.keys(content).forEach(key => {
        if (!ignoreKeys.has(key) && typeof content[key] === 'object' && content[key] !== null) {
          discoveredKeys.add(key);
        }
      });
      if (content.sections && typeof content.sections === 'object') {
        Object.keys(content.sections).forEach(key => {
          if (!ignoreKeys.has(key) && typeof content.sections[key] === 'object' && content.sections[key] !== null) {
            discoveredKeys.add(key);
          }
        });
      }
    }

    if (discoveredKeys.size > 0) {
      discoveredKeys.forEach(id => {
        if (configMap.has(id)) {
          dynamicConfigs.push(configMap.get(id)!);
          configMap.delete(id);
        } else {
          const customSec = content?.[id] || content?.sections?.[id];
          const label = customSec?.heading || customSec?.reusableLabel || customSec?.title || id.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          dynamicConfigs.push({ id, label });
        }
      });

      // Append remaining base configs
      configMap.forEach((val) => {
        dynamicConfigs.push(val);
      });

      return dynamicConfigs;
    }

    return sectionsConfig;
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

      const baseSections = getSectionsConfig(siteId);
      const firstSecId = baseSections[0]?.id || "hero";
      setSelected({ type: "section", sectionId: firstSecId });

      if (data && (Object.keys(data).length > 0 || (data.sections && Object.keys(data.sections).length > 0))) {
        const siteSeed = SEED_DATA?.[siteId]?.home?.sections || SEED_DATA?.[siteId] || {};
        const merged = { ...data };
        baseSections.forEach(sec => {
          if (!merged[sec.id] && !merged?.sections?.[sec.id] && siteSeed[sec.id]) {
            merged[sec.id] = siteSeed[sec.id];
          }
        });
        setContent(merged);
      } else {
        // Tenant-isolated sensible starter
        const siteSeed = SEED_DATA?.[siteId]?.home?.sections || SEED_DATA?.[siteId] || {};
        const initialContent: Record<string, any> = {
          sectionOrder: baseSections.map(s => s.id)
        };
        baseSections.forEach(sec => {
          const defaultSec = siteSeed[sec.id] || {
            enabled: true,
            heading: sec.label,
            content: `Welcome to ${currentSite.name || siteId.toUpperCase()}`
          };
          initialContent[sec.id] = defaultSec;
        });
        setContent(initialContent);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load content for tenant: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [currentSite]);

  // Save Content
  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const currentContent = { ...content };
      const finalOrder = sortedSections.map(s => s.id);
      
      const cleanSections: Record<string, any> = {};
      for (const key of finalOrder) {
        const secVal = currentContent[key] || currentContent?.sections?.[key] || { heading: key, enabled: true };
        cleanSections[key] = secVal;
      }

      // Guarantee hero is enabled by default
      if (cleanSections.hero && cleanSections.hero.enabled === undefined) {
        cleanSections.hero.enabled = true;
      }

      const dataToSave = {
        title: currentContent.title || "Home",
        seo: currentContent.seo || {},
        sectionOrder: finalOrder,
        status: currentContent.status || "published",
        sections: cleanSections,
        ...cleanSections
      };

      await FirestoreService.savePageContent("home", dataToSave, currentSite.id);
      setSuccessMsg("Home page saved and published successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save content: " + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Section & Item updates
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

  const handleItemChange = (sectionId: string, cardIndex: number, field: string, value: any) => {
    setContent((prev: any) => {
      if (!prev) return prev;
      const currentSec = prev[sectionId] || prev?.sections?.[sectionId] || {};
      const { items, arrayKey } = resolveSectionItems(currentSec, currentSite?.id, sectionId);
      const updatedItems = [...items];
      updatedItems[cardIndex] = { ...updatedItems[cardIndex], [field]: value };
      
      const updatedSec = { ...currentSec, [arrayKey]: updatedItems };
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

  const handleAddItem = (sectionId: string) => {
    let newItemIdx = 0;
    setContent((prev: any) => {
      if (!prev) return prev;
      const currentSec = prev[sectionId] || prev?.sections?.[sectionId] || {};
      const { items, arrayKey } = resolveSectionItems(currentSec, currentSite?.id, sectionId);
      const newCard = {
        title: `New Item ${items.length + 1}`,
        description: "Enter description here...",
        tag: "Feature",
        cta: "Learn More",
        icon: "Sparkles"
      };
      const updatedItems = [...items, newCard];
      newItemIdx = updatedItems.length - 1;
      const updatedSec = { ...currentSec, [arrayKey]: updatedItems };
      return {
        ...prev,
        [sectionId]: updatedSec,
        sections: {
          ...(prev.sections || {}),
          [sectionId]: updatedSec
        }
      };
    });

    // Auto focus inspector on the new card
    setSelected({
      type: "card",
      sectionId,
      cardIndex: newItemIdx
    });
    setIsInspectorOpen(true);
  };

  const handleDeleteItem = (sectionId: string, cardIndex: number) => {
    setContent((prev: any) => {
      if (!prev) return prev;
      const currentSec = prev[sectionId] || prev?.sections?.[sectionId] || {};
      const { items, arrayKey } = resolveSectionItems(currentSec, currentSite?.id, sectionId);
      const updatedItems = items.filter((_: any, idx: number) => idx !== cardIndex);
      const updatedSec = { ...currentSec, [arrayKey]: updatedItems };
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

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const newOrder = sortedSections.map(s => s.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    
    setContent({
      ...content,
      sectionOrder: newOrder
    });
  };

  // Reusable Insert & Archive
  const handleInsertReusable = (comp: any) => {
    const newId = comp.id ? `${comp.id}_${Date.now()}` : `section_${Date.now()}`;
    const cleanComp = { ...comp, id: newId, enabled: true };
    const currentOrder = sortedSections.map(s => s.id);
    
    setContent({
      ...content,
      [newId]: cleanComp,
      sections: {
        ...(content.sections || {}),
        [newId]: cleanComp
      },
      sectionOrder: [...currentOrder, newId]
    });
    setIsInsertSidebarOpen(false);
    setSelected({ type: "section", sectionId: newId });
  };

  const handleArchiveSection = async (sectionId: string) => {
    const isConfirmed = await confirm({
      title: "Archive Section",
      message: `Are you sure you want to archive "${sectionId}"? It will be removed from this page and saved into the Archived Library.`,
      variant: "warning",
      confirmLabel: "Archive Section"
    });

    if (!isConfirmed) return;
    const secData = content?.[sectionId] || content?.sections?.[sectionId] || {};
    try {
      await FirestoreService.archiveSection(currentSite.id, "home", sectionId, secData);
      const newOrder = sortedSections.map(s => s.id).filter(id => id !== sectionId);
      setContent({
        ...content,
        sectionOrder: newOrder
      });
      const archived = await FirestoreService.getArchivedSections(currentSite.id, "home");
      setArchivedComponents(archived);
      setSuccessMsg(`Archived ${sectionId} to library.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      setError("Failed to archive: " + e.message);
    }
  };

  const handleTagReusableConfirm = async () => {
    if (!tagReusableSectionId || !reusableLabel.trim()) return;
    try {
      const secData = content?.[tagReusableSectionId] || content?.sections?.[tagReusableSectionId] || {};
      await FirestoreService.saveReusableSection(currentSite.id, tagReusableSectionId, {
        ...secData,
        reusableLabel: reusableLabel.trim()
      });
      const reusables = await FirestoreService.getReusableSections(currentSite.id);
      setReusableComponents(reusables);
      setIsTagModalOpen(false);
      setTagReusableSectionId(null);
      setReusableLabel("");
      setSuccessMsg("Saved to Reusable Library!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      setError("Failed to save reusable: " + e.message);
    }
  };

  const handleSeedData = async () => {
    const isConfirmed = await confirm({
      title: "Seed Home Page Data",
      message: `This will reset and synchronize default home page sections for "${currentSite.name}".`,
      variant: "warning",
      confirmLabel: "Seed Default Data"
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
        title={`Visual Page Builder - ${currentSite.name} | Admin Portal`}
        description="Framer-style visual page builder with right-hand inspector"
      />

      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
              Home Page Builder
            </h2>
            <span className="text-xs text-gray-400 font-mono">({currentSite.name})</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSeedData}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-1.5"
            >
              <Sparkles size={14} /> Seed Default Data
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-1.5"
            >
              <History size={14} /> History
            </button>

            <button
              type="button"
              onClick={() => setIsInspectorOpen(!isInspectorOpen)}
              className={`px-3 py-1.5 text-xs font-semibold border rounded-xl flex items-center gap-1.5 transition-all ${
                isInspectorOpen 
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold" 
                  : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Sliders size={14} /> Inspector
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 shadow-md px-5"
            >
              <Save size={15} />
              {saving ? "Publishing..." : "Save & Publish"}
            </Button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs px-6 font-semibold">{error}</div>}
        {successMsg && <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs px-6 font-semibold flex items-center gap-2"><Check size={16} /> {successMsg}</div>}

        {/* Main Canvas & Inspector Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Full Width Visual Page Canvas */}
          <VisualPageCanvas
            content={content}
            sortedSections={sortedSections}
            selected={selected}
            onSelect={(sel) => {
              setSelected(sel);
              setIsInspectorOpen(true);
            }}
            onSectionChange={handleSectionChange}
            onSectionBatchUpdate={handleSectionBatchUpdate}
            onItemChange={handleItemChange}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onMoveSection={handleMoveSection}
            onOpenInsertDrawer={() => setIsInsertSidebarOpen(true)}
            onArchiveSection={handleArchiveSection}
            onTagReusable={(secId) => {
              setTagReusableSectionId(secId);
              setIsTagModalOpen(true);
            }}
          />

          {/* Right-Hand Properties Inspector */}
          <PropertiesInspector
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            selected={selected}
            content={content}
            onSectionChange={handleSectionChange}
            onSectionBatchUpdate={handleSectionBatchUpdate}
            onItemChange={handleItemChange}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onArchiveSection={handleArchiveSection}
            onTagReusable={(secId) => {
              setTagReusableSectionId(secId);
              setIsTagModalOpen(true);
            }}
            onMoveSection={(secId, dir) => {
              const idx = sortedSections.findIndex(s => s.id === secId);
              if (idx !== -1) handleMoveSection(idx, dir);
            }}
          />
        </div>
      </div>

      {/* Insert Sidebar Drawer */}
      <InsertSidebar
        isOpen={isInsertSidebarOpen}
        onClose={() => setIsInsertSidebarOpen(false)}
        reusableComponents={reusableComponents}
        archivedComponents={archivedComponents}
        onAddReusable={handleInsertReusable}
        onAddBlankSection={(title) => {
          const id = title.trim().toLowerCase().replace(/\s+/g, "_");
          handleInsertReusable({ id, heading: title, columns: 3, items: [] });
        }}
      />

      {/* Tag Reusable Modal */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title="Save Section to Reusable Library"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Reusable Component Name</label>
            <input
              type="text"
              value={reusableLabel}
              onChange={(e) => setReusableLabel(e.target.value)}
              placeholder="e.g. Featured Highlights Grid"
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
            <Button size="sm" onClick={handleTagReusableConfirm}>
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
