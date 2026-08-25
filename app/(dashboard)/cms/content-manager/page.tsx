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

export default function ContentManager() {
  const params = useParams();
  const router = useRouter();
  const location = usePathname();
  const searchParams = useSearchParams();
  const { currentSite } = useSite();
  const { confirm } = useDialog();

  const pageId = searchParams.get('pageId') || params?.pageId || (location ? location.split('/').filter(Boolean).pop() : "about");

  // Redirect home to home-settings
  useEffect(() => {
    if (pageId === 'home' || pageId === 'home-settings') {
      router.replace('/cms/home-settings');
    }
  }, [pageId, router]);

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Inspector & Canvas State
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [selected, setSelected] = useState<SelectedElement>({ type: "section", sectionId: "main" });

  // Reusable Sidebar State
  const [isInsertSidebarOpen, setIsInsertSidebarOpen] = useState(false);
  const [reusableComponents, setReusableComponents] = useState<any[]>([]);
  const [archivedComponents, setArchivedComponents] = useState<any[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagReusableSectionId, setTagReusableSectionId] = useState<string | null>(null);
  const [reusableLabel, setReusableLabel] = useState("");

  // History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Human readable title
  const pageTitle = useMemo(() => {
    if (!pageId) return "Page Content";
    return pageId.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
      const label = sec?.heading || sec?.reusableLabel || sec?.title || id.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return { id, label };
    });
  }, [content, pageTitle]);

  // Load Content
  const loadContent = async () => {
    if (!pageId || pageId === 'home') return;
    setLoading(true);
    setError("");
    try {
      const data = await FirestoreService.getPageContent(pageId, currentSite.id);
      const reusables = await FirestoreService.getReusableSections(currentSite.id);
      const archived = await FirestoreService.getArchivedSections(currentSite.id, pageId);

      setReusableComponents(reusables);
      setArchivedComponents(archived);

      const siteSeed = (SEED_DATA as any)?.[currentSite.id]?.[pageId] || 
        (SEED_DATA as any)?.[currentSite.id]?.[pageId.replace(/_/g, '-')] || 
        (SEED_DATA as any)?.[currentSite.id]?.[pageId.replace(/-/g, '_')];

      if (data && (Object.keys(data).length > 0 || (data.sections && Object.keys(data.sections).length > 0))) {
        const merged = { ...data };
        if (siteSeed?.sections) {
          Object.keys(siteSeed.sections).forEach(secKey => {
            if (!merged[secKey] && !merged?.sections?.[secKey]) {
              merged[secKey] = siteSeed.sections[secKey];
            }
          });
        }
        setContent(merged);
        const firstSec = merged.sectionOrder?.[0] || Object.keys(merged.sections || {})[0] || Object.keys(merged)[0] || "main";
        setSelected({ type: "section", sectionId: firstSec });
      } else if (siteSeed) {
        setContent(siteSeed);
        const firstSec = siteSeed.sectionOrder?.[0] || Object.keys(siteSeed.sections || {})[0] || Object.keys(siteSeed)[0] || "main";
        setSelected({ type: "section", sectionId: firstSec });
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
        setSelected({ type: "section", sectionId: "main" });
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
    if (!content || !pageId) return;
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

      const dataToSave = {
        title: currentContent.title || pageTitle,
        seo: currentContent.seo || {},
        sectionOrder: finalOrder,
        status: currentContent.status || "published",
        sections: cleanSections,
        ...cleanSections
      };

      await FirestoreService.savePageContent(pageId, dataToSave, currentSite.id);
      setSuccessMsg(`${pageTitle} saved and published successfully!`);
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
      await FirestoreService.archiveSection(currentSite.id, pageId, sectionId, secData);
      const newOrder = sortedSections.map(s => s.id).filter(id => id !== sectionId);
      setContent({
        ...content,
        sectionOrder: newOrder
      });
      const archived = await FirestoreService.getArchivedSections(currentSite.id, pageId);
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
        title={`${pageTitle} Builder - ${currentSite.name} | Admin Portal`}
        description={`Framer-style visual page builder for ${pageTitle}`}
      />

      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/cms/pages')}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors mr-1"
              title="Back to Pages Manager"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
              {pageTitle} Builder
            </h2>
            <span className="text-xs text-gray-400 font-mono">({currentSite.name})</span>
          </div>

          <div className="flex items-center gap-2.5">
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
        pageId={pageId}
        collection="pages"
        onRestore={loadContent}
      />
    </>
  );
}
