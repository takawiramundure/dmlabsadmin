"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Sliders, 
  LayoutGrid, 
  Type, 
  Image as ImageIcon, 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Archive, 
  Sparkles, 
  Search, 
  ChevronRight,
  MoveUp,
  MoveDown,
  Calendar,
  BookOpen,
  CheckSquare,
  Square
} from "lucide-react";
import ImagePicker from "@/components/form/ImagePicker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { cleanText, formatEventDate } from "./VisualPageCanvas";
import { getContrastColors } from "@/utils/colorUtils";
import RichTextEditor from "@/components/form/RichTextEditor";
import { 
  resolveSectionItems, 
  getCardTitle,
  getCardTitleKey,
  getCardDescription,
  getCardDescriptionKey,
  getCardTag,
  getCardTagKey,
  getCardImage,
  getCardImageKey,
  DEFAULT_PILLARS, 
  DEFAULT_STATS, 
  DEFAULT_GALLERY_IMAGES, 
  DEFAULT_HERO_SLIDES 
} from "@/utils/sectionUtils";

export interface SelectedElement {
  type: "section" | "card" | "slide" | "seo" | "none";
  sectionId?: string;
  cardIndex?: number;
  slideIndex?: number;
}

interface PropertiesInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  selected: SelectedElement;
  content: any;
  onSectionChange: (sectionId: string, field: string, value: any) => void;
  onSectionBatchUpdate?: (sectionId: string, updates: Record<string, any>) => void;
  onItemChange: (sectionId: string, cardIndex: number, field: string, value: any) => void;
  onAddItem: (sectionId: string) => void;
  onDeleteItem: (sectionId: string, cardIndex: number) => void;
  onAddSlide?: (sectionId: string) => void;
  onDeleteSlide?: (sectionId: string, slideIndex: number) => void;
  onArchiveSection?: (sectionId: string) => void;
  onTagReusable?: (sectionId: string) => void;
  onMoveSection?: (sectionId: string, direction: "up" | "down") => void;
}

export default function PropertiesInspector({
  isOpen,
  onClose,
  selected,
  content,
  onSectionChange,
  onSectionBatchUpdate,
  onItemChange,
  onAddItem,
  onDeleteItem,
  onAddSlide,
  onDeleteSlide,
  onArchiveSection,
  onTagReusable,
  onMoveSection
}: PropertiesInspectorProps) {
  const { currentSite } = useSite();
  const [activeTab, setActiveTab] = useState<"layout" | "content" | "media" | "items">("content");
  const [siteEvents, setSiteEvents] = useState<any[]>([]);
  const [siteArticles, setSiteArticles] = useState<any[]>([]);

  // Automatically switch tab when a card is selected
  useEffect(() => {
    if (selected.type === "card") {
      setActiveTab("items");
    }
  }, [selected.type, selected.cardIndex]);

  // Load events and articles
  useEffect(() => {
    const loadData = async () => {
      try {
        const evs = await FirestoreService.getEvents(currentSite.id);
        setSiteEvents(evs);
      } catch (e) {
        console.error("Error loading events in inspector:", e);
      }
      try {
        const arts = await FirestoreService.getArticles(currentSite.id);
        setSiteArticles(arts);
      } catch (e) {
        console.error("Error loading articles in inspector:", e);
      }
    };
    loadData();
  }, [currentSite.id]);

  if (!isOpen) return null;

  const sectionId = selected.sectionId || "hero";
  const section = content?.[sectionId] || content?.sections?.[sectionId] || {};
  const lowerId = sectionId.toLowerCase();

  const isHero = lowerId === "hero" || section.embed === "hero_slider";
  const isEvents = lowerId === "events_embed" || lowerId === "events" || section.embed === "events";
  const isBlog = lowerId === "blog" || lowerId === "news" || section.embed === "blog";
  const isGallery = lowerId === "slider" || lowerId === "gallery" || lowerId === "carousel";
  const isMission = lowerId === "mission" || lowerId.startsWith("mission") || lowerId.includes("pillar");
  const isImpact = lowerId === "impact" || lowerId.startsWith("impact") || lowerId.startsWith("stat");

  // Resolve items / cards dynamically for any tenant
  const { items, arrayKey: sectionArrayKey } = resolveSectionItems(section, currentSite?.id, sectionId);

  // Resolve gallery images
  const galleryImages: string[] = (section.images && Array.isArray(section.images) && section.images.length > 0)
    ? section.images.map((img: any) => typeof img === "string" ? img : img.url).filter(Boolean)
    : DEFAULT_GALLERY_IMAGES;

  const isEnabled = section.enabled !== false;
  const eventCount = section.count || section.eventCount || 3;
  const selectionMode = section.selectionMode || "latest";
  const selectedEvents: string[] = section.selectedEvents || [];
  const selectedCategories: string[] = section.selectedCategories || section.categories || [];

  const availableCategories: string[] = React.useMemo(() => {
    const fromArticles = siteArticles.map((a: any) => a.category).filter(Boolean);
    const standard = ["Wellness & Healing", "Leadership", "Economic Power", "Community & Advocacy", "Events & Workshops"];
    return Array.from(new Set([...fromArticles, ...standard]));
  }, [siteArticles]);

  return (
    <div className="w-80 md:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col h-full shrink-0 z-30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/70">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-white">
            Inspector
          </span>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono px-2 py-0.5 rounded-full font-bold">
            {sectionId}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSectionChange(sectionId, "enabled", !isEnabled)}
            className={`p-1.5 rounded-lg transition-colors text-xs font-semibold ${
              isEnabled 
                ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" 
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={isEnabled ? "Hide Section on Live Site" : "Show Section on Live Site"}
          >
            {isEnabled ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Collapse Inspector"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-950/40 px-2 pt-2">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "content"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Type size={13} /> Content
        </button>
        {(!isHero && !isEvents && !isBlog && !isGallery && items.length > 0) && (
          <button
            onClick={() => setActiveTab("items")}
            className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === "items"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Layers size={13} /> Cards ({items.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab("layout")}
          className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "layout"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <LayoutGrid size={13} /> Layout
        </button>
        <button
          onClick={() => setActiveTab("media")}
          className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === "media"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <ImageIcon size={13} /> Media
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TAB 1: CONTENT */}
        {activeTab === "content" && (
          <div className="space-y-5">
            {/* 1. UPCOMING EVENTS MODULE */}
            {isEvents && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold text-xs">
                    <Calendar size={14} />
                    <span>Live Upcoming Events Stream</span>
                  </div>
                  <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
                    Directly synchronized with the events database on the website.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Subtitle / Badge</Label>
                  <Input
                    type="text"
                    value={cleanText(section.subtitle || "Join Us")}
                    onChange={(e) => onSectionChange(sectionId, "subtitle", e.target.value)}
                    placeholder="e.g. Join Us"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Heading / Title</Label>
                  <Input
                    type="text"
                    value={cleanText(section.heading || "Upcoming Events")}
                    onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                    placeholder="e.g. Upcoming Events"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description</Label>
                  <textarea
                    rows={3}
                    value={cleanText(section.content || "Connect with our community through healing circles, workshops, and celebration events designed to empower and inspire.")}
                    onChange={(e) => onSectionChange(sectionId, "content", e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:border-blue-500 dark:text-white"
                    placeholder="Events overview text..."
                  />
                </div>

                {/* Event Count Selector */}
                <div className="pt-2 space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                    Number of Events to Show
                  </Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 6, 9, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          onSectionChange(sectionId, "count", num);
                          onSectionChange(sectionId, "eventCount", num);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          eventCount === num
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        {num} Events
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selection Mode */}
                <div className="pt-2 space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                    Event Selection Mode
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSectionChange(sectionId, "selectionMode", "latest")}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        selectionMode === "latest"
                          ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <span className="text-xs block font-bold">Latest Automatically</span>
                      <span className="text-[10px] opacity-75">Shows newest upcoming</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSectionChange(sectionId, "selectionMode", "specific")}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        selectionMode === "specific"
                          ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <span className="text-xs block font-bold">Select Specific</span>
                      <span className="text-[10px] opacity-75">Pick chosen events</span>
                    </button>
                  </div>
                </div>

                {/* Specific Event Picker Checklist */}
                {selectionMode === "specific" && (
                  <div className="pt-2 space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                      Choose Specific Events ({selectedEvents.length} selected)
                    </Label>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-gray-800 rounded-xl p-2 bg-gray-50/50 dark:bg-gray-950/50">
                      {siteEvents.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">No events found in database.</p>
                      ) : (
                        siteEvents.map((ev) => {
                          const isChecked = selectedEvents.includes(ev.id);
                          return (
                            <div
                              key={ev.id}
                              onClick={() => {
                                const newSelection = isChecked
                                  ? selectedEvents.filter((id) => id !== ev.id)
                                  : [...selectedEvents, ev.id];
                                onSectionChange(sectionId, "selectedEvents", newSelection);
                              }}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                                isChecked ? "bg-blue-100/60 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-semibold" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {isChecked ? <CheckSquare size={15} className="text-blue-600 shrink-0" /> : <Square size={15} className="text-gray-400 shrink-0" />}
                              <span className="truncate">{ev.title || "Untitled Event"}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">CTA Button</Label>
                  <Input
                    type="text"
                    value={cleanText(section.ctaText || "View All Events")}
                    onChange={(e) => onSectionChange(sectionId, "ctaText", e.target.value)}
                    placeholder="e.g. View All Events"
                  />
                  <Input
                    type="text"
                    value={cleanText(section.ctaUrl || "/upcoming-events")}
                    onChange={(e) => onSectionChange(sectionId, "ctaUrl", e.target.value)}
                    placeholder="e.g. /upcoming-events"
                  />
                </div>
              </div>
            )}

            {/* 2. BLOG & NEWS STREAM MODULE */}
            {isBlog && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                    <BookOpen size={14} />
                    <span>Latest Blog & Stories Stream</span>
                  </div>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                    Pulls latest articles published in the Articles CMS.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Heading / Title</Label>
                  <Input
                    type="text"
                    value={cleanText(section.heading || "Our Latest Blog & News")}
                    onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                    placeholder="e.g. Our Latest Blog & News"
                  />
                </div>

                {/* Article Count */}
                <div className="pt-2 space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                    Number of Articles
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 6, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => onSectionChange(sectionId, "count", num)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          (section.count || 3) === num
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {num} Posts
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Category Picker Checklist */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                      Filter by Categories ({selectedCategories.length} selected)
                    </Label>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onSectionChange(sectionId, "selectedCategories", []);
                          onSectionChange(sectionId, "categories", []);
                        }}
                        className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                      >
                        Reset (Show All)
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {selectedCategories.length === 0 
                      ? "Showing latest articles across all categories." 
                      : `Filtering to show articles in ${selectedCategories.join(", ")}.`}
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-gray-800 rounded-xl p-2 bg-gray-50/50 dark:bg-gray-950/50">
                    {availableCategories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat);
                      return (
                        <div
                          key={cat}
                          onClick={() => {
                            const newSelection = isChecked
                              ? selectedCategories.filter((c) => c !== cat)
                              : [...selectedCategories, cat];
                            onSectionChange(sectionId, "selectedCategories", newSelection);
                            onSectionChange(sectionId, "categories", newSelection);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isChecked ? "bg-amber-100/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-semibold" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {isChecked ? <CheckSquare size={15} className="text-amber-600 shrink-0" /> : <Square size={15} className="text-gray-400 shrink-0" />}
                          <span className="truncate">{cat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">CTA Button</Label>
                  <Input
                    type="text"
                    value={cleanText(section.buttonText || "View More")}
                    onChange={(e) => onSectionChange(sectionId, "buttonText", e.target.value)}
                    placeholder="View More"
                  />
                  <Input
                    type="text"
                    value={cleanText(section.buttonUrl || "/blog")}
                    onChange={(e) => onSectionChange(sectionId, "buttonUrl", e.target.value)}
                    placeholder="/blog"
                  />
                </div>
              </div>
            )}

            {/* 3. GALLERY SLIDER MODULE */}
            {isGallery && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold text-xs">
                    <ImageIcon size={14} />
                    <span>Image Gallery Slideshow</span>
                  </div>
                  <p className="text-[11px] text-purple-600/80 dark:text-purple-400/80">
                    Seamless continuous infinite image carousel.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                      Gallery Images ({galleryImages.length})
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...galleryImages, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"];
                        onSectionChange(sectionId, "images", newImages.map(url => ({ url })));
                      }}
                      className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Photo
                    </button>
                  </div>

                  <div className="space-y-3">
                    {galleryImages.map((imgUrl, idx) => (
                      <div key={idx} className="p-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-gray-400">Photo #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = galleryImages.filter((_, i) => i !== idx);
                              onSectionChange(sectionId, "images", updated.map(url => ({ url })));
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove Photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <ImagePicker
                          value={imgUrl}
                          onChange={(newUrl) => {
                            const updated = [...galleryImages];
                            updated[idx] = newUrl;
                            onSectionChange(sectionId, "images", updated.map(url => ({ url })));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. STANDARD SECTIONS (Mission, Impact, Services, Custom) */}
            {!isEvents && !isBlog && !isGallery && (
              <div className="space-y-5">
                {/* 1. Subtitle / Pill */}
                <div>
                  <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Subtitle / Tagline</Label>
                  <Input
                    type="text"
                    value={cleanText(section.subtitle || (isImpact ? "Transforming Lives Across Canada" : isMission ? "Why Choose BWEIC" : section.pillText || ""))}
                    onChange={(e) => onSectionChange(sectionId, "subtitle", e.target.value)}
                    placeholder="e.g. SINCE 2024"
                  />
                </div>

                {/* 2. Main Heading */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Heading / Title</Label>
                  <textarea
                    rows={2}
                    value={cleanText(section.heading || (isImpact ? "Our Measurable Impact" : isMission ? "Why Choose BWEIC" : section.title || ""))}
                    onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                    placeholder="Section Headline"
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:border-blue-500 dark:text-white font-semibold"
                  />
                </div>

                {/* 3. Typography & Styling Panel */}
                <div className="p-3 bg-gray-50/70 dark:bg-gray-950/70 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    <Sparkles size={13} className="text-blue-500" />
                    <span>Typography & Text Styling</span>
                  </div>

                  {/* Heading Size */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-gray-500">Heading Size</Label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "Medium", val: "text-3xl md:text-4xl" },
                        { label: "Large", val: "text-4xl md:text-5xl" },
                        { label: "XL", val: "text-4xl md:text-5xl lg:text-6xl" },
                        { label: "Huge", val: "text-5xl md:text-6xl lg:text-7xl" }
                      ].map((size) => (
                        <button
                          key={size.label}
                          type="button"
                          onClick={() => onSectionChange(sectionId, "fontSize", size.val)}
                          className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                            (section.fontSize || "text-4xl md:text-5xl lg:text-6xl") === size.val
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color & Palette Swatches */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-gray-500">Text & Heading Color</Label>
                      <span className="text-[10px] font-mono text-gray-400 uppercase">
                        {section.headingColor || section.textColor || "#D4AF37"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[
                        { name: "Brand Gold", hex: "#D4AF37" },
                        { name: "Pure White", hex: "#FFFFFF" },
                        { name: "Charcoal Black", hex: "#0A0A0A" },
                        { name: "Muted Gray", hex: "#9CA3AF" },
                        { name: "Accent Gold", hex: "#C5A059" }
                      ].map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => {
                            onSectionChange(sectionId, "headingColor", color.hex);
                            onSectionChange(sectionId, "textColor", color.hex === "#0A0A0A" ? "#0A0A0A" : color.hex);
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 shadow-xs ${
                            (section.headingColor === color.hex || section.textColor === color.hex)
                              ? "border-blue-500 ring-2 ring-blue-500/30 scale-110"
                              : "border-gray-300 dark:border-gray-700"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                      {/* Native Color Picker */}
                      <input
                        type="color"
                        value={section.headingColor || "#D4AF37"}
                        onChange={(e) => {
                          onSectionChange(sectionId, "headingColor", e.target.value);
                          onSectionChange(sectionId, "textColor", e.target.value);
                        }}
                        className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer bg-transparent"
                        title="Custom Color"
                      />
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-gray-500">Text Alignment</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["left", "center", "right"].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => onSectionChange(sectionId, "textAlign", align)}
                          className={`py-1.5 text-xs capitalize font-bold rounded-lg border transition-all ${
                            (section.textAlign || "center") === align
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section Background Theme & Auto-Contrast */}
                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] text-gray-500 font-bold uppercase">Full Section Background</Label>
                      <span className="text-[10px] font-mono text-gray-400 uppercase">
                        {section.bgColor || "#0A0A0A"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Dark Luxury", hex: "#0A0A0A" },
                        { label: "Clean Light", hex: "#FFFFFF" },
                        { label: "Brand Gold", hex: "#D4AF37" },
                        { label: "Warm Sand", hex: "#FDFBF7" }
                      ].map((bg) => {
                        const isSelected = (section.bgColor || "#0A0A0A").toLowerCase() === bg.hex.toLowerCase();
                        return (
                          <button
                            key={bg.label}
                            type="button"
                            onClick={() => {
                              const { headingColor, textColor } = getContrastColors(bg.hex);
                              if (onSectionBatchUpdate) {
                                onSectionBatchUpdate(sectionId, {
                                  bgColor: bg.hex,
                                  headingColor,
                                  textColor
                                });
                              } else {
                                onSectionChange(sectionId, "bgColor", bg.hex);
                                onSectionChange(sectionId, "headingColor", headingColor);
                                onSectionChange(sectionId, "textColor", textColor);
                              }
                            }}
                            className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                                : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                            }`}
                          >
                            <div>
                              <span className="text-xs block font-bold">{bg.label}</span>
                              <span className="text-[10px] opacity-70 font-mono">{bg.hex}</span>
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                              style={{ backgroundColor: bg.hex }}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Background Color Picker */}
                    <div className="flex items-center gap-2 pt-1">
                      <Label className="text-[10px] text-gray-400 shrink-0">Custom BG:</Label>
                      <input
                        type="color"
                        value={section.bgColor || "#0A0A0A"}
                        onChange={(e) => {
                          const newBg = e.target.value;
                          const { headingColor, textColor } = getContrastColors(newBg);
                          if (onSectionBatchUpdate) {
                            onSectionBatchUpdate(sectionId, {
                              bgColor: newBg,
                              headingColor,
                              textColor
                            });
                          } else {
                            onSectionChange(sectionId, "bgColor", newBg);
                            onSectionChange(sectionId, "headingColor", headingColor);
                            onSectionChange(sectionId, "textColor", textColor);
                          }
                        }}
                        className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer bg-transparent"
                        title="Custom Section Background Color"
                      />
                      <input
                        type="text"
                        value={section.bgColor || "#0A0A0A"}
                        onChange={(e) => {
                          const newBg = e.target.value;
                          const { headingColor, textColor } = getContrastColors(newBg);
                          if (onSectionBatchUpdate) {
                            onSectionBatchUpdate(sectionId, {
                              bgColor: newBg,
                              headingColor,
                              textColor
                            });
                          } else {
                            onSectionChange(sectionId, "bgColor", newBg);
                            onSectionChange(sectionId, "headingColor", headingColor);
                            onSectionChange(sectionId, "textColor", textColor);
                          }
                        }}
                        placeholder="#0A0A0A"
                        className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-800 bg-transparent font-mono uppercase dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Content / Body Description with TipTap WYSIWYG Editor */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Body Description (WYSIWYG Rich Text)
                  </Label>
                  <RichTextEditor
                    value={section.content || section.description || ""}
                    onChange={(html) => onSectionChange(sectionId, "content", html)}
                    placeholder="Write formatted body description..."
                    minHeight="110px"
                  />
                </div>

                {/* 5. Call to Action Button */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Call to Action (CTA)</Label>
                  <div>
                    <Label className="text-[11px] text-gray-500">Button Text</Label>
                    <Input
                      type="text"
                      value={cleanText(section.buttonText || section.cta || "")}
                      onChange={(e) => onSectionChange(sectionId, "buttonText", e.target.value)}
                      placeholder="e.g. Explore Programs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">Button URL</Label>
                    <Input
                      type="text"
                      value={cleanText(section.buttonUrl || section.link || "")}
                      onChange={(e) => onSectionChange(sectionId, "buttonUrl", e.target.value)}
                      placeholder="e.g. /programs"
                    />
                  </div>
                </div>

                {/* Section Cards Quick Edit List */}
                {items.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                        Section Cards ({items.length})
                      </Label>
                      <button
                        type="button"
                        onClick={() => onAddItem(sectionId)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Card
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400">Card #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(sectionId, idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete Card"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <Input
                            type="text"
                            value={cleanText(getCardTitle(item))}
                            onChange={(e) => onItemChange(sectionId, idx, getCardTitleKey(item), e.target.value)}
                            placeholder="Card Title / Metric"
                          />
                          <RichTextEditor
                            value={getCardDescription(item)}
                            onChange={(html) => onItemChange(sectionId, idx, getCardDescriptionKey(item), html)}
                            placeholder="Card description..."
                            minHeight="70px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CARDS & ITEMS DEDICATED TAB */}
        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                Grid Cards ({items.length})
              </Label>
              <button
                type="button"
                onClick={() => onAddItem(sectionId)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus size={12} /> Add Card
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const isSelectedCard = selected.cardIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border space-y-2.5 transition-all ${
                      isSelectedCard 
                        ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" 
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-gray-400">Card #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(sectionId, idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div>
                      <Label className="text-[10px] text-gray-500">Title / Metric</Label>
                      <Input
                        type="text"
                        value={cleanText(getCardTitle(item))}
                        onChange={(e) => onItemChange(sectionId, idx, getCardTitleKey(item), e.target.value)}
                        placeholder="Card Title / Metric"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] text-gray-500">Tag / Label</Label>
                      <Input
                        type="text"
                        value={cleanText(getCardTag(item))}
                        onChange={(e) => onItemChange(sectionId, idx, getCardTagKey(item), e.target.value)}
                        placeholder="e.g. Featured / Metric Label"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] text-gray-500">Description (Rich Text)</Label>
                      <RichTextEditor
                        value={getCardDescription(item)}
                        onChange={(html) => onItemChange(sectionId, idx, getCardDescriptionKey(item), html)}
                        placeholder="Card text..."
                        minHeight="70px"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] text-gray-500">Image URL</Label>
                      <ImagePicker
                        value={getCardImage(item)}
                        onChange={(url) => onItemChange(sectionId, idx, getCardImageKey(item), url)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LAYOUT */}
        {activeTab === "layout" && (
          <div className="space-y-5">
            {/* Column Layout Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                Column Grid Layout
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onSectionChange(sectionId, "columns", 1)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    section.columns === 1 || (!section.columns && !section.layout)
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                      : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <div className="w-full h-4 bg-current opacity-30 rounded mb-1.5"></div>
                  <span className="text-[11px] block">1 Col (Full)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSectionChange(sectionId, "columns", 2)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    section.columns === 2 || section.layout === "2-col"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                      : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-1 h-4 mb-1.5">
                    <div className="flex-1 bg-current opacity-30 rounded"></div>
                    <div className="flex-1 bg-current opacity-30 rounded"></div>
                  </div>
                  <span className="text-[11px] block">2 Col (Split)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSectionChange(sectionId, "columns", 3)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    section.columns === 3 || section.layout === "3-col"
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold shadow-sm"
                      : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-1 h-4 mb-1.5">
                    <div className="flex-1 bg-current opacity-30 rounded"></div>
                    <div className="flex-1 bg-current opacity-30 rounded"></div>
                    <div className="flex-1 bg-current opacity-30 rounded"></div>
                  </div>
                  <span className="text-[11px] block">3 Col (Grid)</span>
                </button>
              </div>
            </div>

            {/* Section Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                Section Management
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {onMoveSection && (
                  <>
                    <button
                      type="button"
                      onClick={() => onMoveSection(sectionId, "up")}
                      className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5"
                    >
                      <MoveUp size={13} /> Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveSection(sectionId, "down")}
                      className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5"
                    >
                      <MoveDown size={13} /> Move Down
                    </button>
                  </>
                )}
              </div>

              {onTagReusable && (
                <button
                  type="button"
                  onClick={() => onTagReusable(sectionId)}
                  className="w-full mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} /> Save to Reusable Library
                </button>
              )}

              {onArchiveSection && (
                <button
                  type="button"
                  onClick={() => onArchiveSection(sectionId)}
                  className="w-full p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 flex items-center justify-center gap-1.5"
                >
                  <Archive size={13} /> Archive Section
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MEDIA */}
        {activeTab === "media" && (
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
              Section Images & Media
            </Label>
            <div>
              <Label className="text-xs text-gray-700 dark:text-gray-300">Main Photo / Background</Label>
              <ImagePicker
                value={section.images?.[0]?.url || section.imageUrl || ""}
                onChange={(url) => onSectionChange(sectionId, "images", [{ url, alt: section.heading || "Section Image" }])}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
