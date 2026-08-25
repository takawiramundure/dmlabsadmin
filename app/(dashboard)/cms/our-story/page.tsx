"use client";

import React, { useEffect, useState, useMemo } from "react";
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

const getOurStorySectionsConfig = (siteId: string) => {
  const normalized = (siteId || "").toLowerCase();

  if (normalized === "bweic") {
    return [
      { id: "hero", label: "Hero Header" },
      { id: "mission", label: "Mission & Purpose" },
      { id: "vision", label: "Vision for Canada" },
      { id: "story", label: "How We Began (Origin Story)" },
      { id: "values", label: "Our Core Values" },
      { id: "founder", label: "Message from the Founder" },
      { id: "cta", label: "Call to Action" }
    ];
  }

  if (normalized === "kmfw") {
    return [
      { id: "hero", label: "Our Journey & Story" },
      { id: "originStory", label: "How We Began" },
      { id: "culturalIdentity", label: "Cultural Identity & Values" },
      { id: "mission", label: "Mission & Purpose" },
      { id: "landAcknowledgement", label: "Land Acknowledgement" }
    ];
  }

  // General default for other sites
  return [
    { id: "hero", label: "Our Story Hero" },
    { id: "story", label: "How We Began" },
    { id: "mission", label: "Mission & Vision" },
    { id: "values", label: "Core Values & Principles" },
    { id: "founder", label: "Leadership & Founder" },
    { id: "cta", label: "Get Involved" }
  ];
};

export default function OurStoryManager() {
  const { currentSite } = useSite();
  const { confirm } = useDialog();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selected, setSelected] = useState<SelectedElement>({ type: "section", sectionId: "hero" });
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isInsertSidebarOpen, setIsInsertSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);

  const [reusableComponents, setReusableComponents] = useState<any[]>([]);
  const [archivedComponents, setArchivedComponents] = useState<any[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagReusableSectionId, setTagReusableSectionId] = useState<string | null>(null);
  const [reusableLabel, setReusableLabel] = useState("");

  const sectionsConfig = useMemo(() => getOurStorySectionsConfig(currentSite.id), [currentSite.id]);

  // Derive sorted sections dynamically
  const sortedSections = useMemo(() => {
    if (!content) return sectionsConfig;

    const loadedSections = content.sections || {};
    const rootKeys = Object.keys(content).filter(k => 
      !["title", "seo", "sectionOrder", "updatedAt", "updatedBy", "sections"].includes(k) &&
      typeof content[k] === "object" && content[k] !== null
    );

    const allPresentKeys = Array.from(new Set([
      ...Object.keys(loadedSections),
      ...rootKeys
    ]));

    let order: string[] = [];
    if (content.sectionOrder && Array.isArray(content.sectionOrder) && content.sectionOrder.length > 0) {
      order = content.sectionOrder;
    } else {
      order = sectionsConfig.map(s => s.id);
    }

    const unlisted = allPresentKeys.filter(k => !order.includes(k));
    const combinedOrder = [...order, ...unlisted];

    return combinedOrder.map(id => {
      const predefined = sectionsConfig.find(s => s.id === id);
      const loadedSec = loadedSections[id] || content[id] || {};
      return {
        id,
        label: predefined?.label || loadedSec.heading || loadedSec.title || id.replace(/[-_]/g, " ").toUpperCase()
      };
    });
  }, [content, sectionsConfig]);

  // Load Content strictly for current tenant
  const loadContent = async () => {
    setContent(null);
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const siteId = currentSite.id;
      const data = await FirestoreService.getPageContent("our-story", siteId);
      const reusables = await FirestoreService.getReusableSections(siteId);
      const archived = await FirestoreService.getArchivedSections(siteId, "our-story");

      setReusableComponents(reusables || []);
      setArchivedComponents(archived || []);

      const baseSections = getOurStorySectionsConfig(siteId);
      const firstSecId = baseSections[0]?.id || "hero";
      setSelected({ type: "section", sectionId: firstSecId });

      if (data && (Object.keys(data).length > 0 || (data.sections && Object.keys(data.sections).length > 0))) {
        setContent(data);
      } else {
        // Sensible initial content for Our Story
        const initialContent: Record<string, any> = {
          sectionOrder: baseSections.map(s => s.id)
        };
        baseSections.forEach(sec => {
          initialContent[sec.id] = {
            enabled: true,
            heading: sec.label,
            content: `Learn about the journey, values, and community impact of ${currentSite.name || siteId.toUpperCase()}.`
          };
        });
        setContent(initialContent);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load Our Story content: " + (err.message || String(err)));
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

      const dataToSave = {
        title: currentContent.title || "Our Story",
        seo: currentContent.seo || {},
        sectionOrder: finalOrder,
        sections: cleanSections,
        ...cleanSections
      };

      await FirestoreService.savePageContent("our-story", dataToSave, currentSite.id);
      setSuccessMsg("Our Story page published successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save Our Story: " + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Field & Section Modifiers with Atomic Functional Updates
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
        title: `New Value ${items.length + 1}`,
        description: "Enter principle description...",
        tag: "Core Value",
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

  const handleInsertComponent = (componentData: any) => {
    const newId = componentData.id || `custom_${Date.now()}`;
    const newOrder = [...sortedSections.map(s => s.id), newId];
    
    setContent({
      ...content,
      [newId]: {
        enabled: true,
        heading: componentData.name || componentData.heading || "New Section",
        subtitle: componentData.category || "Custom Block",
        content: componentData.content || "",
        items: componentData.items || []
      },
      sectionOrder: newOrder
    });

    setIsInsertSidebarOpen(false);
    setSelected({ type: "section", sectionId: newId });
  };

  const handleArchiveSection = async (sectionId: string) => {
    const isConfirmed = await confirm({
      title: "Archive Section",
      message: `Are you sure you want to archive "${sectionId}"? It will be removed from Our Story and saved into the Archived Library.`,
      variant: "warning",
      confirmLabel: "Archive Section"
    });

    if (!isConfirmed) return;
    const secData = content?.[sectionId] || content?.sections?.[sectionId] || {};
    try {
      await FirestoreService.archiveSection(currentSite.id, "our-story", sectionId, secData);
      const newOrder = sortedSections.map(s => s.id).filter(id => id !== sectionId);
      setContent({
        ...content,
        sectionOrder: newOrder
      });
      const archived = await FirestoreService.getArchivedSections(currentSite.id, "our-story");
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
        title={`Our Story Editor - ${currentSite.name} | DMLabs Hybrid Visual Canvas`}
        description="Live visual builder for Our Story page with real-time WYSIWYG editing"
      />

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-950 text-white">
        {/* TOP ACTION BAR */}
        <div className="h-14 border-b border-gray-800 bg-gray-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-bold uppercase">
              {currentSite.name}
            </span>
            <h1 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Our Story Builder</span>
              <span className="text-[10px] text-gray-500 font-normal normal-case">
                ({sortedSections.length} sections)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Insert Component Drawer Button */}
            <button
              onClick={() => setIsInsertSidebarOpen(true)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} className="text-blue-400" />
              <span>Insert</span>
            </button>

            {/* Version History */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
            >
              <History size={14} className="text-amber-400" />
              <span>History</span>
            </button>

            {/* Archived Library */}
            <button
              onClick={() => setIsArchivedModalOpen(true)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Archive size={14} className="text-purple-400" />
              <span>Archives ({archivedComponents.length})</span>
            </button>

            {/* Toggle Inspector */}
            <button
              onClick={() => setIsInspectorOpen(!isInspectorOpen)}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                isInspectorOpen 
                  ? "bg-blue-600 text-white border-blue-500 shadow-sm" 
                  : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
              }`}
              title="Toggle Properties Inspector"
            >
              <Sliders size={16} />
            </button>

            {/* Publish / Save */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow flex items-center gap-1.5 ml-2"
            >
              <Save size={14} />
              <span>{saving ? "Publishing..." : "Publish Live"}</span>
            </Button>
          </div>
        </div>

        {/* NOTIFICATION ALERTS */}
        {error && (
          <div className="p-3 bg-red-950/80 border-b border-red-800 text-red-300 text-xs px-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-white font-bold text-xs">Dismiss</button>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 text-xs px-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check size={14} /> {successMsg}
            </span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-white font-bold text-xs">Dismiss</button>
          </div>
        )}

        {/* WORKSPACE CANVAS + INSPECTOR SPLIT */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Visual Canvas Area */}
          <div className="flex-1 overflow-y-auto bg-gray-950">
            <VisualPageCanvas
              content={content}
              sortedSections={sortedSections}
              selected={selected}
              onSelect={setSelected}
              onSectionChange={handleSectionChange}
              onItemChange={handleItemChange}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onMoveSection={handleMoveSection}
              onOpenInsertDrawer={() => setIsInsertSidebarOpen(true)}
              onArchiveSection={handleArchiveSection}
              onTagReusable={(secId) => {
                setTagReusableSectionId(secId);
                setReusableLabel(`${secId} Section`);
                setIsTagModalOpen(true);
              }}
            />
          </div>

          {/* Properties Inspector Sidebar */}
          {isInspectorOpen && (
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
            />
          )}
        </div>
      </div>

      {/* INSERT COMPONENT SIDEBAR */}
      <InsertSidebar
        isOpen={isInsertSidebarOpen}
        onClose={() => setIsInsertSidebarOpen(false)}
        onInsert={handleInsertComponent}
        reusableComponents={reusableComponents}
      />

      {/* VERSION HISTORY MODAL */}
      <VersionHistoryManager
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        siteId={currentSite.id}
        logicalCollection="content"
        documentId="our-story"
        onRestore={(restoredData) => {
          setContent(restoredData);
          setIsHistoryOpen(false);
          setSuccessMsg("Restored previous version of Our Story!");
          setTimeout(() => setSuccessMsg(""), 4000);
        }}
      />

      {/* ARCHIVED COMPONENTS MODAL */}
      <Modal
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
        title="Archived Components Library"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Restore archived components back onto your Our Story layout.
          </p>
          {archivedComponents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 text-xs">
              No archived sections found.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {archivedComponents.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-white block">
                      {item.name || item.sectionId}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Archived: {new Date(item.archivedAt?.toDate ? item.archivedAt.toDate() : item.archivedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleInsertComponent(item.data);
                      setIsArchivedModalOpen(false);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* SAVE TO REUSABLE MODAL */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title="Save Component to Reusable Library"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Give this component a descriptive label so team members can reuse it across other pages.
          </p>
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Reusable Component Label
            </label>
            <input
              type="text"
              value={reusableLabel}
              onChange={(e) => setReusableLabel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Core Values Grid"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTagModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTagReusableConfirm}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow"
            >
              Save to Library
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
