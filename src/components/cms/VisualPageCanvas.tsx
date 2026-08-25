"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Camera, 
  LayoutGrid, 
  Sparkles, 
  Archive, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Split,
  Edit2,
  Sliders,
  CheckCircle,
  Heart,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  BookOpen,
  Image as ImageIcon
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import ImagePicker from "@/components/form/ImagePicker";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { SelectedElement } from "./PropertiesInspector";
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

export const formatEventDate = (dateVal: any): string => {
  if (!dateVal) return "Upcoming";
  if (typeof dateVal === "string") return dateVal;
  if (typeof dateVal === "number") {
    return new Date(dateVal).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (typeof dateVal === "object") {
    if (dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (dateVal.toDate && typeof dateVal.toDate === "function") {
      return dateVal.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (dateVal instanceof Date) {
      return dateVal.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  }
  return String(dateVal || "Upcoming");
};

export const cleanText = (str: any): string => {
  if (!str) return "";
  if (typeof str === "object") {
    if (str.seconds) {
      return new Date(str.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (str.toDate && typeof str.toDate === "function") {
      return str.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return "";
  }
  if (typeof str !== "string") return String(str);
  return str
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s*\n/g, "\n")
    .trim();
};

const DEFAULT_PILLARS = [
  {
    icon: "Heart",
    title: "Healing & Wellness",
    description: "We prioritize creating trauma-informed, culturally safe spaces where Black women can heal, rest, and reclaim their emotional wellbeing."
  },
  {
    icon: "Sparkles",
    title: "Empowerment & Growth",
    description: "We build confidence and capacity through leadership development, financial literacy, and self-advocacy programs that navigate systems with clarity."
  },
  {
    icon: "Users",
    title: "Community & Belonging",
    description: "We reduce isolation through peer connection, storytelling, and collective care—fostering intergenerational dialogue and shared purpose."
  }
];

const DEFAULT_STATS = [
  {
    label: "Black Women Served",
    value: "500+",
    description: "across Canada"
  },
  {
    label: "Active Programs",
    value: "12",
    description: "signature initiatives"
  },
  {
    label: "Community Partners",
    value: "25+",
    description: "organizations"
  },
  {
    label: "Years of Impact",
    value: "2+",
    description: "since 2024"
  }
];

const DEFAULT_EVENTS = [
  {
    id: "e1",
    title: "Sisterhood Healing Circle: Rest & Reclaim",
    date: "OCT 24, 2026",
    time: "6:00 PM - 8:30 PM EST",
    location: "Toronto, ON & Online",
    category: "Healing",
    description: "A trauma-informed guided circle designed for restorative dialogue, somatic healing, and collective grounding for Black women.",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
  },
  {
    id: "e2",
    title: "Black Women in Leadership Symposium",
    date: "NOV 12, 2026",
    time: "10:00 AM - 4:00 PM EST",
    location: "Metro Toronto Convention Centre",
    category: "Leadership",
    description: "Executive keynotes, career navigation workshops, and intergenerational networking for emerging and established leaders.",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80"
  },
  {
    id: "e3",
    title: "Economic Sovereignty & Wealth Building",
    date: "DEC 05, 2026",
    time: "1:00 PM - 3:30 PM EST",
    location: "Virtual Interactive Workshop",
    category: "Financial Literacy",
    description: "Demystifying investing, institutional funding, and building generational wealth for Black women founders.",
    imageUrl: "https://images.unsplash.com/photo-1544333323-4416198f1a1c?w=800&q=80"
  }
];

const DEFAULT_ARTICLES = [
  {
    id: "a1",
    title: "Reclaiming Rest: Somatic Healing Practices for Black Women",
    category: "Wellness & Healing",
    date: "OCT 14, 2026",
    excerpt: "Why rest is not a luxury, but a foundational pillar of community sovereignty and emotional longevity.",
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop"
  },
  {
    id: "a2",
    title: "Navigating Executive Leadership Across Corporate Canada",
    category: "Leadership",
    date: "SEP 28, 2026",
    excerpt: "Key lessons from our leadership cohort on breaking systemic barriers while preserving authentic identity.",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"
  },
  {
    id: "a3",
    title: "Building Generational Wealth Through Community Cooperatives",
    category: "Economic Power",
    date: "SEP 10, 2026",
    excerpt: "How collective economics and transparent funding structures are transforming Black women-led ventures.",
    imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=600&fit=crop"
  }
];

const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
];

const DEFAULT_HERO_SLIDES = [
  {
    id: "b1",
    title: "FROM SURVIVAL TO SOVEREIGNTY",
    pillText: "A BLACK WOMEN-LED INITIATIVE CREATING SAFE SPACES FOR HEALING, EMPOWERMENT, AND COMMUNITY ACROSS CANADA.",
    subtitle: "A Black women–led initiative creating safe spaces for healing, empowerment, and community across Canada.",
    cta: "EXPLORE OUR PROGRAMS",
    link: "/programs",
    secondaryCta: "SUPPORT OUR WORK",
    secondaryLink: "/take-action",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1920&h=1080&fit=crop&q=80"
  },
  {
    id: "b2",
    title: "HEALING IS POWER",
    pillText: "CREATING TRAUMA-INFORMED, CULTURALLY SAFE SPACES ACROSS CANADA.",
    subtitle: "Trauma-informed conversations, rest-centered practices, and emotional wellness designed for Black women.",
    cta: "JOIN A CIRCLE",
    link: "/programs",
    secondaryCta: "OUR VALUES",
    secondaryLink: "/about",
    imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&h=1080&fit=crop&q=80"
  },
  {
    id: "b3",
    title: "RECLAIM YOUR SOVEREIGNTY",
    pillText: "BUILDING LEADERSHIP, ECONOMIC CAPACITY, AND INTERGENERATIONAL COMMUNITY.",
    subtitle: "Building meaningful, connected lives through leadership development, financial literacy, and community support.",
    cta: "EXPLORE PROGRAMS",
    link: "/programs",
    secondaryCta: "GET INVOLVED",
    secondaryLink: "/take-action",
    imageUrl: "https://images.unsplash.com/photo-1544333323-4416198f1a1c?w=1920&h=1080&fit=crop&q=80"
  }
];

interface VisualPageCanvasProps {
  content: any;
  sortedSections: { id: string; label: string }[];
  selected: SelectedElement;
  onSelect: (selected: SelectedElement) => void;
  onSectionChange: (sectionId: string, field: string, value: any) => void;
  onItemChange: (sectionId: string, cardIndex: number, field: string, value: any) => void;
  onAddItem: (sectionId: string) => void;
  onDeleteItem: (sectionId: string, cardIndex: number) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
  onOpenInsertDrawer: () => void;
  onArchiveSection?: (sectionId: string) => void;
  onTagReusable?: (sectionId: string) => void;
}

export default function VisualPageCanvas({
  content,
  sortedSections,
  selected,
  onSelect,
  onSectionChange,
  onItemChange,
  onAddItem,
  onDeleteItem,
  onMoveSection,
  onOpenInsertDrawer,
  onArchiveSection,
  onTagReusable
}: VisualPageCanvasProps) {
  const { currentSite } = useSite();
  // Active Hero slide state
  const [activeHeroSlideIdx, setActiveHeroSlideIdx] = useState(0);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [liveArticles, setLiveArticles] = useState<any[]>([]);

  // Load real events & articles for visual preview
  useEffect(() => {
    const fetchData = async () => {
      try {
        const evs = await FirestoreService.getEvents(currentSite.id);
        setLiveEvents(evs && evs.length > 0 ? evs : DEFAULT_EVENTS);
      } catch (e) {
        setLiveEvents(DEFAULT_EVENTS);
      }
      try {
        const arts = await FirestoreService.getArticles(currentSite.id);
        setLiveArticles(arts && arts.length > 0 ? arts : DEFAULT_ARTICLES);
      } catch (e) {
        setLiveArticles(DEFAULT_ARTICLES);
      }
    };
    fetchData();
  }, [currentSite.id]);

  // Active Image Modal state
  const [activeImagePickerTarget, setActiveImagePickerTarget] = useState<{
    sectionId: string;
    field: string;
    cardIdx?: number;
    currentUrl?: string;
  } | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-black text-white min-h-[85vh] p-4 md:p-8 space-y-12">
      {/* Top Banner Toolbar */}
      <div className="flex items-center justify-between bg-gray-950 border border-gray-800 px-5 py-3 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-200">DMLabs Hybrid Visual Canvas</span>
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            Click directly on text, images, and cards to edit in-place.
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenInsertDrawer}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
        >
          <Plus size={14} /> Insert Component
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-10 max-w-7xl mx-auto">
        {sortedSections.map((config, index) => {
          const sectionId = config.id;
          const section = (content as any)?.[sectionId] || (content as any)?.sections?.[sectionId] || {};
          const isHidden = section.enabled === false;
          const isSelected = selected.sectionId === sectionId;
          const lowerId = sectionId.toLowerCase();

          // Check section type
          const isMission = lowerId === "mission" || lowerId.startsWith("mission") || lowerId.includes("pillar");
          const isImpact = lowerId === "impact" || lowerId.startsWith("impact") || lowerId.startsWith("stat");
          const isEvents = lowerId === "events" || lowerId === "events_embed" || lowerId.startsWith("events") || section.embed === "events";
          const isBlog = lowerId === "blog" || lowerId === "news" || section.embed === "blog";
          const isGallery = lowerId === "slider" || lowerId === "gallery" || lowerId === "carousel";

          // Resolve section items dynamically for any tenant
          const { items: cards, arrayKey: sectionArrayKey } = resolveSectionItems(section, currentSite?.id, sectionId);

          // Resolve gallery images
          const galleryImages: string[] = (section.images && Array.isArray(section.images) && section.images.length > 0)
            ? section.images.map((img: any) => typeof img === "string" ? img : img.url).filter(Boolean)
            : DEFAULT_GALLERY_IMAGES;

          const colCount = Number(section.columns) || (section.layout === "3-col" ? 3 : section.layout === "2-col" ? 2 : cards.length >= 3 ? 3 : cards.length === 2 ? 2 : 1);

          return (
            <React.Fragment key={`${sectionId}-${index}`}>
              {/* Insert Drop Zone Between Sections */}
              <div className="relative group/insert py-2 flex items-center justify-center">
                <div className="w-full h-px bg-gray-800 group-hover/insert:bg-blue-600/50 transition-colors"></div>
                <button
                  type="button"
                  onClick={onOpenInsertDrawer}
                  className="absolute opacity-0 group-hover/insert:opacity-100 px-3 py-1 bg-gray-900 border border-blue-500/40 hover:border-blue-500 text-blue-400 text-[10px] font-bold rounded-full transition-all shadow-lg flex items-center gap-1 -translate-y-1/2"
                >
                  <Plus size={11} /> Add Component Here
                </button>
              </div>

              {/* Section Block */}
              <div
                onClick={() => onSelect({ type: "section", sectionId })}
                className={`relative rounded-3xl transition-all duration-200 border overflow-hidden ${
                  isSelected 
                    ? "ring-2 ring-blue-500 border-blue-500 shadow-2xl shadow-blue-500/10" 
                    : isHidden 
                      ? "border-dashed border-gray-800 opacity-60 bg-gray-950/40" 
                      : "border-gray-800/80 hover:border-gray-700"
                }`}
                style={{
                  backgroundColor: section.bgColor || (lowerId === "founder" ? "#FFFFFF" : "#080808"),
                  color: section.textColor || (section.bgColor === "#FFFFFF" || lowerId === "founder" ? "#1F2937" : "#FFFFFF")
                }}
              >
                {/* Floating Section Action Bar */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-gray-900/90 backdrop-blur-md border border-gray-700/80 px-3 py-1.5 rounded-xl shadow-xl">
                  {/* Column Switcher (if standard grid) */}
                  {!isEvents && !isBlog && !isGallery && (
                    <div className="flex items-center gap-1 bg-gray-800/90 px-1.5 py-0.5 rounded-lg mr-1.5">
                      <span className="text-[9px] text-gray-400 font-mono">Cols:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionChange(sectionId, "columns", 1);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          colCount === 1 ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                        title="1 Column (Full Width)"
                      >
                        1
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionChange(sectionId, "columns", 2);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          colCount === 2 ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                        title="2 Columns (50/50 Split)"
                      >
                        2
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionChange(sectionId, "columns", 3);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          colCount === 3 ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                        }`}
                        title="3 Columns (33/33/33 Grid)"
                      >
                        3
                      </button>
                    </div>
                  )}

                  <span className="text-[11px] font-mono text-gray-300 font-semibold mr-1">{config.label}</span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionChange(sectionId, "enabled", isHidden ? true : false);
                    }}
                    className={`p-1 rounded transition-colors ${!isHidden ? "text-emerald-400 hover:bg-emerald-950/40" : "text-gray-500 hover:bg-gray-800"}`}
                    title={isHidden ? "Unhide Section" : "Hide Section"}
                  >
                    {!isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSection(index, "up");
                    }}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp size={14} />
                  </button>

                  <button
                    type="button"
                    disabled={index === sortedSections.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSection(index, "down");
                    }}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                {/* VISUAL PREVIEW & IN-LINE CONTROLS */}
                <div className="p-6 md:p-12 pt-16">
                  {/* 1. HERO SLIDER OR STATIC HERO BANNER */}
                  {(lowerId === "hero" || section.embed === "hero_slider") && (
                    <div className="space-y-8">
                      {/* Check if multi-slide or static banner */}
                      {(section.slides && Array.isArray(section.slides) && section.slides.length > 0) || section.embed === "hero_slider" ? (
                        <>
                          {/* Slide Tabs Navigation */}
                          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                            <span className="text-[11px] uppercase font-bold text-gray-400 mr-2">Hero Slides:</span>
                            {(section.slides || DEFAULT_HERO_SLIDES).map((_: any, sIdx: number) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveHeroSlideIdx(sIdx);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                  activeHeroSlideIdx === sIdx
                                    ? "bg-[var(--color-brand,#D4AF37)] text-black shadow-md"
                                    : "bg-gray-900 text-gray-400 hover:text-white"
                                }`}
                              >
                                Slide {sIdx + 1}
                              </button>
                            ))}
                          </div>

                          {/* Active Slide Canvas */}
                          {(() => {
                            const currentSlides = section.slides || DEFAULT_HERO_SLIDES;
                            const slide = currentSlides[activeHeroSlideIdx] || currentSlides[0] || DEFAULT_HERO_SLIDES[0];
                            const slideBg = slide.imageUrl || slide.image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1920&h=1080&fit=crop&q=80";

                            return (
                              <div 
                                className="relative min-h-[420px] rounded-2xl overflow-hidden border border-gray-800 flex flex-col justify-center items-center text-center p-8 bg-cover bg-center"
                                style={{ backgroundImage: `url(${slideBg})` }}
                              >
                                <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]"></div>

                                {/* Camera Change Photo Overlay */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImagePickerTarget({
                                      sectionId,
                                      field: "slides",
                                      cardIdx: activeHeroSlideIdx,
                                      currentUrl: slideBg
                                    });
                                  }}
                                  className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-black/70 hover:bg-[var(--color-brand,#D4AF37)] hover:text-black text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur flex items-center gap-1.5 transition-all shadow-lg"
                                >
                                  <Camera size={14} /> Change Slide Photo
                                </button>

                                <div className="relative z-10 max-w-4xl mx-auto space-y-5">
                                  {/* Pill Text */}
                                  <input
                                    value={cleanText(slide.pillText || section.pillText || "A BLACK WOMEN-LED INITIATIVE CREATING SAFE SPACES FOR HEALING, EMPOWERMENT, AND COMMUNITY ACROSS CANADA.")}
                                    onChange={(e) => {
                                      const updatedSlides = [...(section.slides || DEFAULT_HERO_SLIDES)];
                                      updatedSlides[activeHeroSlideIdx] = { ...slide, pillText: e.target.value };
                                      onSectionChange(sectionId, "slides", updatedSlides);
                                    }}
                                    className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand,#D4AF37)] bg-transparent border-b border-dashed border-gray-600 outline-none text-center w-full"
                                    placeholder="Pill Tagline"
                                  />

                                  {/* Title */}
                                  <textarea
                                    rows={2}
                                    value={cleanText(slide.title || section.heading || "FROM SURVIVAL TO SOVEREIGNTY")}
                                    onChange={(e) => {
                                      const updatedSlides = [...(section.slides || DEFAULT_HERO_SLIDES)];
                                      updatedSlides[activeHeroSlideIdx] = { ...slide, title: e.target.value };
                                      onSectionChange(sectionId, "slides", updatedSlides);
                                      onSectionChange(sectionId, "heading", e.target.value);
                                    }}
                                    className="text-3xl sm:text-5xl md:text-6xl font-black uppercase text-white bg-transparent border-b border-dashed border-gray-600 outline-none text-center w-full leading-tight font-heading"
                                    placeholder="Hero Slide Headline"
                                  />

                                  {/* Subtitle */}
                                  <textarea
                                    rows={2}
                                    value={cleanText(slide.subtitle || section.subtitle || "A Black women–led initiative creating safe spaces for healing, empowerment, and community across Canada.")}
                                    onChange={(e) => {
                                      const updatedSlides = [...(section.slides || DEFAULT_HERO_SLIDES)];
                                      updatedSlides[activeHeroSlideIdx] = { ...slide, subtitle: e.target.value };
                                      onSectionChange(sectionId, "slides", updatedSlides);
                                      onSectionChange(sectionId, "subtitle", e.target.value);
                                    }}
                                    className="text-sm md:text-base text-gray-300 bg-transparent border-b border-dashed border-gray-600 outline-none text-center w-full max-w-2xl mx-auto"
                                    placeholder="Hero Slide Subtitle"
                                  />

                                  {/* CTA Buttons */}
                                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                                    <div className="flex items-center gap-2 bg-[var(--color-brand,#D4AF37)] text-black px-8 py-3.5 rounded-full font-bold text-xs uppercase shadow-lg hover:brightness-110">
                                      <input
                                        value={cleanText(slide.cta || section.cta || "EXPLORE OUR PROGRAMS")}
                                        onChange={(e) => {
                                          const updatedSlides = [...(section.slides || DEFAULT_HERO_SLIDES)];
                                          updatedSlides[activeHeroSlideIdx] = { ...slide, cta: e.target.value };
                                          onSectionChange(sectionId, "slides", updatedSlides);
                                          onSectionChange(sectionId, "cta", e.target.value);
                                        }}
                                        className="bg-transparent text-black font-bold uppercase text-xs outline-none text-center"
                                        placeholder="Primary CTA Text"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2 bg-transparent text-white border border-white/30 px-8 py-3.5 rounded-full font-bold text-xs uppercase hover:border-[var(--color-brand,#D4AF37)]">
                                      <input
                                        value={cleanText(slide.secondaryCta || section.secondaryCta || "SUPPORT OUR WORK")}
                                        onChange={(e) => {
                                          const updatedSlides = [...(section.slides || DEFAULT_HERO_SLIDES)];
                                          updatedSlides[activeHeroSlideIdx] = { ...slide, secondaryCta: e.target.value };
                                          onSectionChange(sectionId, "slides", updatedSlides);
                                          onSectionChange(sectionId, "secondaryCta", e.target.value);
                                        }}
                                        className="bg-transparent text-white font-bold uppercase text-xs outline-none text-center"
                                        placeholder="Secondary CTA Text"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        /* Static Hero Banner */
                        <div 
                          className="relative min-h-[360px] rounded-2xl overflow-hidden border border-gray-800 flex flex-col justify-center items-center text-center p-8 md:p-14 bg-cover bg-center"
                          style={{ 
                            backgroundImage: (section.images?.[0]?.url || section.imageUrl) ? `url(${section.images?.[0]?.url || section.imageUrl})` : undefined,
                            backgroundColor: section.bgColor || "#000000"
                          }}
                        >
                          {(section.images?.[0]?.url || section.imageUrl) && (
                            <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px]"></div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImagePickerTarget({
                                sectionId,
                                field: "images",
                                currentUrl: section.images?.[0]?.url || section.imageUrl
                              });
                            }}
                            className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-black/70 hover:bg-[var(--color-brand,#D4AF37)] hover:text-black text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur flex items-center gap-1.5 transition-all shadow-lg"
                          >
                            <Camera size={14} /> Change Banner Image
                          </button>

                          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                            {/* Subtitle / Tagline */}
                            <input
                              value={cleanText(section.subtitle || section.tagline || "Who We Are")}
                              onChange={(e) => onSectionChange(sectionId, "subtitle", e.target.value)}
                              className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-[#C5A059] bg-transparent border-b border-dashed border-gray-700 outline-none text-center w-full"
                              placeholder="Subtitle / Tagline (e.g. WHO WE ARE)"
                            />

                            {/* Main Heading */}
                            <textarea
                              rows={2}
                              value={cleanText(section.heading || section.title || "Our Story")}
                              onChange={(e) => {
                                onSectionChange(sectionId, "heading", e.target.value);
                                onSectionChange(sectionId, "title", e.target.value);
                              }}
                              className="text-4xl md:text-6xl font-black uppercase text-white bg-transparent border-b border-dashed border-gray-700 outline-none text-center w-full font-heading leading-tight"
                              placeholder="Main Page Title (e.g. OUR STORY)"
                            />

                            {/* Content / Narrative Line */}
                            <textarea
                              rows={2}
                              value={cleanText(section.content || section.description || "From Survival to Sovereignty")}
                              onChange={(e) => {
                                onSectionChange(sectionId, "content", e.target.value);
                                onSectionChange(sectionId, "description", e.target.value);
                              }}
                              className="text-lg md:text-2xl text-gray-300 font-light bg-transparent border-b border-dashed border-gray-700 outline-none text-center w-full max-w-3xl mx-auto"
                              placeholder="Narrative Tagline"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. FOUNDER STORY SECTION */}
                  {lowerId === "founder" && (
                    <div className="grid lg:grid-cols-2 gap-12 items-center bg-white text-black p-8 md:p-12 rounded-3xl shadow-xl">
                      {/* Photo with Click-to-Replace */}
                      <div className="relative group/founderPhoto">
                        <img
                          src={section.images?.[0]?.url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"}
                          alt="Founder"
                          className="w-full h-96 object-cover rounded-2xl shadow-md"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImagePickerTarget({
                              sectionId,
                              field: "images",
                              currentUrl: section.images?.[0]?.url
                            });
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/founderPhoto:opacity-100 flex flex-col items-center justify-center gap-2 text-white font-bold text-sm rounded-2xl transition-all backdrop-blur-xs"
                        >
                          <Camera size={24} className="text-[var(--color-brand,#D4AF37)]" />
                          <span>Click to Replace Portrait</span>
                        </button>
                      </div>

                      {/* Founder Text */}
                      <div className="space-y-4 text-left">
                        <input
                          value={cleanText(section.subtitle || "SINCE 2024")}
                          onChange={(e) => onSectionChange(sectionId, "subtitle", e.target.value)}
                          className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] bg-transparent border-b border-dashed border-gray-300 outline-none w-full"
                          placeholder="Subtitle"
                        />
                        <input
                          value={cleanText(section.heading || "Message from the founder")}
                          onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                          className="text-2xl md:text-3xl font-black uppercase text-gray-900 bg-transparent border-b border-dashed border-gray-300 outline-none w-full font-heading"
                          placeholder="Heading"
                        />
                        <textarea
                          rows={4}
                          value={cleanText(section.quote || "Since its inception, BWEIC has become an essential refuge for Black women to heal, reclaim their power, and build meaningful lives together.")}
                          onChange={(e) => onSectionChange(sectionId, "quote", e.target.value)}
                          className="w-full text-base md:text-lg italic font-serif text-gray-700 bg-transparent border border-dashed border-gray-300 rounded-xl p-3 outline-none"
                          placeholder="Founder Quote"
                        />
                        <div className="pt-2">
                          <input
                            value={cleanText(section.author_name || "Amelia K. Hamilton")}
                            onChange={(e) => onSectionChange(sectionId, "author_name", e.target.value)}
                            className="font-bold text-gray-900 uppercase tracking-widest text-sm bg-transparent border-b border-dashed border-gray-300 outline-none block"
                            placeholder="Author Name"
                          />
                          <input
                            value={cleanText(section.author_title || "FOUNDER")}
                            onChange={(e) => onSectionChange(sectionId, "author_title", e.target.value)}
                            className="text-xs text-gray-500 uppercase tracking-widest bg-transparent border-b border-dashed border-gray-300 outline-none block mt-1"
                            placeholder="Author Title"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2b. KMFW WHY WE WORK DIFFERENTLY (2-COLUMN STATS & CARDS LAYOUT) */}
                  {(lowerId === "whyweworkdifferently" || sectionId === "whyWeWorkDifferently") && (
                    <div className="bg-white text-gray-900 p-8 md:p-12 rounded-3xl shadow-xl space-y-12">
                      <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Left Column: Heading, Body, Quote */}
                        <div className="space-y-6 text-left">
                          {/* Growth Badge */}
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                            <input
                              value={cleanText(section.growthBadgeText || "+5% increase in Black-identifying new residents (2016–2021)")}
                              onChange={(e) => onSectionChange(sectionId, "growthBadgeText", e.target.value)}
                              className="bg-transparent outline-none w-full text-xs font-bold text-emerald-800"
                              placeholder="Growth Badge Text"
                            />
                          </div>

                          {/* Main Heading */}
                          <input
                            value={cleanText(section.heading || "Why do we have to work differently at KMFW?")}
                            onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                            className="text-2xl md:text-4xl font-extrabold text-gray-900 bg-transparent border-b border-dashed border-gray-300 outline-none w-full font-heading"
                            placeholder="Section Heading"
                          />

                          {/* Body Text */}
                          <textarea
                            rows={4}
                            value={cleanText(section.bodyText || section.content || "Analyzing our region's municipal, provincial, and federal data between 2016 and 2021...")}
                            onChange={(e) => {
                              onSectionChange(sectionId, "bodyText", e.target.value);
                              onSectionChange(sectionId, "content", e.target.value);
                            }}
                            className="w-full text-sm text-gray-600 bg-transparent border border-dashed border-gray-300 rounded-xl p-3 outline-none leading-relaxed"
                            placeholder="Main section description..."
                          />

                          {/* Quote Block */}
                          <div className="p-6 bg-gray-50 rounded-2xl border-l-4 border-[#008080] space-y-3">
                            <textarea
                              rows={3}
                              value={cleanText(section.quote || "Recognizing systemic barriers, we address the health and social needs of Black-identifying persons with culturally grounded support.")}
                              onChange={(e) => onSectionChange(sectionId, "quote", e.target.value)}
                              className="w-full text-xs md:text-sm italic text-gray-700 bg-transparent border-b border-dashed border-gray-300 outline-none"
                              placeholder="Director / Founder Quote"
                            />
                            <div className="flex gap-4">
                              <input
                                value={cleanText(section.quoteAuthor || "Ajirioghene Evi")}
                                onChange={(e) => onSectionChange(sectionId, "quoteAuthor", e.target.value)}
                                className="font-bold text-xs text-gray-900 bg-transparent border-b border-dashed border-gray-300 outline-none"
                                placeholder="Quote Author"
                              />
                              <input
                                value={cleanText(section.quoteAuthorTitle || "Founding Director")}
                                onChange={(e) => onSectionChange(sectionId, "quoteAuthorTitle", e.target.value)}
                                className="text-xs text-gray-500 bg-transparent border-b border-dashed border-gray-300 outline-none"
                                placeholder="Author Title"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Column: 2016 vs 2021 Stats Comparison + Chart Illustration */}
                        <div className="space-y-6">
                          <input
                            value={cleanText(section.statsTitle || "Waterloo Region by the Numbers")}
                            onChange={(e) => onSectionChange(sectionId, "statsTitle", e.target.value)}
                            className="text-lg font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 outline-none w-full"
                            placeholder="Stats Comparison Title"
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-1">
                              <input
                                value={cleanText(section.stat2016Value || "~15,000")}
                                onChange={(e) => onSectionChange(sectionId, "stat2016Value", e.target.value)}
                                className="text-2xl md:text-3xl font-black text-gray-900 bg-transparent outline-none text-center w-full"
                                placeholder="2016 Value"
                              />
                              <input
                                value={cleanText(section.stat2016Label || "Black Population in 2016")}
                                onChange={(e) => onSectionChange(sectionId, "stat2016Label", e.target.value)}
                                className="text-[11px] text-gray-500 bg-transparent outline-none text-center w-full"
                                placeholder="2016 Label"
                              />
                            </div>

                            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
                              <input
                                value={cleanText(section.stat2021Value || "~26,500")}
                                onChange={(e) => onSectionChange(sectionId, "stat2021Value", e.target.value)}
                                className="text-2xl md:text-3xl font-black text-emerald-700 bg-transparent outline-none text-center w-full"
                                placeholder="2021 Value"
                              />
                              <input
                                value={cleanText(section.stat2021Label || "Black Population in 2021")}
                                onChange={(e) => onSectionChange(sectionId, "stat2021Label", e.target.value)}
                                className="text-[11px] text-emerald-800 font-semibold bg-transparent outline-none text-center w-full"
                                placeholder="2021 Label"
                              />
                            </div>
                          </div>

                          {/* Sub-section Header */}
                          <div className="pt-4 border-t border-gray-200 space-y-2">
                            <input
                              value={cleanText(section.subSectionHeading || "WATERLOO REGION BY THE NUMBERS")}
                              onChange={(e) => onSectionChange(sectionId, "subSectionHeading", e.target.value)}
                              className="text-xs font-bold uppercase tracking-widest text-[#008080] bg-transparent border-b border-dashed border-gray-300 outline-none w-full"
                              placeholder="Sub-section Tagline"
                            />
                            <textarea
                              rows={2}
                              value={cleanText(section.subSectionText || "One of our Research Coordinators has captured the growing diversity of Black-identified persons in our region.")}
                              onChange={(e) => onSectionChange(sectionId, "subSectionText", e.target.value)}
                              className="w-full text-xs text-gray-600 bg-transparent border border-dashed border-gray-300 rounded-xl p-2 outline-none"
                              placeholder="Sub-section Description"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stat Cards Grid (8 Cards) */}
                      <div className="pt-6 border-t border-gray-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Regional Demographic Data Cards ({cards.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddItem(sectionId)}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Statistic Card
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {cards.map((card: any, cIdx: number) => {
                            const isCardSelected = selected.type === "card" && selected.sectionId === sectionId && selected.cardIndex === cIdx;
                            const cardBg = card.color || (cIdx % 2 === 0 ? "#F8FAFC" : "#F0FDF4");

                            return (
                              <div
                                key={cIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelect({ type: "card", sectionId, cardIndex: cIdx });
                                }}
                                style={{ backgroundColor: cardBg }}
                                className={`relative group/kCard p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                                  isCardSelected
                                    ? "border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                                    : "border-gray-200 hover:border-gray-400"
                                }`}
                              >
                                <div className="space-y-2">
                                  <input
                                    value={cleanText(getCardTitle(card))}
                                    onChange={(e) => onItemChange(sectionId, cIdx, getCardTitleKey(card), e.target.value)}
                                    className="text-2xl font-black text-gray-900 bg-transparent border-b border-dashed border-gray-400/50 outline-none w-full"
                                    placeholder="Stat (e.g. 16.7%)"
                                  />
                                  <textarea
                                    rows={4}
                                    value={cleanText(getCardDescription(card))}
                                    onChange={(e) => onItemChange(sectionId, cIdx, getCardDescriptionKey(card), e.target.value)}
                                    className="w-full text-xs text-gray-700 bg-transparent border-b border-dashed border-gray-400/50 outline-none leading-relaxed"
                                    placeholder="Demographic description..."
                                  />
                                </div>

                                <div className="pt-3 flex items-center justify-between opacity-0 group-hover/kCard:opacity-100 transition-opacity">
                                  <span className="text-[10px] text-gray-400 font-mono">#{cIdx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteItem(sectionId, cIdx);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete Card"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2c. MISSION & VISION (2-COLUMN SPLIT WITH ACCENT BARS) */}
                  {((lowerId === "mission" && !cards?.length) || lowerId === "vision" || lowerId === "mission_vision") && (
                    <div className="bg-gray-50 text-gray-900 p-8 md:p-14 rounded-3xl shadow-xl space-y-8">
                      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
                        {/* Mission Card */}
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-left space-y-4">
                          <div className="w-16 h-1 bg-[#C5A059] mb-4"></div>
                          <input
                            value={cleanText((content?.mission?.heading || content?.sections?.mission?.heading || section.heading || "Mission"))}
                            onChange={(e) => {
                              onSectionChange("mission", "heading", e.target.value);
                              if (sectionId !== "mission") onSectionChange(sectionId, "heading", e.target.value);
                            }}
                            className="text-2xl md:text-3xl font-black uppercase text-gray-900 bg-transparent border-b border-dashed border-gray-300 outline-none w-full font-heading"
                            placeholder="Mission Title"
                          />
                          <textarea
                            rows={4}
                            value={cleanText((content?.mission?.content || content?.sections?.mission?.content || section.content || "To create safe, affirming spaces where Black women in Canada can heal, grow, and reclaim their power—emotionally, economically, and socially—through community, education, advocacy, and storytelling."))}
                            onChange={(e) => {
                              onSectionChange("mission", "content", e.target.value);
                              if (sectionId !== "mission") onSectionChange(sectionId, "content", e.target.value);
                            }}
                            className="w-full text-base md:text-lg text-gray-700 leading-relaxed bg-transparent border border-dashed border-gray-300 rounded-xl p-3 outline-none"
                            placeholder="Mission Description"
                          />
                        </div>

                        {/* Vision Card */}
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-left space-y-4">
                          <div className="w-16 h-1 bg-[#C5A059] mb-4"></div>
                          <input
                            value={cleanText((content?.vision?.heading || content?.sections?.vision?.heading || "Vision"))}
                            onChange={(e) => {
                              onSectionChange("vision", "heading", e.target.value);
                            }}
                            className="text-2xl md:text-3xl font-black uppercase text-gray-900 bg-transparent border-b border-dashed border-gray-300 outline-none w-full font-heading"
                            placeholder="Vision Title"
                          />
                          <textarea
                            rows={4}
                            value={cleanText((content?.vision?.content || content?.sections?.vision?.content || "A Canada where Black women are thriving, supported, and leading with confidence, dignity, and shared purpose."))}
                            onChange={(e) => {
                              onSectionChange("vision", "content", e.target.value);
                            }}
                            className="w-full text-base md:text-lg text-gray-700 leading-relaxed bg-transparent border border-dashed border-gray-300 rounded-xl p-3 outline-none"
                            placeholder="Vision Description"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2d. ORIGIN STORY / HOW WE BEGAN (PROSE NARRATIVE) */}
                  {(lowerId === "story" || lowerId === "originstory") && (
                    <div className="bg-white text-gray-900 p-8 md:p-14 rounded-3xl shadow-xl space-y-8 max-w-4xl mx-auto">
                      <div className="text-center space-y-4">
                        <input
                          value={cleanText(section.heading || "How We Began")}
                          onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                          className="text-3xl md:text-5xl font-black uppercase text-gray-900 bg-transparent border-b border-dashed border-gray-300 outline-none text-center w-full font-heading"
                          placeholder="Story Heading"
                        />
                        <div className="w-16 h-1 bg-[#C5A059] mx-auto"></div>
                      </div>

                      <div className="text-left">
                        <textarea
                          rows={10}
                          value={cleanText(section.content || "Black Women Empowerment Initiative Canada (BWEIC) was created in response to a simple but urgent truth...")}
                          onChange={(e) => onSectionChange(sectionId, "content", e.target.value)}
                          className="w-full text-base md:text-lg text-gray-700 leading-relaxed bg-transparent border border-dashed border-gray-300 rounded-2xl p-5 outline-none font-sans"
                          placeholder="Enter your origin story..."
                        />
                      </div>
                    </div>
                  )}

                  {/* 2e. CALL TO ACTION (CTA BANNER) */}
                  {lowerId === "cta" && (
                    <div className="bg-[#C5A059] text-white p-10 md:p-16 rounded-3xl shadow-2xl text-center space-y-6 max-w-4xl mx-auto">
                      <input
                        value={cleanText(section.heading || "Join Our Community")}
                        onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                        className="text-3xl md:text-5xl font-black uppercase text-white bg-transparent border-b border-dashed border-white/40 outline-none text-center w-full font-heading"
                        placeholder="CTA Heading"
                      />
                      <textarea
                        rows={2}
                        value={cleanText(section.content || "Be part of a growing circle of Black women moving from survival to sovereignty.")}
                        onChange={(e) => onSectionChange(sectionId, "content", e.target.value)}
                        className="text-lg md:text-xl text-white/90 bg-transparent border border-dashed border-white/40 rounded-xl p-3 outline-none text-center w-full max-w-2xl mx-auto"
                        placeholder="CTA Description"
                      />

                      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <div className="bg-white text-black px-8 py-3.5 rounded-full font-bold text-xs uppercase shadow-xl">
                          <input
                            value={cleanText(section.buttonText || section.cta || "Attend an Event")}
                            onChange={(e) => {
                              onSectionChange(sectionId, "buttonText", e.target.value);
                              onSectionChange(sectionId, "cta", e.target.value);
                            }}
                            className="bg-transparent text-black font-bold uppercase text-xs outline-none text-center"
                            placeholder="Primary Button Text"
                          />
                        </div>
                        <div className="bg-black text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase shadow-xl">
                          <input
                            value={cleanText(section.secondaryButtonText || section.secondaryCta || "Get Involved")}
                            onChange={(e) => {
                              onSectionChange(sectionId, "secondaryButtonText", e.target.value);
                              onSectionChange(sectionId, "secondaryCta", e.target.value);
                            }}
                            className="bg-transparent text-white font-bold uppercase text-xs outline-none text-center"
                            placeholder="Secondary Button Text"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. LIVE UPCOMING EVENTS STREAM SECTION */}
                  {isEvents && (
                    <div className="space-y-8">
                      {/* Events Header */}
                      <div className="text-center max-w-3xl mx-auto space-y-3">
                        <input
                          value={cleanText(section.subtitle || "Join Us")}
                          onChange={(e) => onSectionChange(sectionId, "subtitle", e.target.value)}
                          className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37] bg-transparent border-b border-dashed border-gray-700 outline-none text-center w-full"
                          placeholder="Subtitle / Badge"
                        />
                        <input
                          value={cleanText(section.heading || "Upcoming Events")}
                          onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                          className="text-3xl md:text-5xl font-black uppercase text-white bg-transparent border-b border-dashed border-gray-700 outline-none text-center w-full font-heading"
                          placeholder="Events Headline"
                        />
                        <textarea
                          rows={2}
                          value={cleanText(section.content || "Connect with our community through healing circles, workshops, and celebration events designed to empower and inspire.")}
                          onChange={(e) => onSectionChange(sectionId, "content", e.target.value)}
                          className="text-sm text-gray-400 bg-transparent border border-dashed border-gray-800 rounded-xl p-3 outline-none text-center w-full"
                          placeholder="Events Description"
                        />
                      </div>

                      {/* Events Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {liveEvents.slice(0, section.count || 3).map((event: any, evIdx: number) => (
                          <div
                            key={evIdx}
                            className="bg-[#0E0E0E] border border-gray-800 rounded-2xl overflow-hidden group/event hover:border-[#D4AF37] transition-all flex flex-col justify-between"
                          >
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={event.imageUrl || event.image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover/event:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-700 text-[10px] font-mono text-[#D4AF37] font-bold">
                                {formatEventDate(event.date)}
                              </div>
                            </div>

                            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-1">
                                  {cleanText(event.category || "Community Event")}
                                </span>
                                <h4 className="text-lg font-bold text-white leading-snug font-heading group-hover/event:text-[#D4AF37] transition-colors">
                                  {cleanText(event.title || "Event Title")}
                                </h4>
                                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                                  {cleanText(event.description || "Join us for an empowering gathering and connection space.")}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-gray-900 flex items-center justify-between text-xs text-[#D4AF37] font-bold uppercase">
                                <span>Learn More</span>
                                <ArrowRight size={14} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA Link */}
                      <div className="text-center pt-4">
                        <div className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-[#D4AF37]/50 text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:bg-[#D4AF37] hover:text-black transition-all">
                          <input
                            value={cleanText(section.ctaText || "View All Events")}
                            onChange={(e) => onSectionChange(sectionId, "ctaText", e.target.value)}
                            className="bg-transparent text-current font-bold uppercase text-xs outline-none text-center"
                            placeholder="CTA Label"
                          />
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. LATEST BLOG & NEWS STREAM SECTION */}
                  {isBlog && (
                    <div className="space-y-8">
                      {/* Blog Header */}
                      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-800 pb-6">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">
                            Stories & Updates
                          </span>
                          <input
                            value={cleanText(section.heading || "Our Latest Blog & News")}
                            onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                            className="text-3xl md:text-5xl font-black uppercase text-white bg-transparent border-b border-dashed border-gray-700 outline-none font-heading w-full md:w-auto"
                            placeholder="Blog Headline"
                          />
                        </div>
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand,#D4AF37)] text-black rounded-full font-bold text-xs uppercase tracking-wider shadow-lg">
                          <input
                            value={cleanText(section.buttonText || "View More")}
                            onChange={(e) => onSectionChange(sectionId, "buttonText", e.target.value)}
                            className="bg-transparent text-black font-bold uppercase text-xs outline-none text-center"
                            placeholder="View More"
                          />
                          <ArrowRight size={13} />
                        </div>
                      </div>

                      {/* Articles Grid */}
                      {(() => {
                        const selectedCats: string[] = section.selectedCategories || section.categories || [];
                        const filteredArticles = selectedCats.length > 0
                          ? liveArticles.filter((art: any) => art.category && selectedCats.some((cat: string) => art.category.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(art.category.toLowerCase())))
                          : liveArticles;
                        const displayArticles = filteredArticles.length > 0 ? filteredArticles : liveArticles;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {displayArticles.slice(0, section.count || 3).map((art: any, aIdx: number) => (
                              <div
                                key={aIdx}
                                className="bg-[#0E0E0E] border border-gray-800 rounded-2xl overflow-hidden group/article hover:border-[#D4AF37] transition-all flex flex-col justify-between"
                              >
                                <div className="relative h-48 overflow-hidden">
                                  <img
                                    src={art.imageUrl || art.image || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop"}
                                    alt={art.title}
                                    className="w-full h-full object-cover group-hover/article:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs px-3 py-1 rounded-full border border-gray-700 text-[10px] font-mono text-[#D4AF37] font-bold">
                                    {formatEventDate(art.date)}
                                  </div>
                                </div>

                                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-1">
                                      {cleanText(art.category || "Article")}
                                    </span>
                                    <h4 className="text-lg font-bold text-white leading-snug font-heading group-hover/article:text-[#D4AF37] transition-colors">
                                      {cleanText(art.title || "Article Title")}
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                                      {cleanText(art.excerpt || art.description || "Read our latest perspective and reflection.")}
                                    </p>
                                  </div>

                                  <div className="pt-3 border-t border-gray-900 flex items-center justify-between text-xs text-[#D4AF37] font-bold uppercase">
                                    <span>Read Full Story</span>
                                    <ArrowRight size={14} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 5. IMAGE GALLERY SLIDESHOW SECTION */}
                  {isGallery && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon size={16} className="text-purple-400" />
                          <span className="text-xs uppercase font-bold text-gray-300">Continuous Image Gallery Track</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newImages = [...galleryImages, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"];
                            onSectionChange(sectionId, "images", newImages.map(url => ({ url })));
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Plus size={12} /> Add Photo
                        </button>
                      </div>

                      {/* Horizontal Scrolling Gallery Preview */}
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                        {galleryImages.map((imgUrl, gIdx) => (
                          <div
                            key={gIdx}
                            className="relative group/galleryImg shrink-0 w-64 h-44 rounded-2xl overflow-hidden border border-gray-800"
                          >
                            <img
                              src={imgUrl}
                              alt={`Gallery ${gIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/galleryImg:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImagePickerTarget({
                                    sectionId,
                                    field: "images",
                                    cardIdx: gIdx,
                                    currentUrl: imgUrl
                                  });
                                }}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                                title="Change Photo"
                              >
                                <Camera size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = galleryImages.filter((_, i) => i !== gIdx);
                                  onSectionChange(sectionId, "images", updated.map(url => ({ url })));
                                }}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow"
                                title="Remove Photo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. MULTI-COLUMN CARDS, PILLARS, STATS & CUSTOM GRIDS */}
                  {lowerId !== "hero" && lowerId !== "founder" && lowerId !== "whyweworkdifferently" && !(lowerId === "mission" && !cards?.length) && lowerId !== "vision" && lowerId !== "mission_vision" && lowerId !== "story" && lowerId !== "originstory" && lowerId !== "cta" && !isEvents && !isBlog && !isGallery && (
                    <div 
                      className="space-y-10 p-6 md:p-10 rounded-3xl transition-colors"
                      style={{ 
                        backgroundColor: section.bgColor || undefined,
                        color: section.textColor || undefined
                      }}
                    >
                      {/* Section Header */}
                      <div className={`max-w-3xl mx-auto space-y-3 ${
                        (section.textAlign === "left") ? "text-left" : (section.textAlign === "right") ? "text-right" : "text-center"
                      }`}>
                        <input
                          value={cleanText(section.subtitle || (isImpact ? "Transforming Lives Across Canada" : isMission ? "Why Choose BWEIC" : ""))}
                          onChange={(e) => onSectionChange(sectionId, "subtitle", e.target.value)}
                          className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37] bg-transparent border-b border-dashed border-gray-700 outline-none w-full"
                          style={{ textAlign: (section.textAlign as any) || "center" }}
                          placeholder="Subtitle / Tagline"
                        />
                        <textarea
                          rows={2}
                          value={cleanText(section.heading || (isImpact ? "Our Measurable Impact" : isMission ? "Why Choose BWEIC" : config.label))}
                          onChange={(e) => onSectionChange(sectionId, "heading", e.target.value)}
                          className={`font-black uppercase bg-transparent border-b border-dashed border-gray-700 outline-none w-full font-heading ${
                            section.fontSize || "text-2xl md:text-4xl"
                          }`}
                          style={{ 
                            color: section.headingColor || (section.bgColor === "#FFFFFF" ? "#0A0A0A" : "#FFFFFF"),
                            textAlign: (section.textAlign as any) || "center" 
                          }}
                          placeholder="Section Heading"
                        />
                        {section.content && (
                          <textarea
                            rows={3}
                            value={cleanText(section.content || "")}
                            onChange={(e) => onSectionChange(sectionId, "content", e.target.value)}
                            className="text-sm bg-transparent border border-dashed border-gray-800 rounded-xl p-3 outline-none w-full"
                            style={{ 
                              color: section.textColor || (section.bgColor === "#FFFFFF" ? "#4B5563" : "#9CA3AF"),
                              textAlign: (section.textAlign as any) || "center" 
                            }}
                            placeholder="Section Body Description"
                          />
                        )}
                      </div>

                      {/* Cards Grid */}
                      <div className={`grid gap-6 ${
                        colCount === 4
                          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                          : colCount === 3 
                            ? "grid-cols-1 md:grid-cols-3" 
                            : colCount === 2 
                              ? "grid-cols-1 md:grid-cols-2" 
                              : "grid-cols-1 max-w-3xl mx-auto"
                      }`}>
                        {cards.map((item: any, cardIdx: number) => {
                          const isStatCard = item.value !== undefined;
                          const isCardSelected = selected.type === "card" && selected.sectionId === sectionId && selected.cardIndex === cardIdx;
                          
                          return (
                            <div
                              key={cardIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect({ type: "card", sectionId, cardIndex: cardIdx });
                              }}
                              className={`relative group/card bg-[#0E0E0E] p-6 rounded-2xl flex flex-col justify-between transition-all shadow-lg border ${
                                isCardSelected 
                                  ? "border-blue-500 ring-2 ring-blue-500/20" 
                                  : "border-gray-800 hover:border-[#D4AF37]"
                              }`}
                            >
                              {/* Card Hover Action Toolbar */}
                              <div className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 flex items-center gap-1 bg-gray-900/90 border border-gray-700 p-1 rounded-lg z-10 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteItem(sectionId, cardIdx);
                                  }}
                                  className="p-1 text-red-400 hover:bg-red-950/40 rounded"
                                  title="Delete Card"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              <div className="space-y-4">
                                {/* If Stat Counter Card */}
                                {isStatCard ? (
                                  <div className="text-center space-y-2 py-4">
                                    <input
                                      value={cleanText(item.value || "500+")}
                                      onChange={(e) => onItemChange(sectionId, cardIdx, "value", e.target.value)}
                                      className="text-4xl md:text-5xl font-black text-[#D4AF37] bg-transparent border-b border-dashed border-gray-800 outline-none text-center w-full font-heading"
                                      placeholder="500+"
                                    />
                                    <input
                                      value={cleanText(item.label || "Black Women Served")}
                                      onChange={(e) => onItemChange(sectionId, cardIdx, "label", e.target.value)}
                                      className="text-xs font-bold uppercase tracking-wider text-gray-200 bg-transparent border-b border-dashed border-gray-800 outline-none text-center w-full"
                                      placeholder="Metric Label"
                                    />
                                    <input
                                      value={cleanText(item.description || "across Canada")}
                                      onChange={(e) => onItemChange(sectionId, cardIdx, "description", e.target.value)}
                                      className="text-[11px] text-gray-400 bg-transparent border-b border-dashed border-gray-800 outline-none text-center w-full"
                                    placeholder="Sub-description"
                                    />
                                  </div>
                                ) : (
                                  /* Standard Card / Pillar */
                                  <>
                                    {/* Card Image if present */}
                                    {getCardImage(item) && (
                                      <div className="relative group/cardPhoto h-44 rounded-xl overflow-hidden">
                                        <img
                                          src={getCardImage(item)}
                                          alt={getCardTitle(item) || "Card Photo"}
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveImagePickerTarget({
                                              sectionId,
                                              field: sectionArrayKey,
                                              cardIdx,
                                              currentUrl: getCardImage(item)
                                            });
                                          }}
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/cardPhoto:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity"
                                        >
                                          <Camera size={14} /> Change Photo
                                        </button>
                                      </div>
                                    )}

                                    {/* Card Tag */}
                                    {getCardTag(item) && (
                                      <input
                                        value={cleanText(getCardTag(item))}
                                        onChange={(e) => onItemChange(sectionId, cardIdx, getCardTagKey(item), e.target.value)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-transparent border-b border-dashed border-gray-800 outline-none w-full block"
                                        placeholder="Tag / Category"
                                      />
                                    )}

                                    {/* Card Title */}
                                    <input
                                      value={cleanText(getCardTitle(item))}
                                      onChange={(e) => onItemChange(sectionId, cardIdx, getCardTitleKey(item), e.target.value)}
                                      className="text-lg font-bold text-white bg-transparent border-b border-dashed border-gray-800 outline-none w-full block font-heading"
                                      placeholder="Card Title / Metric"
                                    />

                                    {/* Card Description */}
                                    <textarea
                                      rows={3}
                                      value={cleanText(getCardDescription(item))}
                                      onChange={(e) => onItemChange(sectionId, cardIdx, getCardDescriptionKey(item), e.target.value)}
                                      className="w-full text-xs text-gray-400 bg-transparent border border-dashed border-gray-900 rounded-lg p-2 outline-none leading-relaxed"
                                      placeholder="Card Description..."
                                    />
                                  </>
                                )}
                              </div>

                              {/* Card Link / CTA */}
                              {item.link && (
                                <div className="mt-4 pt-3 border-t border-gray-900 flex items-center justify-between">
                                  <input
                                    value={cleanText(item.cta || "Learn More")}
                                    onChange={(e) => onItemChange(sectionId, cardIdx, "cta", e.target.value)}
                                    className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-transparent outline-none"
                                    placeholder="CTA Label"
                                  />
                                  <ArrowRight size={13} className="text-[#D4AF37]" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* + Add Card Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddItem(sectionId);
                          }}
                          className="border-2 border-dashed border-gray-800 hover:border-blue-500 rounded-2xl min-h-[200px] flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-blue-400 font-bold text-xs transition-all bg-gray-950/30 hover:bg-blue-950/10"
                        >
                          <Plus size={20} />
                          <span>+ Add New Card</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Modal Image Picker for Click-to-Replace */}
      {activeImagePickerTarget && (
        <Modal
          isOpen={true}
          onClose={() => setActiveImagePickerTarget(null)}
          title="Choose or Upload Photo"
        >
          <div className="p-4 space-y-4">
            <ImagePicker
              value={activeImagePickerTarget.currentUrl || ""}
              onChange={(newUrl) => {
                const target = activeImagePickerTarget;
                if (target.field === "slides" && typeof target.cardIdx === "number") {
                  const currentSlides = content?.hero?.slides || DEFAULT_HERO_SLIDES;
                  const updated = [...currentSlides];
                  updated[target.cardIdx] = { ...updated[target.cardIdx], imageUrl: newUrl, image: newUrl };
                  onSectionChange(target.sectionId, "slides", updated);
                } else if (target.field === "items" && typeof target.cardIdx === "number") {
                  onItemChange(target.sectionId, target.cardIdx, "imageUrl", newUrl);
                } else if (target.field === "images" && typeof target.cardIdx === "number") {
                  const currentImages = (content?.[target.sectionId]?.images || DEFAULT_GALLERY_IMAGES).map((img: any) => typeof img === "string" ? img : img.url);
                  const updated = [...currentImages];
                  updated[target.cardIdx] = newUrl;
                  onSectionChange(target.sectionId, "images", updated.map(url => ({ url })));
                } else if (target.field === "images") {
                  onSectionChange(target.sectionId, "images", [{ url: newUrl, alt: "Photo" }]);
                }
                setActiveImagePickerTarget(null);
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
