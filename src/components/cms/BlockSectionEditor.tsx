"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  BookmarkPlus,
  Copy,
  PlusCircle,
  ExternalLink,
  Link2,
  Sliders,
  BookOpen,
  Briefcase
} from "lucide-react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import ImagePicker from "@/components/form/ImagePicker";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { useSite } from "@/context/SiteContext";

export interface SectionBlock {
  id: string;
  label: string;
  enabled?: boolean;
  [key: string]: any;
}

interface BlockSectionEditorProps {
  sections: SectionBlock[];
  content: Record<string, any>;
  onSectionChange: (sectionId: string, field: string, value: any) => void;
  onSectionBatchUpdate: (sectionId: string, updates: Record<string, any>) => void;
  onReorder: (newOrder: string[]) => void;
  onToggleSectionEnabled: (sectionId: string, enabled: boolean) => void;
  onOpenInsertDrawer?: () => void;
  onTagReusable?: (sectionId: string, sectionData: any) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onAddItem?: (sectionId: string, itemType?: string) => void;
  onDeleteItem?: (sectionId: string, index: number, itemType?: string) => void;
  onItemFieldChange?: (sectionId: string, index: number, field: string, value: any, itemType?: string) => void;
}

export default function BlockSectionEditor({
  sections,
  content,
  onSectionChange,
  onSectionBatchUpdate,
  onReorder,
  onToggleSectionEnabled,
  onOpenInsertDrawer,
  onTagReusable,
  onDuplicateSection,
  onDeleteSection,
  onAddItem,
  onDeleteItem,
  onItemFieldChange,
}: BlockSectionEditorProps) {
  const { currentSite } = useSite();
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    sections[0]?.id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedSectionId(expandedSectionId === id ? null : id);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    onReorder(newSections.map((s) => s.id));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full p-4 sm:p-6 pb-24">
      {/* Top Insert Prompt */}
      {onOpenInsertDrawer && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
              Page Structure & Section Order
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The order below reflects your live frontend 1:1. Use the arrows to reorder, or add pre-built global components.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onOpenInsertDrawer}
            className="flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus size={15} /> Add Section
          </Button>
        </div>
      )}

      {sections.map((section, idx) => {
        const secData = content?.[section.id] || content?.sections?.[section.id] || {};
        const isEnabled = secData.enabled !== false;
        const isExpanded = expandedSectionId === section.id;

        // Detect if section is a Careers / Job Postings component
        const isJobPostingsSection =
          section.id === "job_postings" ||
          section.id === "careers" ||
          (section.id === "hero" && (section.label?.toLowerCase().includes("job") || section.label?.toLowerCase().includes("career") || content?.title === "Careers" || content?.slug === "careers"));

        // Detect if section is a standard Hero Slider component
        const isHeroSection = !isJobPostingsSection && (section.id === "hero" || section.id === "hero_slider");

        return (
          <div
            key={section.id}
            className={`rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-xs hover:shadow-md ${
              isExpanded 
                ? "border-blue-500/40 ring-4 ring-blue-500/10 bg-white/80 dark:bg-white/[0.04]" 
                : "border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20"
            }`}
          >
            {/* Header / Summary Bar */}
            <div className="flex items-center justify-between p-4 sm:px-6 cursor-pointer select-none">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0" onClick={() => toggleExpand(section.id)}>
                <div className="flex items-center gap-1 text-gray-400 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(idx, "up");
                    }}
                    className="p-1 hover:text-gray-800 dark:hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 rounded-lg transition-colors"
                    title="Move section up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(idx, "down");
                    }}
                    className="p-1 hover:text-gray-800 dark:hover:text-white disabled:opacity-20 disabled:hover:text-gray-400 rounded-lg transition-colors"
                    title="Move section down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                    isEnabled 
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
                      : "bg-gray-100/60 dark:bg-white/5 text-gray-400 border-gray-200/60 dark:border-white/5"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                      {section.label}
                      {isJobPostingsSection && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1 shrink-0 backdrop-blur-xs">
                          <Link2 size={11} /> Global Component
                        </span>
                      )}
                      {(isHeroSection) && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1 shrink-0 backdrop-blur-xs">
                          <Link2 size={11} /> Global Component
                        </span>
                      )}
                      {!isEnabled && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20 shrink-0 backdrop-blur-xs">
                          Hidden
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 font-mono truncate">id: {section.id}</p>
                      {isJobPostingsSection && (
                        <span className="text-[11px] text-indigo-500/80 dark:text-indigo-400">
                          • Inherited from Global Components &gt; Job Postings &amp; Vacancies
                        </span>
                      )}
                      {isHeroSection && (
                        <span className="text-[11px] text-indigo-500/80 dark:text-indigo-400">
                          • Inherited from Global Components &gt; Hero Slider
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Save to Reusable Library Button */}
                {onTagReusable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagReusable(section.id, secData);
                    }}
                    className="p-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors"
                    title="Save to Reusable Components Library to use on other pages"
                  >
                    <BookmarkPlus size={16} />
                  </button>
                )}

                {/* Duplicate Section */}
                {onDuplicateSection && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSection(section.id);
                    }}
                    className="p-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                    title="Duplicate section"
                  >
                    <Copy size={16} />
                  </button>
                )}

                {/* Delete / Remove Section */}
                {onDeleteSection && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSection(section.id);
                    }}
                    className="p-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    title="Remove section from this page"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => onToggleSectionEnabled(section.id, !isEnabled)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isEnabled
                      ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                  title={isEnabled ? "Visible on live site (click to hide)" : "Hidden from live site (click to show)"}
                >
                  {isEnabled ? <Eye size={17} /> : <EyeOff size={17} />}
                  <span className="hidden md:inline">{isEnabled ? "Visible" : "Hidden"}</span>
                </button>

                {/* Accordion Expand/Collapse */}
                <button
                  type="button"
                  onClick={() => toggleExpand(section.id)}
                  className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* Expandable Form Content */}
            {isExpanded && (
              <div className="px-4 sm:px-6 pb-6 pt-3 border-t border-gray-100 dark:border-white/5 space-y-6 animate-fadeIn">
                {renderSectionFields(section.id, secData, onSectionChange, onSectionBatchUpdate, currentSite?.id, onAddItem, onDeleteItem, onItemFieldChange, content, section.label)}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom Add Section Button */}
      {onOpenInsertDrawer && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={onOpenInsertDrawer}
            className="w-full py-4 border-2 border-dashed border-gray-300/80 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md hover:bg-blue-500/5 shadow-xs"
          >
            <PlusCircle size={18} /> Add New Section or Global Component
          </button>
        </div>
      )}
    </div>
  );
}

function renderSectionFields(
  sectionId: string,
  secData: any,
  onChange: (secId: string, field: string, val: any) => void,
  onBatchUpdate: (secId: string, updates: Record<string, any>) => void,
  siteId?: string,
  onAddItem?: (secId: string, itemType?: string) => void,
  onDeleteItem?: (secId: string, idx: number, itemType?: string) => void,
  onItemChange?: (secId: string, idx: number, field: string, val: any, itemType?: string) => void,
  pageContent?: any,
  sectionLabel?: string
) {
  // Specialized renderer for Careers / Job Postings Vacancies component
  const isJobPostings =
    sectionId === "job_postings" ||
    sectionId === "careers" ||
    (sectionId === "hero" && (
      sectionLabel?.toLowerCase().includes("job") ||
      sectionLabel?.toLowerCase().includes("career") ||
      pageContent?.title === "Careers" ||
      pageContent?.slug === "careers"
    ));

  if (isJobPostings) {
    return renderJobPostingsSection(sectionId, secData, onChange);
  }

  // Specialized renderer for Awards & Recognition Ticker
  if (sectionId === "awards_ticker") {
    return renderAwardsTicker(secData, onChange);
  }

  // Specialized renderer for KMFW WhyWeWorkDifferently
  if (sectionId === "whyWeWorkDifferently") {
    return renderWhyWeWorkDifferently(secData, onChange, onAddItem, onDeleteItem, onItemChange);
  }

  // Specialized renderer for CoreFoundations
  if (sectionId === "coreFoundations") {
    return renderCoreFoundations(secData, onChange, onAddItem, onDeleteItem, onItemChange);
  }

  // Specialized renderer for Mindfulness
  if (sectionId === "mindfulness") {
    return renderMindfulness(secData, onChange, onAddItem, onDeleteItem, onItemChange);
  }

  // Specialized renderer for Mission
  if (sectionId === "mission") {
    return renderMission(secData, onChange);
  }

  // Specialized renderer for Testimonials / Family Stories
  if (sectionId === "testimonials") {
    return renderTestimonials(secData, onChange);
  }

  // Specialized renderer for Hero Banner
  if (sectionId === "hero" || sectionId === "hero_slider") {
    return renderHeroSection(sectionId, secData, onChange);
  }

  // Specialized renderer for Gallery Slider / Images
  if (sectionId === "slider" || sectionId === "slideshow" || sectionId === "gallery") {
    return renderGallerySection(sectionId, secData, onChange);
  }

  // Specialized renderer for Newsletters & PDF Publications
  if (sectionId === "newsletters") {
    return renderNewslettersSection(sectionId, secData, onChange);
  }

  // Specialized NSPC single-page sections (only when site is nspc)
  if (siteId === "nspc") {
    if (sectionId === "understanding") {
      return renderUnderstandingSuicide(secData, onChange);
    }
    if (sectionId === "coping") {
      return renderNspcCoping(secData, onChange);
    }
    if (sectionId === "crisis_support" || sectionId === "crisis") {
      return renderNspcCrisisSupport(secData, onChange);
    }
    if (sectionId === "programs") {
      return renderNspcPrograms(secData, onChange);
    }
    if (sectionId === "resources") {
      return renderNspcResources(secData, onChange);
    }
    if (sectionId === "suicide_facts") {
      return renderNspcFacts(secData, onChange);
    }
    if (sectionId === "about") {
      return renderNspcAbout(secData, onChange);
    }
    if (sectionId === "partners") {
      return renderNspcPartners(secData, onChange);
    }
  }

  // Generic Dynamic Block Section Renderer
  return renderGenericSection(sectionId, secData, onChange, onAddItem, onDeleteItem, onItemChange);
}

function renderHeroSection(
  sectionId: string,
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const slides: any[] = data.slides || [];
  const primarySlide = slides[0] || {};
  const currentImg = primarySlide.imageUrl || data.imageUrl || data.image || "";
  const title = primarySlide.title || data.title || data.heading || "Hero Slider";
  const subtitle = primarySlide.subtitle || data.subtitle || "";

  return (
    <div className="space-y-4">
      {/* Global Component Master Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white/70 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-white/[0.02] border border-indigo-200/80 dark:border-indigo-800/60 backdrop-blur-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Link2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Global Component
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/20 backdrop-blur-xs">
                  Global Components &gt; Hero Slider
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-xl leading-relaxed">
                This hero banner is centrally managed under <strong>Global Components</strong> so you can customize multiple slides, background photos, and call-to-action buttons in one central location.
              </p>
            </div>
          </div>

          <Link
            href="/cms/hero"
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all hover:shadow-md"
          >
            <Sliders size={15} /> Edit Hero Slider <ExternalLink size={14} />
          </Link>
        </div>

        {/* Read-Only Summary / Live Preview Snippet */}
        <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white/70 dark:bg-white/[0.04] p-3 rounded-xl border border-indigo-100/80 dark:border-white/10 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Current Primary Headline</span>
            <p className="font-semibold text-gray-800 dark:text-white truncate">
              {title || "(No title configured)"}
            </p>
            {subtitle && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <div className="bg-white/70 dark:bg-white/[0.04] p-3 rounded-xl border border-indigo-100/80 dark:border-white/10 backdrop-blur-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Carousel Slides</span>
              <p className="font-semibold text-gray-800 dark:text-white">
                {slides.length > 0 ? `${slides.length} Slide${slides.length > 1 ? 's' : ''} Configured` : "1 Slide Active"}
              </p>
            </div>
            {currentImg && (
              <img
                src={currentImg}
                alt="Slide preview"
                className="w-12 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderNewslettersSection(
  sectionId: string,
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const items: any[] = data.items || [
    {
      id: 's1',
      title: "Summer Newsletter 2024",
      date: "Summer 2024",
      pdfUrl: "https://firebasestorage.googleapis.com/v0/b/nspc-web.firebasestorage.app/o/kmfw%2Fnewsletters%2F1774927342750_Summer-2024.pdf?alt=media&token=626d9ad0-eb09-45d3-8a56-226486775775",
      issue: "Issue No. 3"
    },
    {
      id: 's2',
      title: "Fall Newsletter 2024",
      date: "Fall 2024",
      pdfUrl: "https://firebasestorage.googleapis.com/v0/b/nspc-web.firebasestorage.app/o/kmfw%2Fnewsletters%2F1774927342749_Fall-2024.pdf?alt=media&token=e983a1f6-f156-4550-ba1f-3ca9bd3f4d32",
      issue: "Issue No. 2"
    },
    {
      id: 's3',
      title: "KMFW Inaugural Newsletter",
      date: "Inaugural",
      pdfUrl: "https://firebasestorage.googleapis.com/v0/b/nspc-web.firebasestorage.app/o/kmfw%2Fnewsletters%2F1774927342749_Inaugural-Newsletter.pdf?alt=media&token=33c8911e-74b5-4277-8463-11d3cc06f60e",
      issue: "Issue No. 1"
    }
  ];

  return (
    <div className="space-y-5">
      {/* Quick Launch Banner to Dedicated Newsletters Hub */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-primary/5 to-white/70 dark:from-amber-950/30 dark:via-primary/10 dark:to-white/[0.02] border border-amber-500/20 dark:border-amber-500/30 backdrop-blur-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Dedicated Publications Hub
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                  /cms/newsletters
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-xl leading-relaxed">
                You can manage PDF uploads, quarterly dates, and recent news media stories in the dedicated <strong>Media & Newsletters Manager</strong> or configure them directly below.
              </p>
            </div>
          </div>

          <Link
            href="/cms/newsletters"
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all hover:shadow-md"
          >
            <Sliders size={15} /> Open Dedicated Editor <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Headings */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Heading</Label>
          <Input
            value={data.heading || "Quarterly Newsletters"}
            placeholder="Quarterly Newsletters"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
            onChange={(e) => onChange(sectionId, "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Subtitle / Tagline</Label>
          <Input
            value={data.subtitle || "Official Community Publications"}
            placeholder="Official Community Publications"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
            onChange={(e) => onChange(sectionId, "subtitle", e.target.value)}
          />
        </div>
      </div>

      {/* Newsletter Publications List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Active Publications ({items.length})
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newItem = {
                id: `s-${Date.now()}`,
                title: "New Newsletter",
                date: "2024",
                pdfUrl: "",
                issue: `Issue No. ${items.length + 1}`
              };
              onChange(sectionId, "items", [...items, newItem]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Publication
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  {item.date || `Issue #${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = items.filter((_, i) => i !== idx);
                    onChange(sectionId, "items", updated);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove publication"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Title</Label>
                <Input
                  value={item.title || ""}
                  placeholder="e.g. Summer Newsletter 2024"
                  className="h-9 text-xs font-semibold rounded-lg bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10"
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], title: e.target.value };
                    onChange(sectionId, "items", updated);
                  }}
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Period / Season</Label>
                <Input
                  value={item.date || ""}
                  placeholder="e.g. Summer 2024"
                  className="h-8 text-xs rounded-lg bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10"
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], date: e.target.value };
                    onChange(sectionId, "items", updated);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">PDF File URL</Label>
                  {item.pdfUrl && (
                    <a
                      href={item.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Test / View
                    </a>
                  )}
                </div>
                <Input
                  value={item.pdfUrl || ""}
                  placeholder="https://... or /newsletters/..."
                  className="h-8 text-xs font-mono rounded-lg bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10"
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], pdfUrl: e.target.value };
                    onChange(sectionId, "items", updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderJobPostingsSection(
  sectionId: string,
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const jobs: any[] = data.jobs || data.items || [];

  return (
    <div className="space-y-5">
      {/* Global Component Master Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white/70 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-white/[0.02] border border-indigo-200/80 dark:border-indigo-800/60 backdrop-blur-xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Global Component
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/20 backdrop-blur-xs">
                  Global Components &gt; Job Postings &amp; Vacancies
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-xl leading-relaxed">
                This component manages current job vacancies, position descriptions, attached PDF documents, and application portal links across the website.
              </p>
            </div>
          </div>

          <Link
            href="/cms/job-postings"
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all hover:shadow-md"
          >
            <Sliders size={15} /> Edit All Job Postings <ExternalLink size={14} />
          </Link>
        </div>

        {/* Live Preview / Quick Overview */}
        <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white/70 dark:bg-white/[0.04] p-3 rounded-xl border border-indigo-100/80 dark:border-white/10 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Section Heading</span>
            <p className="font-semibold text-gray-800 dark:text-white truncate">
              {data.heading || "Current Job Postings"}
            </p>
          </div>

          <div className="bg-white/70 dark:bg-white/[0.04] p-3 rounded-xl border border-indigo-100/80 dark:border-white/10 backdrop-blur-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Active Positions</span>
              <p className="font-semibold text-gray-800 dark:text-white">
                {jobs.length > 0 ? `${jobs.length} Positions Configured` : "Managed in Global Component"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Headings */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Heading</Label>
          <Input
            value={data.heading || "Current Job Postings"}
            placeholder="Current Job Postings"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
            onChange={(e) => onChange(sectionId, "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Subtitle / Tagline</Label>
          <Input
            value={data.subtitle || "Join Our Professional Team"}
            placeholder="Join Our Professional Team"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
            onChange={(e) => onChange(sectionId, "subtitle", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function renderGallerySection(
  sectionId: string,
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const images: any[] = data.images || data.gallery || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Gallery Heading</Label>
          <Input
            value={data.heading || data.title || ""}
            placeholder="Community Gallery / Moments"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange(sectionId, "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Subtitle</Label>
          <Input
            value={data.subtitle || ""}
            placeholder="Moments from our programs, gatherings, and workshops"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange(sectionId, "subtitle", e.target.value)}
          />
        </div>
      </div>

      {/* Images List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Gallery Images ({images.length})
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newImg = typeof images[0] === "string" 
                ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80" 
                : { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80", alt: "Community Gallery" };
              onChange(sectionId, "images", [...images, newImg]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Image
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imgItem, idx) => {
            const imgUrl = typeof imgItem === "string" ? imgItem : imgItem.url || "";
            return (
              <div key={idx} className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">Image #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = images.filter((_, i) => i !== idx);
                      onChange(sectionId, "images", updated);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <ImagePicker
                  value={imgUrl}
                  onChange={(url) => {
                    const updated = [...images];
                    if (typeof imgItem === "string") {
                      updated[idx] = url;
                    } else {
                      updated[idx] = { ...imgItem, url };
                    }
                    onChange(sectionId, "images", updated);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderWhyWeWorkDifferently(
  data: any,
  onChange: (secId: string, field: string, val: any) => void,
  onAddItem?: (secId: string, itemType?: string) => void,
  onDeleteItem?: (secId: string, idx: number, itemType?: string) => void,
  onItemChange?: (secId: string, idx: number, field: string, val: any, itemType?: string) => void
) {
  const statCards: any[] = data.statCards || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title / Heading</Label>
          <Input
            value={data.heading || ""}
            placeholder="Why do we have to work differently at KMFW?"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("whyWeWorkDifferently", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Stats Section Title</Label>
          <Input
            value={data.statsTitle || ""}
            placeholder="Black Population Growth in Waterloo"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("whyWeWorkDifferently", "statsTitle", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Main Narrative / Body Text</Label>
        <RichTextEditor
          value={data.bodyText || ""}
          placeholder="Enter the background narrative explaining why culturally-adapted care is essential..."
          onChange={(val) => onChange("whyWeWorkDifferently", "bodyText", val)}
        />
      </div>

      {/* Featured Quote Box */}
      <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Executive / Testimonial Quote
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Quote Text</Label>
            <Input
              value={data.quote || ""}
              placeholder="Quote text..."
              className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
              onChange={(e) => onChange("whyWeWorkDifferently", "quote", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Author Name</Label>
            <Input
              value={data.quoteAuthor || ""}
              placeholder="e.g. Dr. Sarah Jenkins"
              className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
              onChange={(e) => onChange("whyWeWorkDifferently", "quoteAuthor", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Author Title / Affiliation</Label>
            <Input
              value={data.quoteAuthorTitle || ""}
              placeholder="e.g. Lead Mental Health Clinician"
              className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
              onChange={(e) => onChange("whyWeWorkDifferently", "quoteAuthorTitle", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Regional Stats Comparison */}
      <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Two-Point Demographic Comparison
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-3">
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Baseline Year & Label</Label>
              <Input
                value={data.stat2016Label || ""}
                placeholder="e.g. 2016 Census Baseline"
                className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("whyWeWorkDifferently", "stat2016Label", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Baseline Value</Label>
              <Input
                value={data.stat2016Value || ""}
                placeholder="e.g. 15,110 (2.9%)"
                className="h-10 text-xs font-bold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("whyWeWorkDifferently", "stat2016Value", e.target.value)}
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-3">
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Recent Year & Label</Label>
              <Input
                value={data.stat2021Label || ""}
                placeholder="e.g. 2021 Census Update"
                className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("whyWeWorkDifferently", "stat2021Label", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Recent Value</Label>
              <Input
                value={data.stat2021Value || ""}
                placeholder="e.g. 26,565 (4.8%)"
                className="h-10 text-xs font-bold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("whyWeWorkDifferently", "stat2021Value", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2025-2026 Impact Reach Metrics (Client Item 9) */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/[0.04] backdrop-blur-xl shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          2025–2026 Community Reach Metrics (Item 9 & 11)
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-white/5 border border-primary/15 space-y-2">
            <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Metric #1 (e.g. 2,500+)</Label>
            <Input
              value={data.impact2025_metric1 || "2,500+"}
              placeholder="2,500+"
              className="h-9 text-xs font-bold rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_metric1", e.target.value)}
            />
            <Input
              value={data.impact2025_label1 || "Individuals & Families Supported"}
              placeholder="Individuals & Families Supported"
              className="h-8 text-[11px] rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_label1", e.target.value)}
            />
          </div>
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-white/5 border border-primary/15 space-y-2">
            <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Metric #2 (e.g. 500+)</Label>
            <Input
              value={data.impact2025_metric2 || "500+"}
              placeholder="500+"
              className="h-9 text-xs font-bold rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_metric2", e.target.value)}
            />
            <Input
              value={data.impact2025_label2 || "Clinical & Community Sessions"}
              placeholder="Clinical & Community Sessions"
              className="h-8 text-[11px] rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_label2", e.target.value)}
            />
          </div>
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-white/5 border border-primary/15 space-y-2">
            <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Metric #3 (e.g. 150+)</Label>
            <Input
              value={data.impact2025_metric3 || "150+"}
              placeholder="150+"
              className="h-9 text-xs font-bold rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_metric3", e.target.value)}
            />
            <Input
              value={data.impact2025_label3 || "Psychoeducation Workshops"}
              placeholder="Psychoeducation Workshops"
              className="h-8 text-[11px] rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_label3", e.target.value)}
            />
          </div>
          <div className="p-3.5 rounded-xl bg-white/70 dark:bg-white/5 border border-primary/15 space-y-2">
            <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Metric #4 (e.g. 35+)</Label>
            <Input
              value={data.impact2025_metric4 || "35+"}
              placeholder="35+"
              className="h-9 text-xs font-bold rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_metric4", e.target.value)}
            />
            <Input
              value={data.impact2025_label4 || "Collaborative Partnerships"}
              placeholder="Collaborative Partnerships"
              className="h-8 text-[11px] rounded-lg bg-white/70 dark:bg-white/5 border-gray-200 dark:border-white/10"
              onChange={(e) => onChange("whyWeWorkDifferently", "impact2025_label4", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Repeatable Stat Cards List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Regional Evidence Cards ({statCards.length})
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const updated = [...statCards, { stat: "0%", text: "Describe statistic context...", color: "#e8f5e9" }];
              onChange("whyWeWorkDifferently", "statCards", updated);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Stat Card
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {statCards.map((card, idx) => (
            <div 
              key={idx} 
              className="relative p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-200 space-y-4 group overflow-hidden"
            >
              {/* Subtle frosted glass ambient accent gradient */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-30"
                style={{ backgroundColor: card.color || "#e8f5e9" }}
              />

              {/* Card Header Bar */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300 backdrop-blur-sm border border-black/5 dark:border-white/5">
                    Stat Card #{idx + 1}
                  </span>
                  {card.stat && (
                    <span 
                      className="px-2 py-0.5 rounded-md text-xs font-bold text-gray-800 dark:text-white"
                      style={{ backgroundColor: `${card.color || '#e8f5e9'}40`, border: `1px solid ${card.color || '#e8f5e9'}80` }}
                    >
                      {card.stat}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = statCards.filter((_, i) => i !== idx);
                    onChange("whyWeWorkDifferently", "statCards", updated);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Remove card"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Aligned Grid: Percentage & Accent Color */}
              <div className="grid grid-cols-12 gap-3 relative z-10">
                <div className="col-span-5">
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Metric / Figure</Label>
                  <Input
                    value={card.stat || ""}
                    placeholder="e.g. 16.7%"
                    className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                    onChange={(e) => {
                      const updated = [...statCards];
                      updated[idx] = { ...updated[idx], stat: e.target.value };
                      onChange("whyWeWorkDifferently", "statCards", updated);
                    }}
                  />
                </div>
                <div className="col-span-7">
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={card.color && card.color.startsWith("#") ? card.color : "#e8f5e9"}
                        onChange={(e) => {
                          const updated = [...statCards];
                          updated[idx] = { ...updated[idx], color: e.target.value };
                          onChange("whyWeWorkDifferently", "statCards", updated);
                        }}
                        className="w-10 h-10 rounded-xl border border-gray-200/80 dark:border-white/10 cursor-pointer p-0.5 bg-white/60 dark:bg-white/5 shadow-xs"
                      />
                    </div>
                    <Input
                      value={card.color || "#e8f5e9"}
                      placeholder="#e8f5e9"
                      className="h-10 text-xs font-mono rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                      onChange={(e) => {
                        const updated = [...statCards];
                        updated[idx] = { ...updated[idx], color: e.target.value };
                        onChange("whyWeWorkDifferently", "statCards", updated);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Citation & Context Textarea */}
              <div className="relative z-10">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Citation & Explanation</Label>
                <textarea
                  rows={3}
                  value={card.text || ""}
                  placeholder="Describe the regional findings, census reference, or community metric..."
                  onChange={(e) => {
                    const updated = [...statCards];
                    updated[idx] = { ...updated[idx], text: e.target.value };
                    onChange("whyWeWorkDifferently", "statCards", updated);
                  }}
                  className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderCoreFoundations(
  data: any,
  onChange: (secId: string, field: string, val: any) => void,
  onAddItem?: (secId: string, itemType?: string) => void,
  onDeleteItem?: (secId: string, idx: number, itemType?: string) => void,
  onItemChange?: (secId: string, idx: number, field: string, val: any, itemType?: string) => void
) {
  const items: any[] = data.items || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Section Heading</Label>
          <Input
            value={data.heading || ""}
            placeholder="Our Core Foundations"
            onChange={(e) => onChange("coreFoundations", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Input
            value={data.subtitle || ""}
            placeholder="Comprehensive culturally-grounded support tailored..."
            onChange={(e) => onChange("coreFoundations", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Foundation Pillars ({items.length})
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const updated = [...items, { title: "New Pillar", desc: "Description...", icon: "Heart", link: "/services" }];
              onChange("coreFoundations", "items", updated);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Foundation Card
          </Button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all duration-200 space-y-4 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300 backdrop-blur-sm border border-black/5 dark:border-white/5">
                  Pillar #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = items.filter((_, i) => i !== idx);
                    onChange("coreFoundations", "items", updated);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Remove pillar"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Pillar Title</Label>
                  <Input
                    value={item.title || ""}
                    placeholder="e.g. Programs & Services"
                    className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      onChange("coreFoundations", "items", updated);
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Icon</Label>
                    <select
                      value={item.icon || "Heart"}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx] = { ...updated[idx], icon: e.target.value };
                        onChange("coreFoundations", "items", updated);
                      }}
                      className="h-10 w-full text-xs font-medium rounded-xl border border-gray-200/80 dark:border-white/10 px-3 bg-white/60 dark:bg-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Heart">Heart</option>
                      <option value="Users">Users</option>
                      <option value="Calendar">Calendar</option>
                      <option value="Sparkles">Sparkles</option>
                      <option value="Shield">Shield</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Link URL</Label>
                    <Input
                      value={item.link || ""}
                      placeholder="e.g. /services"
                      className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                      onChange={(e) => {
                        const updated = [...items];
                        updated[idx] = { ...updated[idx], link: e.target.value };
                        onChange("coreFoundations", "items", updated);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Description</Label>
                  <textarea
                    rows={3}
                    value={item.desc || ""}
                    placeholder="Short summary of this foundation pillar..."
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx] = { ...updated[idx], desc: e.target.value };
                      onChange("coreFoundations", "items", updated);
                    }}
                    className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderMindfulness(
  data: any,
  onChange: (secId: string, field: string, val: any) => void,
  onAddItem?: (secId: string, itemType?: string) => void,
  onDeleteItem?: (secId: string, idx: number, itemType?: string) => void,
  onItemChange?: (secId: string, idx: number, field: string, val: any, itemType?: string) => void
) {
  const imageUrl = data?.images?.[0]?.url || "";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Section Heading</Label>
          <Input
            value={data.heading || ""}
            placeholder="Mindful Wellness, Deeply Rooted."
            onChange={(e) => onChange("mindfulness", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label>Video URL (YouTube or MP4 optional)</Label>
          <Input
            value={data.videoUrl || ""}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(e) => onChange("mindfulness", "videoUrl", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Background Image</Label>
        <ImagePicker
          value={imageUrl}
          onChange={(url) => {
            onChange("mindfulness", "images", [{ url, alt: data.heading || "Mindfulness" }]);
          }}
        />
      </div>

      <div>
        <Label>Content Body</Label>
        <RichTextEditor
          value={data.content || ""}
          placeholder="Describe the mindfulness philosophy and approaches..."
          onChange={(val) => onChange("mindfulness", "content", val)}
        />
      </div>
    </div>
  );
}

function renderMission(data: any, onChange: (secId: string, field: string, val: any) => void) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Category / Pill Badge</Label>
          <Input
            value={data.badge || ""}
            placeholder="Our Mandate"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("mission", "badge", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Mission & Mandate Heading</Label>
          <Input
            value={data.heading || ""}
            placeholder="Our Mission & Mandate"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("mission", "heading", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Mandate Narrative / Statement</Label>
        <RichTextEditor
          value={data.content || ""}
          placeholder="Enter the complete mandate and mission statement..."
          onChange={(val) => onChange("mission", "content", val)}
        />
        <p className="text-xs text-gray-400 mt-1.5">
          This text appears immediately below the Awards Ticker and above Mindfulness / Values on the live home page.
        </p>
      </div>
    </div>
  );
}

const DEFAULT_KMFW_TESTIMONIALS = [
  {
    quote: "Finding Kind Minds Family Wellness felt like exhaling after holding my breath for months. Having a therapist who inherently understands our culture transformed the way our entire household communicates and heals.",
    author: "Sarah & Marcus",
    role: "Parents of two, Kitchener"
  },
  {
    quote: "The environment is profoundly warm and affirming. My teenager genuinely looks forward to their weekly sessions, which is something we never experienced in conventional healthcare settings.",
    author: "David K.",
    role: "Family Caregiver, Waterloo"
  },
  {
    quote: "Kind Minds Family Wellness does not merely provide services; they provide dignity and renewed hope. The culturally grounded clarity and authentic empathy in their approach is completely unmatched.",
    author: "Elena M.",
    role: "Community Member & Program Participant"
  },
  {
    quote: "Navigating educational and child welfare systems as a Black mother felt completely isolating until KMFW stepped in with systemic advocacy, professional psychoeducation, and unwavering care.",
    author: "Amina T.",
    role: "Mother & Community Advocate, Cambridge"
  },
  {
    quote: "Participating in the seniors gathering and intergenerational circles restored my sense of community belonging. We are seen, our stories are respected, and our wisdom is honored.",
    author: "Elder Joseph",
    role: "Seniors Program Participant"
  },
  {
    quote: "The Afrocentric counselling sessions gave me the psychological safety to confront intergenerational trauma without ever needing to justify or explain my identity.",
    author: "Kendra B.",
    role: "Young Adult Professional"
  }
];

function renderTestimonials(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const rawItems = data?.items;
  // If only 1 legacy item or empty, sync with the full 6-story authentic roster
  const items: any[] = (Array.isArray(rawItems) && rawItems.length > 2)
    ? rawItems
    : DEFAULT_KMFW_TESTIMONIALS;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || ""}
            placeholder="Stories from Our Families"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10"
            onChange={(e) => onChange("testimonials", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle</Label>
          <Input
            value={data.subtitle || ""}
            placeholder="Real experiences from individuals and families..."
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10"
            onChange={(e) => onChange("testimonials", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Family Narratives & Stories ({items.length})
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const updated = [
                ...items,
                {
                  quote: "Describe the authentic healing experience or testimonial here...",
                  author: "Community Member",
                  role: "Parent / Youth, Waterloo"
                }
              ];
              onChange("testimonials", "items", updated);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Story
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-primary/10 text-primary">
                  Story #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = items.filter((_, i) => i !== idx);
                    onChange("testimonials", "items", updated);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Remove story"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Story / Testimonial Quote</Label>
                <textarea
                  rows={3}
                  value={item.quote || item.content || ""}
                  placeholder="Enter the quote or testimonial..."
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], quote: e.target.value };
                    onChange("testimonials", "items", updated);
                  }}
                  className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Author Name</Label>
                  <Input
                    value={item.author || item.name || ""}
                    placeholder="e.g. Sarah & Marcus"
                    className="h-9 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10"
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx] = { ...updated[idx], author: e.target.value };
                      onChange("testimonials", "items", updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Role / Location</Label>
                  <Input
                    value={item.role || item.location || ""}
                    placeholder="e.g. Parents of two, Kitchener"
                    className="h-9 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10"
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx] = { ...updated[idx], role: e.target.value };
                      onChange("testimonials", "items", updated);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderGenericSection(
  sectionId: string,
  data: any,
  onChange: (secId: string, field: string, val: any) => void,
  onAddItem?: (secId: string, itemType?: string) => void,
  onDeleteItem?: (secId: string, idx: number, itemType?: string) => void,
  onItemChange?: (secId: string, idx: number, field: string, val: any, itemType?: string) => void
) {
  const items: any[] = data.items || data.slides || data.pillars || data.steps || data.cards || data.facts || data.resources || [];
  const targetArrayKey = data.cards ? "cards" : (data.facts ? "facts" : (data.resources ? "resources" : (data.items ? "items" : (data.slides ? "slides" : "items"))));
  const hasImage = typeof data.imageUrl === "string" || typeof data.image === "string" || Array.isArray(data.images);
  const currentImg = data.imageUrl || data.image || data.images?.[0]?.url || "";

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Heading / Title</Label>
          <Input
            value={data.heading || data.title || ""}
            placeholder="Section Heading..."
            onChange={(e) => onChange(sectionId, data.heading !== undefined ? "heading" : "title", e.target.value)}
          />
        </div>
        <div>
          <Label>Subtitle / Tagline</Label>
          <Input
            value={data.subtitle || data.subheading || data.badge || ""}
            placeholder="Subheading or badge text..."
            onChange={(e) => onChange(sectionId, data.subtitle !== undefined ? "subtitle" : "subheading", e.target.value)}
          />
        </div>
      </div>

      {/* Description / Content Rich Text */}
      <div>
        <Label>Section Body Content</Label>
        <RichTextEditor
          value={data.content || data.bodyText || data.body || data.description || ""}
          placeholder="Enter section description..."
          onChange={(val) => {
            const fieldKey = data.content !== undefined ? "content" : (data.bodyText !== undefined ? "bodyText" : "description");
            onChange(sectionId, fieldKey, val);
          }}
        />
      </div>

      {/* Optional Featured Image */}
      {(hasImage || currentImg) && (
        <div>
          <Label>Featured Image / Banner</Label>
          <ImagePicker
            value={currentImg}
            onChange={(url) => {
              if (Array.isArray(data.images)) {
                onChange(sectionId, "images", [{ url, alt: data.heading || sectionId }]);
              } else if (data.imageUrl !== undefined) {
                onChange(sectionId, "imageUrl", url);
              } else {
                onChange(sectionId, "image", url);
              }
            }}
          />
        </div>
      )}

      {/* Repeatable Items (if any) */}
      {Array.isArray(items) && items.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Section Items ({items.length})
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const targetKey = Array.isArray(data.cards) ? "cards" : (Array.isArray(data.facts) ? "facts" : (Array.isArray(data.resources) ? "resources" : (Array.isArray(data.slides) ? "slides" : (Array.isArray(data.pillars) ? "pillars" : "items"))));
                const newItem = { title: "New Item", description: "Item description..." };
                onChange(sectionId, targetKey, [...items, newItem]);
              }}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus size={14} /> Add Item
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((rawItem, idx) => {
              const isString = typeof rawItem === "string";
              const item = isString ? { title: rawItem, desc: "" } : (rawItem || {});

              return (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all duration-200 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300 backdrop-blur-sm border border-black/5 dark:border-white/5">
                      Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetKey = Array.isArray(data.cards) ? "cards" : (Array.isArray(data.facts) ? "facts" : (Array.isArray(data.resources) ? "resources" : (Array.isArray(data.slides) ? "slides" : (Array.isArray(data.pillars) ? "pillars" : "items"))));
                        const updated = items.filter((_, i) => i !== idx);
                        onChange(sectionId, targetKey, updated);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Title / Headline</Label>
                      <Input
                        value={item.title || item.heading || item.name || item.stat || ""}
                        placeholder="Title or Stat..."
                        className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                        onChange={(e) => {
                          const targetKey = Array.isArray(data.cards) ? "cards" : (Array.isArray(data.facts) ? "facts" : (Array.isArray(data.resources) ? "resources" : (Array.isArray(data.slides) ? "slides" : (Array.isArray(data.pillars) ? "pillars" : "items"))));
                          const updated = [...items];
                          if (isString) {
                            updated[idx] = e.target.value;
                          } else {
                            const titleKey = item.stat !== undefined ? "stat" : (item.title !== undefined ? "title" : (item.heading !== undefined ? "heading" : "name"));
                            updated[idx] = { ...updated[idx], [titleKey]: e.target.value };
                          }
                          onChange(sectionId, targetKey, updated);
                        }}
                      />
                    </div>

                    {!isString && (
                      <>
                        <div>
                          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Description / Subtext</Label>
                          <textarea
                            rows={3}
                            value={item.desc || item.description || item.subtitle || item.text || ""}
                            placeholder="Description or context..."
                            onChange={(e) => {
                              const targetKey = Array.isArray(data.cards) ? "cards" : (Array.isArray(data.facts) ? "facts" : (Array.isArray(data.resources) ? "resources" : (Array.isArray(data.slides) ? "slides" : (Array.isArray(data.pillars) ? "pillars" : "items"))));
                              const updated = [...items];
                              const descKey = item.text !== undefined ? "text" : (item.desc !== undefined ? "desc" : "description");
                              updated[idx] = { ...updated[idx], [descKey]: e.target.value };
                              onChange(sectionId, targetKey, updated);
                            }}
                            className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Icon Name</Label>
                            <Input
                              value={item.icon || ""}
                              placeholder="e.g. Heart, Users, Star"
                              className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                              onChange={(e) => {
                                const targetKey = Array.isArray(data.cards) ? "cards" : (Array.isArray(data.facts) ? "facts" : (Array.isArray(data.resources) ? "resources" : (Array.isArray(data.slides) ? "slides" : (Array.isArray(data.pillars) ? "pillars" : "items"))));
                                const updated = [...items];
                                updated[idx] = { ...updated[idx], icon: e.target.value };
                                onChange(sectionId, targetKey, updated);
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Link or Tag</Label>
                            <Input
                              value={item.link || item.tag || item.action || ""}
                              placeholder="e.g. /services or Tag"
                              className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                              onChange={(e) => {
                                const targetKey = Array.isArray(data.cards) ? "cards" : (Array.isArray(data.facts) ? "facts" : (Array.isArray(data.resources) ? "resources" : (Array.isArray(data.slides) ? "slides" : (Array.isArray(data.pillars) ? "pillars" : "items"))));
                                const updated = [...items];
                                const key = item.link !== undefined ? "link" : (item.tag !== undefined ? "tag" : "link");
                                updated[idx] = { ...updated[idx], [key]: e.target.value };
                                onChange(sectionId, targetKey, updated);
                              }}
                            />
                          </div>
                        </div>

                        {(item.image || item.imageUrl) && (
                          <div className="pt-1">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Image</Label>
                            <ImagePicker
                              value={item.image || item.imageUrl || ""}
                              onChange={(url) => {
                                const targetKey = Array.isArray(data.cards) ? "cards" : (Array.isArray(data.facts) ? "facts" : (Array.isArray(data.resources) ? "resources" : (Array.isArray(data.slides) ? "slides" : (Array.isArray(data.pillars) ? "pillars" : "items"))));
                                const updated = [...items];
                                const imgKey = item.imageUrl ? "imageUrl" : "image";
                                updated[idx] = { ...updated[idx], [imgKey]: url };
                                onChange(sectionId, targetKey, updated);
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional CTA Button */}
      {(data.buttonText !== undefined || data.buttonUrl !== undefined || data.cta !== undefined || data.link !== undefined) && (
        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <Label>Button Label</Label>
            <Input
              value={data.buttonText || data.cta || ""}
              placeholder="e.g. Learn More / Contact Us"
              onChange={(e) => {
                const key = data.buttonText !== undefined ? "buttonText" : "cta";
                onChange(sectionId, key, e.target.value);
              }}
            />
          </div>
          <div>
            <Label>Button Destination URL</Label>
            <Input
              value={data.buttonUrl || data.link || ""}
              placeholder="e.g. /contact"
              onChange={(e) => {
                const key = data.buttonUrl !== undefined ? "buttonUrl" : "link";
                onChange(sectionId, key, e.target.value);
              }}
            />
          </div>
        </div>
      )}

      {/* Optional Stats / Badges */}
      {Array.isArray(data.stats) && data.stats.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Badge & Stats ({data.stats.length})
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const updated = [...(data.stats || []), { value: "New Stat", label: "Supporting description..." }];
                onChange(sectionId, "stats", updated);
              }}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus size={14} /> Add Stat
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.stats.map((st: any, sIdx: number) => (
              <div key={sIdx} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500">Stat #{sIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = data.stats.filter((_: any, i: number) => i !== sIdx);
                      onChange(sectionId, "stats", updated);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Stat Value</Label>
                    <Input
                      value={st.value || ""}
                      placeholder="e.g. 10+ Years"
                      onChange={(e) => {
                        const updated = [...data.stats];
                        updated[sIdx] = { ...updated[sIdx], value: e.target.value };
                        onChange(sectionId, "stats", updated);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Stat Label</Label>
                    <Input
                      value={st.label || ""}
                      placeholder="e.g. Supporting families"
                      onChange={(e) => {
                        const updated = [...data.stats];
                        updated[sIdx] = { ...updated[sIdx], label: e.target.value };
                        onChange(sectionId, "stats", updated);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderUnderstandingSuicide(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const cards: any[] = data.cards || [];

  return (
    <div className="space-y-6">
      {/* Section Header Controls */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Section Title</Label>
          <Input
            value={data.heading || data.title || "Understanding Suicide"}
            placeholder="Understanding Suicide"
            onChange={(e) => onChange("understanding", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label>Section Subtitle / Tagline</Label>
          <Input
            value={data.subtitle || ""}
            placeholder="Warning signs, risk factors, and community action"
            onChange={(e) => onChange("understanding", "subtitle", e.target.value)}
          />
        </div>
      </div>

      {/* Interactive Awareness Cards Header */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Sticky Awareness Cards ({cards.length})
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Interactive stacking cards rendered on the home page with full images, descriptions, and linked bullet points.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const newCard = {
              id: String(Date.now()),
              title: "New Awareness Topic",
              description: "Brief explanatory overview of this topic...",
              backgroundColor: "#46C3CC",
              imageUrl: "",
              isActive: true,
              items: [
                { text: "Key point or warning signal", link: "" }
              ]
            };
            onChange("understanding", "cards", [...cards, newCard]);
          }}
          className="flex items-center gap-1.5 text-xs"
        >
          <Plus size={14} /> Add Awareness Card
        </Button>
      </div>

      {/* Cards List */}
      <div className="space-y-6">
        {cards.map((card, cardIdx) => {
          const cardItems: any[] = card.items || [];
          const cardBg = card.backgroundColor || (card.id === '1' ? "#46C3CC" : card.id === '2' ? "#DCE4EA" : "#AACD3A");

          return (
            <div
              key={card.id || cardIdx}
              className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-5"
            >
              {/* Card Header & Remove Button */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-xs inline-block"
                    style={{ backgroundColor: cardBg }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Awareness Card #{cardIdx + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = cards.filter((_, i) => i !== cardIdx);
                    onChange("understanding", "cards", updated);
                  }}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Remove card"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Title & Accent Color */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label>Card Question / Title</Label>
                  <Input
                    value={card.title || ""}
                    placeholder="e.g. What are the warning signs?"
                    onChange={(e) => {
                      const updated = [...cards];
                      updated[cardIdx] = { ...updated[cardIdx], title: e.target.value };
                      onChange("understanding", "cards", updated);
                    }}
                  />
                </div>
                <div>
                  <Label>Card Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardBg.startsWith("#") ? cardBg : "#46C3CC"}
                      onChange={(e) => {
                        const updated = [...cards];
                        updated[cardIdx] = { ...updated[cardIdx], backgroundColor: e.target.value };
                        onChange("understanding", "cards", updated);
                      }}
                      className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer p-0.5"
                    />
                    <Input
                      value={card.backgroundColor || cardBg}
                      placeholder="#46C3CC"
                      onChange={(e) => {
                        const updated = [...cards];
                        updated[cardIdx] = { ...updated[cardIdx], backgroundColor: e.target.value };
                        onChange("understanding", "cards", updated);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Description Paragraph */}
              <div>
                <Label>Introductory Paragraph</Label>
                <textarea
                  rows={3}
                  value={card.description || ""}
                  placeholder="People who die by suicide usually show some indication of warning before their deaths..."
                  onChange={(e) => {
                    const updated = [...cards];
                    updated[cardIdx] = { ...updated[cardIdx], description: e.target.value };
                    onChange("understanding", "cards", updated);
                  }}
                  className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 p-3 bg-transparent dark:text-white leading-relaxed"
                />
              </div>

              {/* Card Image */}
              <div>
                <Label>Card Featured Image (Right Side Banner)</Label>
                <ImagePicker
                  value={card.imageUrl || ""}
                  onChange={(url) => {
                    const updated = [...cards];
                    updated[cardIdx] = { ...updated[cardIdx], imageUrl: url };
                    onChange("understanding", "cards", updated);
                  }}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Leave blank to use default static asset for this card.
                </p>
              </div>

              {/* Bullet Points with Links */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Interactive Bullet Points & External Links ({cardItems.length})</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...cards];
                      const newItems = [...cardItems, { text: "New warning sign or action item", link: "" }];
                      updated[cardIdx] = { ...updated[cardIdx], items: newItems };
                      onChange("understanding", "cards", updated);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Bullet Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {cardItems.map((rawItem: any, itemIdx: number) => {
                    const item = typeof rawItem === "string" ? { text: rawItem, link: "" } : rawItem;

                    return (
                      <div
                        key={itemIdx}
                        className="p-3 rounded-xl border border-gray-200/60 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center gap-2.5"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <Input
                            value={item.text || ""}
                            placeholder="Bullet point text (e.g. Talking about wanting to die)..."
                            className="h-9 text-xs rounded-lg bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                            onChange={(e) => {
                              const updated = [...cards];
                              const newItems = [...cardItems];
                              newItems[itemIdx] = { ...item, text: e.target.value };
                              updated[cardIdx] = { ...updated[cardIdx], items: newItems };
                              onChange("understanding", "cards", updated);
                            }}
                          />
                        </div>
                        <div className="w-full sm:w-64">
                          <Input
                            value={item.link || ""}
                            placeholder="External URL (optional)..."
                            className="h-9 text-xs rounded-lg bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                            onChange={(e) => {
                              const updated = [...cards];
                              const newItems = [...cardItems];
                              newItems[itemIdx] = { ...item, link: e.target.value };
                              updated[cardIdx] = { ...updated[cardIdx], items: newItems };
                              onChange("understanding", "cards", updated);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...cards];
                            const newItems = cardItems.filter((_, i) => i !== itemIdx);
                            updated[cardIdx] = { ...updated[cardIdx], items: newItems };
                            onChange("understanding", "cards", updated);
                          }}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 shrink-0 self-end sm:self-center transition-colors"
                          title="Remove bullet point"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderNspcCoping(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const resources: any[] = data.resources || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || "Coping with Suicide Loss"}
            placeholder="Coping with Suicide Loss"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("coping", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle / Description</Label>
          <Input
            value={data.subtitle || ""}
            placeholder="Postvention refers to the actions and support provided..."
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("coping", "subtitle", e.target.value)}
          />
        </div>
      </div>

      {/* Left Teal Info Banner */}
      <div className="p-5 rounded-2xl border border-teal-200/70 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20 backdrop-blur-xl shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          Left Info Callout Card
        </h4>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Card Heading</Label>
            <Input
              value={data.infoCardTitle || "Programs, Groups & Counselling"}
              placeholder="Programs, Groups & Counselling"
              className="h-10 text-xs font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-teal-500/20 backdrop-blur-sm"
              onChange={(e) => onChange("coping", "infoCardTitle", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Card Body Text</Label>
            <textarea
              rows={2}
              value={data.infoCardContent || ""}
              placeholder="A postvention is an intervention conducted after a suicide..."
              onChange={(e) => onChange("coping", "infoCardContent", e.target.value)}
              className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-2.5 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Bereavement Support Accordion Items */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Postvention & Bereavement Resources ({resources.length})
            </h4>
            <p className="text-[11px] text-gray-500">Interactive accordion items shown on the right side of the section.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newItem = {
                id: String(Date.now()),
                title: "New Support Organization",
                subtitle: "(905) 000-0000",
                content: "Describe support services, contact hours, and locations...",
                icon: "heart-outline",
                link: "",
                isActive: true
              };
              onChange("coping", "resources", [...resources, newItem]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Resource Item
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {resources.map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">Item #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = resources.filter((_, i) => i !== idx);
                    onChange("coping", "resources", updated);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Organization / Service Name</Label>
                <Input
                  value={item.title || ""}
                  placeholder="e.g. Hospice Niagara Grief Support"
                  className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...resources];
                    updated[idx] = { ...updated[idx], title: e.target.value };
                    onChange("coping", "resources", updated);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Phone / Contact Tag</Label>
                  <Input
                    value={item.subtitle || ""}
                    placeholder="e.g. (905) 984-8766"
                    className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], subtitle: e.target.value };
                      onChange("coping", "resources", updated);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Icon Style</Label>
                  <select
                    value={item.icon || "heart-outline"}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], icon: e.target.value };
                      onChange("coping", "resources", updated);
                    }}
                    className="h-10 w-full text-xs font-medium rounded-xl border border-gray-200/80 dark:border-white/10 px-3 bg-white/60 dark:bg-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="heart-outline">Heart</option>
                    <option value="people-outline">Users</option>
                    <option value="cafe-outline">Coffee</option>
                    <option value="medkit-outline">Medical Cross</option>
                    <option value="call-outline">Phone Call</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Full Description & Contact Details</Label>
                <textarea
                  rows={3}
                  value={item.content || ""}
                  placeholder="Service description..."
                  onChange={(e) => {
                    const updated = [...resources];
                    updated[idx] = { ...updated[idx], content: e.target.value };
                    onChange("coping", "resources", updated);
                  }}
                  className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderNspcCrisisSupport(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const resources: any[] = data.resources || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || "24/7 Crisis Support"}
            placeholder="24/7 Crisis Support"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("crisis_support", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle</Label>
          <Input
            value={data.subtitle || "Immediate help and emergency distress lines across Niagara"}
            placeholder="Immediate help and emergency distress lines across Niagara"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("crisis_support", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Crisis Helpline Grid Buttons ({resources.length})
            </h4>
            <p className="text-[11px] text-gray-500">Each button renders as a vibrant colored emergency card linking directly to hotlines.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newItem = {
                id: String(Date.now()),
                name: "New Crisis Hotline",
                color: "#00C2E0",
                link: "https://",
                isActive: true
              };
              onChange("crisis_support", "resources", [...resources, newItem]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Crisis Button
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">Button #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = resources.filter((_, i) => i !== idx);
                    onChange("crisis_support", "resources", updated);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Service / Line Name</Label>
                <Input
                  value={item.name || ""}
                  placeholder="e.g. 9-8-8 Suicide Crisis Helpline"
                  className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...resources];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    onChange("crisis_support", "resources", updated);
                  }}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Button Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={item.color && item.color.startsWith("#") ? item.color : "#00C2E0"}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], color: e.target.value };
                      onChange("crisis_support", "resources", updated);
                    }}
                    className="w-10 h-10 rounded-xl border border-gray-200/80 dark:border-white/10 cursor-pointer p-0.5 bg-white/60 dark:bg-white/5 shadow-xs"
                  />
                  <Input
                    value={item.color || "#00C2E0"}
                    placeholder="#00C2E0"
                    className="h-10 text-xs font-mono rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], color: e.target.value };
                      onChange("crisis_support", "resources", updated);
                    }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Direct Link URL</Label>
                <Input
                  value={item.link || ""}
                  placeholder="https://988.ca or tel:988"
                  className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...resources];
                    updated[idx] = { ...updated[idx], link: e.target.value };
                    onChange("crisis_support", "resources", updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderNspcPrograms(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const programs: any[] = data.programs || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || "Programs and Trainings"}
            placeholder="Programs and Trainings"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("programs", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle</Label>
          <Input
            value={data.subtitle || ""}
            placeholder="Suicide awareness training and life promotion programs"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("programs", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Training & Community Programs ({programs.length})
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newItem = {
                id: String(Date.now()),
                title: "New Training Program",
                description: "Describe curriculum, training partners, and who it's for...",
                link: "https://",
                imageUrl: "",
                isActive: true
              };
              onChange("programs", "programs", [...programs, newItem]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Program
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((prog, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">Program #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = programs.filter((_, i) => i !== idx);
                    onChange("programs", "programs", updated);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Program Title</Label>
                <Input
                  value={prog.title || ""}
                  placeholder="e.g. Suicide Awareness Training"
                  className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...programs];
                    updated[idx] = { ...updated[idx], title: e.target.value };
                    onChange("programs", "programs", updated);
                  }}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Program Logo / Banner</Label>
                <ImagePicker
                  value={prog.imageUrl || ""}
                  onChange={(url) => {
                    const updated = [...programs];
                    updated[idx] = { ...updated[idx], imageUrl: url };
                    onChange("programs", "programs", updated);
                  }}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Description</Label>
                <textarea
                  rows={3}
                  value={prog.description || ""}
                  placeholder="Program overview and training details..."
                  onChange={(e) => {
                    const updated = [...programs];
                    updated[idx] = { ...updated[idx], description: e.target.value };
                    onChange("programs", "programs", updated);
                  }}
                  className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">CTA Target Link</Label>
                <Input
                  value={prog.link || ""}
                  placeholder="https://..."
                  className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...programs];
                    updated[idx] = { ...updated[idx], link: e.target.value };
                    onChange("programs", "programs", updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderNspcResources(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const resources: any[] = data.resources || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || "Helpful Resources"}
            placeholder="Helpful Resources"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("resources", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle</Label>
          <Input
            value={data.subtitle || "Accessible training and tools to support life and prevent loss."}
            placeholder="Accessible training and tools to support life and prevent loss."
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("resources", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Downloadable Workbooks & Toolkits ({resources.length})
            </h4>
            <p className="text-[11px] text-gray-500">Horizontal carousel cards linking to PDF documents and community guides.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newItem = {
                id: String(Date.now()),
                title: "New Community Guide",
                description: "Resource summary and target audience...",
                type: "Guide",
                link: "https://",
                imageUrl: "",
                isActive: true
              };
              onChange("resources", "resources", [...resources, newItem]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Resource
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">Resource #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = resources.filter((_, i) => i !== idx);
                    onChange("resources", "resources", updated);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Resource Title</Label>
                <Input
                  value={item.title || ""}
                  placeholder="e.g. A Toolkit for People Impacted by a Suicide Loss"
                  className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...resources];
                    updated[idx] = { ...updated[idx], title: e.target.value };
                    onChange("resources", "resources", updated);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Badge Type</Label>
                  <select
                    value={item.type || "Guide"}
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], type: e.target.value };
                      onChange("resources", "resources", updated);
                    }}
                    className="h-10 w-full text-xs font-medium rounded-xl border border-gray-200/80 dark:border-white/10 px-3 bg-white/60 dark:bg-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Guide">Guide</option>
                    <option value="Toolkit">Toolkit</option>
                    <option value="Workbook">Workbook</option>
                    <option value="Report">Report</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">PDF / Document Link</Label>
                  <Input
                    value={item.link || ""}
                    placeholder="https://.../document.pdf"
                    className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                    onChange={(e) => {
                      const updated = [...resources];
                      updated[idx] = { ...updated[idx], link: e.target.value };
                      onChange("resources", "resources", updated);
                    }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Featured Cover Image</Label>
                <ImagePicker
                  value={item.imageUrl || ""}
                  onChange={(url) => {
                    const updated = [...resources];
                    updated[idx] = { ...updated[idx], imageUrl: url };
                    onChange("resources", "resources", updated);
                  }}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Description</Label>
                <textarea
                  rows={2}
                  value={item.description || ""}
                  placeholder="Overview of this guide..."
                  onChange={(e) => {
                    const updated = [...resources];
                    updated[idx] = { ...updated[idx], description: e.target.value };
                    onChange("resources", "resources", updated);
                  }}
                  className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderNspcFacts(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const facts: any[] = data.facts || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || "Suicide Prevention"}
            placeholder="Suicide Prevention"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("suicide_facts", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle</Label>
          <Input
            value={data.subtitle || "Know Your Facts"}
            placeholder="Know Your Facts"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("suicide_facts", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Prevention Fact Cards ({facts.length})
            </h4>
            <p className="text-[11px] text-gray-500">4-column masonry cards displaying national statistics and verified sources.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newItem = {
                id: String(Date.now()),
                text: "Add verified statistic or fact...",
                color: "green",
                source: "Statistics Canada",
                isActive: true
              };
              onChange("suicide_facts", "facts", [...facts, newItem]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Fact Card
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {facts.map((fact, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">Fact #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = facts.filter((_, i) => i !== idx);
                    onChange("suicide_facts", "facts", updated);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Color Palette</Label>
                <select
                  value={fact.color || "green"}
                  onChange={(e) => {
                    const updated = [...facts];
                    updated[idx] = { ...updated[idx], color: e.target.value };
                    onChange("suicide_facts", "facts", updated);
                  }}
                  className="h-10 w-full text-xs font-medium rounded-xl border border-gray-200/80 dark:border-white/10 px-3 bg-white/60 dark:bg-gray-900 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="green">Lime Green (Accent)</option>
                  <option value="purple">Soft Purple</option>
                  <option value="gray">Muted Gray</option>
                  <option value="beige">Warm Beige</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Statistic / Fact Copy</Label>
                <textarea
                  rows={4}
                  value={fact.text || ""}
                  placeholder="Every day in Canada..."
                  onChange={(e) => {
                    const updated = [...facts];
                    updated[idx] = { ...updated[idx], text: e.target.value };
                    onChange("suicide_facts", "facts", updated);
                  }}
                  className="w-full text-xs leading-relaxed rounded-xl border border-gray-200/80 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 dark:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-shadow"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Citation Source</Label>
                <Input
                  value={fact.source || ""}
                  placeholder="e.g. Statistics Canada"
                  className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...facts];
                    updated[idx] = { ...updated[idx], source: e.target.value };
                    onChange("suicide_facts", "facts", updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderNspcAbout(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const tabs: any[] = data.tabs || [
    {
      id: 'who_we_are',
      title: 'Who we are',
      content: '<p>The Niagara Suicide Prevention Coalition (NSPC) was formed in 2003 with a mandate to reduce suicidal behavior and its impact on individuals, families and communities across the Niagara region.</p>'
    },
    {
      id: 'our_mandate',
      title: 'Our Mandate',
      content: '<p>Our mandate is to identify community needs, create resources and build awareness, advocate for life promotion, and coordinate training across health and community partners.</p>'
    },
    {
      id: 'our_membership',
      title: 'Our Membership',
      content: '<p>We bring together representatives from health care, education, emergency services, community agencies, and individuals with lived and living experience.</p>'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || "About Us"}
            placeholder="About Us"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("about", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle</Label>
          <Input
            value={data.subtitle || "Our mandate, who we are, and community membership"}
            placeholder="Our mandate, who we are, and community membership"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("about", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          About Us Tabs Content (3 Pillars)
        </h4>
        <div className="grid sm:grid-cols-3 gap-4">
          {tabs.map((tab, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs space-y-3">
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tab Label</Label>
                <Input
                  value={tab.title || ""}
                  placeholder="e.g. Who we are"
                  className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...tabs];
                    updated[idx] = { ...updated[idx], title: e.target.value };
                    onChange("about", "tabs", updated);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Tab Rich Text Content</Label>
                <RichTextEditor
                  value={tab.content || ""}
                  placeholder="Enter pillar copy..."
                  onChange={(val) => {
                    const updated = [...tabs];
                    updated[idx] = { ...updated[idx], content: val };
                    onChange("about", "tabs", updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderNspcPartners(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const partners: any[] = data.partners || [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Title</Label>
          <Input
            value={data.heading || "Our Partners"}
            placeholder="Our Partners"
            className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("partners", "heading", e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Section Subtitle</Label>
          <Input
            value={data.subtitle || "Collaborating across Niagara with healthcare and community networks"}
            placeholder="Collaborating across Niagara with healthcare and community networks"
            className="h-10 text-sm rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
            onChange={(e) => onChange("partners", "subtitle", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Community Partners Directory ({partners.length})
            </h4>
            <p className="text-[11px] text-gray-500">Logos render in the continuous infinite marquee slider on the home page.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newItem = {
                name: "New Partner Organization",
                logo: "",
                link: "",
                isActive: true
              };
              onChange("partners", "partners", [...partners, newItem]);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Partner
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs hover:shadow-md transition-all space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gray-100/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">Partner #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = partners.filter((_, i) => i !== idx);
                    onChange("partners", "partners", updated);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Organization Name</Label>
                <Input
                  value={partner.name || ""}
                  placeholder="e.g. Canadian Mental Health Association"
                  className="h-10 text-sm font-semibold rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...partners];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    onChange("partners", "partners", updated);
                  }}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Logo Image</Label>
                <ImagePicker
                  value={partner.logo || ""}
                  onChange={(url) => {
                    const updated = [...partners];
                    updated[idx] = { ...updated[idx], logo: url };
                    onChange("partners", "partners", updated);
                  }}
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Leave blank to use preconfigured static brand logo.</p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Website Link</Label>
                <Input
                  value={partner.link || ""}
                  placeholder="https://..."
                  className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                  onChange={(e) => {
                    const updated = [...partners];
                    updated[idx] = { ...updated[idx], link: e.target.value };
                    onChange("partners", "partners", updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderAwardsTicker(
  data: any,
  onChange: (secId: string, field: string, val: any) => void
) {
  const items: Array<{ name: string; year: string }> = data.items && Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [
        { name: "Black Excellence in Leadership Award", year: "2023" },
        { name: "Ken Murray Community Catalyst Award", year: "2024" },
        { name: "YWCA Women of Distinction Nominee", year: "2025" },
        { name: "King Charles III Coronation Medal", year: "2024" },
        { name: "Inspiring Women in Community Award", year: "2024" },
        { name: "Gale-Walker Community Leadership Award", year: "2025" },
        { name: "5 Years of Grassroots Community Service", year: "2021–2026" }
      ];

  const label = data.label !== undefined ? data.label : "Awards & Recognition";
  const speedSeconds = data.speedSeconds !== undefined ? Number(data.speedSeconds) : 40;
  const bgColor = data.bgColor || "#1C1917";
  const textColor = data.textColor || "#FFFFFF";
  const badgeColor = data.badgeColor || "#D97706";
  const yearBgColor = data.yearBgColor || "rgba(245, 158, 11, 0.15)";
  const yearTextColor = data.yearTextColor || "#FCD34D";

  return (
    <div className="space-y-6">
      {/* Ticker Appearance & Speed Settings */}
      <div className="p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Sliders size={14} className="text-blue-500" />
          Ticker Appearance & Speed Settings
        </h4>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Left Badge Label</Label>
            <Input
              value={label}
              placeholder="Awards & Recognition"
              className="h-10 text-xs rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
              onChange={(e) => onChange("awards_ticker", "label", e.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Ticker Speed ({speedSeconds}s cycle)
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={speedSeconds}
                onChange={(e) => onChange("awards_ticker", "speedSeconds", Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-12 text-right">
                {speedSeconds}s
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Lower value = faster scroll, Higher value = slower scroll</p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Ticker Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor.startsWith("#") && bgColor.length === 7 ? bgColor : "#1C1917"}
                onChange={(e) => onChange("awards_ticker", "bgColor", e.target.value)}
                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 p-0.5 cursor-pointer bg-transparent shrink-0"
              />
              <Input
                value={bgColor}
                placeholder="#1C1917"
                className="h-10 text-xs font-mono rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("awards_ticker", "bgColor", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Award Name Text Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor.startsWith("#") && textColor.length === 7 ? textColor : "#FFFFFF"}
                onChange={(e) => onChange("awards_ticker", "textColor", e.target.value)}
                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 p-0.5 cursor-pointer bg-transparent shrink-0"
              />
              <Input
                value={textColor}
                placeholder="#FFFFFF"
                className="h-10 text-xs font-mono rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("awards_ticker", "textColor", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Left Badge Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={badgeColor.startsWith("#") && badgeColor.length === 7 ? badgeColor : "#D97706"}
                onChange={(e) => onChange("awards_ticker", "badgeColor", e.target.value)}
                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 p-0.5 cursor-pointer bg-transparent shrink-0"
              />
              <Input
                value={badgeColor}
                placeholder="#D97706"
                className="h-10 text-xs font-mono rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("awards_ticker", "badgeColor", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Year Pill Text Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={yearTextColor.startsWith("#") && yearTextColor.length === 7 ? yearTextColor : "#FCD34D"}
                onChange={(e) => onChange("awards_ticker", "yearTextColor", e.target.value)}
                className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 p-0.5 cursor-pointer bg-transparent shrink-0"
              />
              <Input
                value={yearTextColor}
                placeholder="#FCD34D"
                className="h-10 text-xs font-mono rounded-xl bg-white/60 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm"
                onChange={(e) => onChange("awards_ticker", "yearTextColor", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Repeatable Awards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Awards & Recognition Items ({items.length})
            </h4>
            <p className="text-[11px] text-gray-400">Add, edit, or remove awards shown in the live ticker track</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const updated = [...items, { name: "New Award or Recognition", year: `${new Date().getFullYear()}` }];
              onChange("awards_ticker", "items", updated);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Award
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl shadow-xs hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <Label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Award Name / Category</Label>
                <Input
                  value={item.name || ""}
                  placeholder="e.g. Ken Murray Community Catalyst Award"
                  className="h-9 text-xs font-semibold rounded-xl bg-white/70 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    onChange("awards_ticker", "items", updated);
                  }}
                />
              </div>

              <div className="w-full sm:w-36 shrink-0">
                <Label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Year / Pill</Label>
                <Input
                  value={item.year || ""}
                  placeholder="e.g. 2024"
                  className="h-9 text-xs font-bold rounded-xl bg-white/70 dark:bg-white/5 border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20"
                  onChange={(e) => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], year: e.target.value };
                    onChange("awards_ticker", "items", updated);
                  }}
                />
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center shrink-0 pt-2 sm:pt-4">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => {
                    if (idx === 0) return;
                    const updated = [...items];
                    const [moved] = updated.splice(idx, 1);
                    updated.splice(idx - 1, 0, moved);
                    onChange("awards_ticker", "items", updated);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  title="Move Up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => {
                    if (idx === items.length - 1) return;
                    const updated = [...items];
                    const [moved] = updated.splice(idx, 1);
                    updated.splice(idx + 1, 0, moved);
                    onChange("awards_ticker", "items", updated);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  title="Move Down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = items.filter((_, i) => i !== idx);
                    onChange("awards_ticker", "items", updated);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete Item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

