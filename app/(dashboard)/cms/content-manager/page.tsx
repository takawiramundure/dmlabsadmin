"use client";

import React, { useEffect, useState, useMemo } from "react";
import PageMeta from "@/components/common/PageMeta";
import { useParams, usePathname, useSearchParams, useRouter } from "next/navigation";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { 
  Sparkles, 
  Save, 
  History, 
  ArrowLeft,
  Check,
  ExternalLink,
  Plus
} from "lucide-react";
import { SEED_DATA } from "@/config/seedData";
import { Modal } from "@/components/ui/modal";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";
import BlockSectionEditor from "@/components/cms/BlockSectionEditor";
import InsertSidebar from "@/components/common/InsertSidebar";

export default function ContentManager() {
  const params = useParams();
  const router = useRouter();
  const location = usePathname();
  const searchParams = useSearchParams();
  const { currentSite } = useSite();
  const { confirm } = useDialog();

  const rawSlug = searchParams.get('slug');
  const rawPageId = searchParams.get('pageId') || params?.pageId || (location ? location.split('/').filter(Boolean).pop() : "about");
  // If slug is present and differs, pageDocId tracks the canonical document ID in Firestore
  const pageDocId: string = rawSlug || (Array.isArray(rawPageId) ? rawPageId[0] : (rawPageId || "about"));
  const pageId: string = Array.isArray(rawPageId) ? rawPageId[0] : (rawPageId || pageDocId);

  // Redirect home to home-settings
  useEffect(() => {
    if (pageId === 'home' || pageId === 'home-settings' || pageDocId === 'home') {
      router.replace('/cms/home-settings');
    }
  }, [pageId, pageDocId, router]);

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

  // Human readable title
  const pageTitle = useMemo(() => {
    if (!pageId) return "Page Content";
    return pageId.replace(/[-_]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
  }, [pageId]);

  // Dynamic Section Order
  const sortedSections = useMemo(() => {
    if (!content) return [{ id: "main", label: `${pageTitle} Main Section` }];

    let order = content.sectionOrder;
    if (!order || !Array.isArray(order) || order.length === 0) {
      const secKeys = Object.keys(content.sections || {}).filter(k => !["id", "title", "seo", "sectionOrder", "lastUpdated", "status"].includes(k));
      if (secKeys.length > 0) {
        order = secKeys;
      } else {
        const topKeys = Object.keys(content).filter(k => !["id", "title", "seo", "sectionOrder", "sections", "lastUpdated", "status"].includes(k));
        order = topKeys.length > 0 ? topKeys : ["main"];
      }
    }

    return order.map((id: string) => {
      const sec = content?.[id] || content?.sections?.[id];
      const label = sec?.heading || sec?.reusableLabel || sec?.title || id.replace(/[-_]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
      return { id, label };
    });
  }, [content, pageTitle]);

  // Load Content
  const loadContent = async () => {
    if (!pageId || pageId === 'home' || pageDocId === 'home') return;
    setLoading(true);
    setError("");
    try {
      // First check by pageDocId (canonical slug), fallback to pageId (template)
      let data = await FirestoreService.getPageContent(pageDocId, currentSite.id);
      if (!data && pageDocId !== pageId) {
        data = await FirestoreService.getPageContent(pageId, currentSite.id);
      }
      const reusables = await FirestoreService.getReusableSections(currentSite.id);
      const archived = await FirestoreService.getArchivedSections(currentSite.id, pageDocId);

      setReusableComponents(reusables || []);
      setArchivedComponents(archived || []);

      const siteSeed = (SEED_DATA as any)?.[currentSite.id]?.[pageDocId] ||
        (SEED_DATA as any)?.[currentSite.id]?.[pageDocId.replace(/_/g, '-')] || 
        (SEED_DATA as any)?.[currentSite.id]?.[pageDocId.replace(/-/g, '_')] ||
        (SEED_DATA as any)?.[currentSite.id]?.[pageId] || 
        (SEED_DATA as any)?.[currentSite.id]?.[pageId.replace(/_/g, '-')] || 
        (SEED_DATA as any)?.[currentSite.id]?.[pageId.replace(/-/g, '_')];

      if (data && (Object.keys(data).length > 0 || (data.sections && Object.keys(data.sections).length > 0))) {
        const merged = { ...data };
        if (siteSeed?.sections) {
          if (!merged.sections) merged.sections = {};
          Object.keys(siteSeed.sections).forEach(secKey => {
            const seedSec = siteSeed.sections[secKey];
            const existingSec = merged.sections[secKey] || merged[secKey];
            
            if (!existingSec) {
              merged.sections[secKey] = seedSec;
            } else {
              // Deep merge items or seed data if existing section has no items
              const existingItems = existingSec.items || merged.items;
              merged.sections[secKey] = {
                ...seedSec,
                ...existingSec,
                items: (existingItems && existingItems.length > 0) ? existingItems : (seedSec.items || [])
              };
            }
          });
        }
        setContent(merged);
      } else if (siteSeed) {
        setContent(siteSeed);
      } else {
        setContent({
          title: pageTitle,
          main: {
            heading: pageTitle,
            subtitle: `Welcome to ${pageTitle}`,
            content: `<p>Learn more about our work, initiatives, and community impact.</p>`,
            enabled: true,
            columns: 3,
            items: [
              { title: "Our Focus", description: "Dedicated community empowerment and support.", tag: "Initiative" },
              { title: "Key Highlights", description: "Creating lasting systemic change across Canada.", tag: "Highlight" },
              { title: "Get Involved", description: "Join our programs, circles, and upcoming events.", tag: "Action" }
            ]
          },
          sectionOrder: ["main"]
        });
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load page content: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [pageId, currentSite]);

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
        Object.keys(content.sections).forEach(key => {
          flatPayload[key] = content.sections[key];
        });
      }

      await FirestoreService.savePageContent(pageDocId, flatPayload, siteId);
      if (pageDocId !== pageId) {
        await FirestoreService.savePageContent(pageId, flatPayload, siteId);
      }
      setSuccessMsg(`${pageTitle} saved and published successfully!`);
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
      message: `Are you sure you want to remove "${secId}" from this page?`,
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

  const previewUrl = currentSite.domain.startsWith("http")
    ? `${currentSite.domain}/${pageId}`
    : `https://${currentSite.domain}/${pageId}`;

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
        title={`${pageTitle} Editor - ${currentSite.name} | Admin Portal`}
        description={`Structured block-based section content manager for ${pageTitle}`}
      />

      <div className="flex flex-col min-h-[calc(100vh-80px)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 shadow-xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/cms/pages')}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Back to Pages Manager"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                {pageTitle} Content Editor
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {currentSite.name}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Edit sections, insert components from library, and publish updates.
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
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center gap-1.5 transition-colors"
              title="Open the page on the live website"
            >
              <ExternalLink size={14} /> View on Live Site
            </a>

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
              placeholder="e.g. Testimonials Showcase"
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
        pageId={pageId}
        collection="pages"
        onRestore={loadContent}
      />
    </>
  );
}
