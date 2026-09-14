import React, { useState, useEffect } from "react";
import { X, Search, Pin, Sparkles, Plus, Layers, Layers2, Compass, Menu, Database, Star, Image, Share2, Shield, Sliders, Palette, Info, Archive, Calendar, Undo2, LayoutGrid, Split, PlaySquare, PanelRightClose, PanelRightOpen, ChevronRight, ChevronLeft } from "lucide-react";
import Input from "@/components/form/input/InputField";
import { useSite } from "@/context/SiteContext";

interface InsertSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  reusableComponents: any[];
  archivedComponents?: any[];
  onAddReusable: (comp: any) => void;
  onAddBlankSection: (title: string) => void;
  docked?: boolean;
}

type CategoryItem = {
  id: string;
  name: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
};

type Group = {
  title: string;
  items: CategoryItem[];
};

// Generic, tenant-neutral structural blueprints (zero client-specific hardcoding)
const GENERIC_BUILTIN_BLOCKS = [
  {
    id: "hero_banner",
    reusableLabel: "Hero Banner (Featured Header)",
    embed: "hero_slider",
    heading: "Inspiring Headline For Your Community",
    subtitle: "Share your organization's mission, values, and primary call to action.",
    pillText: "COMMUNITY & IMPACT INITIATIVE",
    cta: "LEARN MORE",
    link: "/about",
    secondaryCta: "GET INVOLVED",
    secondaryLink: "/contact",
    icon: "PlaySquare",
    category: "Hero & Headers"
  },
  {
    id: "split_2col",
    reusableLabel: "2-Column Split Feature (50/50)",
    layout: "2-col",
    columns: 2,
    heading: "Our Approach & Strategic Focus",
    subtitle: "What We Do",
    items: [
      { title: "Core Initiative One", desc: "Equipping participants with dedicated tools, resources, and mentorship." },
      { title: "Core Initiative Two", desc: "Collaborating with local community partners to deliver lasting impact." }
    ],
    icon: "Split",
    category: "Layout Grids"
  },
  {
    id: "grid_3col",
    reusableLabel: "3-Column Card Grid (33/33/33)",
    layout: "3-col",
    columns: 3,
    heading: "Featured Programs & Services",
    subtitle: "Our Offerings",
    items: [
      { title: "Program Offering One", desc: "Empowering communities through dedicated support and safe spaces." },
      { title: "Program Offering Two", desc: "Hands-on workshops, personal development, and growth pathways." },
      { title: "Program Offering Three", desc: "Community outreach, resource navigation, and family wellness." }
    ],
    icon: "LayoutGrid",
    category: "Layout Grids"
  },
  {
    id: "gallery_slider",
    reusableLabel: "Photo Gallery & Carousel Divider",
    embed: "gallery",
    heading: "Community Moments & Gallery",
    subtitle: "A Glimpse Into Our Impact",
    images: [],
    icon: "Image",
    category: "Sections & Layouts"
  },
  {
    id: "events_stream",
    reusableLabel: "Live Upcoming Events Stream",
    embed: "events",
    heading: "Upcoming Gatherings & Events",
    subtitle: "Join Our Community",
    count: 3,
    ctaText: "View All Events",
    icon: "Calendar",
    category: "Dynamic Feeds"
  },
  {
    id: "impact_stats",
    reusableLabel: "Measurable Impact Statistics",
    embed: "impact",
    heading: "Our Measurable Impact",
    subtitle: "Making A Difference Together",
    stats: [
      { value: "500+", label: "Individuals Supported" },
      { value: "50+", label: "Workshops & Gatherings" },
      { value: "10+", label: "Partner Organizations" }
    ],
    icon: "Sparkles",
    category: "Sections & Layouts"
  },
  {
    id: "newsletter_subscribe",
    reusableLabel: "Newsletter / Stay Connected",
    embed: "newsletter",
    heading: "Stay Connected With Our Updates",
    subtitle: "Subscribe to our monthly community bulletin.",
    buttonText: "Subscribe",
    placeholder: "Enter your email address",
    icon: "Sparkles",
    category: "Forms & CTAs"
  }
];

export default function InsertSidebar({
  isOpen,
  onClose,
  reusableComponents,
  archivedComponents = [],
  onAddReusable,
  onAddBlankSection,
  docked = false,
}: InsertSidebarProps) {
  const { currentSite } = useSite();
  const [activeTab, setActiveTab] = useState("sections");
  const [searchQuery, setSearchQuery] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [isDockedCollapsed, setIsDockedCollapsed] = useState(false);

  // Close on Escape key press (only in drawer mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !docked && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, docked, onClose]);

  if (!isOpen && !docked) return null;

  const groups: Group[] = [
    {
      title: "Basics",
      items: [
        { id: "sections", name: "Components", icon: <Layers className="w-4 h-4" /> },
        { id: "archived", name: "Archived", icon: <Archive className="w-4 h-4" /> },
        { id: "navigation", name: "Navigation", icon: <Compass className="w-4 h-4" />, comingSoon: true },
        { id: "menus", name: "Menus", icon: <Menu className="w-4 h-4" />, comingSoon: true },
      ],
    },
    {
      title: "CMS",
      items: [
        { id: "collections", name: "Collections", icon: <Database className="w-4 h-4" />, comingSoon: true },
        { id: "fields", name: "Fields", icon: <Sliders className="w-4 h-4" />, comingSoon: true },
      ],
    },
    {
      title: "Elements",
      items: [
        { id: "icons", name: "Icons", icon: <Star className="w-4 h-4" />, comingSoon: true },
        { id: "media", name: "Media", icon: <Image className="w-4 h-4" />, comingSoon: true },
        { id: "interactive", name: "Interactive", icon: <Sparkles className="w-4 h-4" />, comingSoon: true },
        { id: "social", name: "Social", icon: <Share2 className="w-4 h-4" />, comingSoon: true },
      ],
    },
  ];

  const handleAddBlank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    onAddBlankSection(newSectionTitle.trim());
    setNewSectionTitle("");
  };

  // Combine generic blueprints + site-specific reusable components
  // Strict tenant isolation: only include reusables belonging to currentSite or explicitly created for it
  const tenantReusables = (reusableComponents || []).filter((c) => {
    if (!c) return false;
    // If tagged with a specific siteId, only allow if it matches currentSite.id
    if (c.siteId && c.siteId !== currentSite.id) return false;
    return true;
  });

  const allAvailableComponents = [
    ...GENERIC_BUILTIN_BLOCKS,
    ...tenantReusables.filter(c => !GENERIC_BUILTIN_BLOCKS.some(d => d.id === c.id))
  ];

  const filteredComponents = allAvailableComponents.filter((comp) => {
    const label = comp.reusableLabel || comp.heading || comp.title || comp.id || "";
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredArchived = (archivedComponents || [])
    .filter((comp) => {
      if (!comp) return false;
      if (comp.sourcePageId && comp.siteId && comp.siteId !== currentSite.id) return false;
      return true;
    })
    .filter((comp) => {
      const label = comp.label || comp.heading || comp.reusableLabel || comp.originalSectionId || comp.id || "";
      return label.toLowerCase().includes(searchQuery.toLowerCase());
    });

  // Render Docked Shopify-Style Mode
  if (docked) {
    if (isDockedCollapsed) {
      return (
        <div className="relative shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 flex flex-col items-center py-4 px-2 select-none">
          <button
            onClick={() => setIsDockedCollapsed(false)}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all shadow-xs flex flex-col items-center gap-1.5"
            title="Expand Component Library (Shopify side section)"
          >
            <PanelRightOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider writing-vertical [writing-mode:vertical-rl] py-2 text-gray-500 hover:text-blue-600">
              Add Sections
            </span>
          </button>
        </div>
      );
    }

    return (
      <div className="relative h-full w-[380px] lg:w-[420px] shrink-0 border-l border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl flex flex-col shadow-xs transition-all duration-300">
        {/* Docked Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Layers2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-xs tracking-tight">
                Add Section & Elements
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Shopify-style live component dock
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsDockedCollapsed(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title="Collapse Component Library"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-gray-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] px-3 py-2 gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("sections")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "sections"
                ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-xs border border-black/5 dark:border-white/10"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Components
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "archived"
                ? "bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 shadow-xs border border-black/5 dark:border-white/10"
                : "text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Archived
            {archivedComponents.length > 0 && (
              <span className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-mono border border-amber-500/20">
                {archivedComponents.length}
              </span>
            )}
          </button>
        </div>

        {/* Search & Custom Add Input */}
        <div className="p-3 border-b border-gray-100 dark:border-white/5 space-y-2.5 bg-white/30 dark:bg-white/[0.01] shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search components (Hero, Gallery, FAQ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white backdrop-blur-sm"
            />
          </div>

          <form onSubmit={handleAddBlank} className="flex gap-1.5">
            <input
              type="text"
              placeholder="+ New custom section name"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white backdrop-blur-sm"
            />
            <button
              type="submit"
              className="px-3.5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-1 shrink-0 shadow-xs transition-all hover:shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        {/* Scrollable Component List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {activeTab === "sections" ? (
            filteredComponents.length > 0 ? (
              <div className="grid gap-2">
                {filteredComponents.map((comp) => {
                  const label = comp.reusableLabel || comp.heading || comp.title || comp.id;
                  return (
                    <div
                      key={comp.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/json", JSON.stringify(comp));
                        e.dataTransfer.setData("text/plain", comp.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl border border-gray-200/80 dark:border-white/10 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-2xs hover:shadow-xs group cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                          {comp.embed === 'hero_slider' || comp.id === 'hero_slider' ? (
                            <PlaySquare className="w-3.5 h-3.5" />
                          ) : comp.embed === 'events' ? (
                            <Calendar className="w-3.5 h-3.5" />
                          ) : comp.layout === '2-col' ? (
                            <Split className="w-3.5 h-3.5" />
                          ) : comp.layout === '3-col' || comp.columns === 3 ? (
                            <LayoutGrid className="w-3.5 h-3.5" />
                          ) : (
                            <Pin className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{label}</p>
                            {comp.category && (
                              <span className="text-[9px] bg-gray-100/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full font-mono shrink-0">
                                {comp.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {comp.subtitle || comp.heading || "Ready to insert"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddReusable(comp)}
                        className="px-2.5 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-lg font-bold flex items-center gap-1 shrink-0 border border-blue-200 dark:border-blue-800 transition-all shadow-2xs"
                        title={`Add ${label} to page`}
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 italic">
                No matching components found.
              </div>
            )
          ) : (
            /* Archived Tab */
            filteredArchived.length > 0 ? (
              <div className="grid gap-2">
                {filteredArchived.map((archived) => {
                  const label = archived.label || archived.heading || archived.reusableLabel || archived.originalSectionId || archived.id;
                  const dateStr = archived.archivedAt ? new Date(archived.archivedAt).toLocaleDateString() : 'Previously';
                  return (
                    <div
                      key={archived.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10 hover:border-amber-400 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
                          <Archive className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{label}</p>
                          <p className="text-[9px] text-gray-400 truncate mt-0.5">
                            Archived {dateStr}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddReusable(archived)}
                        className="px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white rounded-lg font-bold flex items-center gap-1 shrink-0 border border-amber-300 dark:border-amber-800 transition-colors"
                      >
                        <Undo2 className="w-3 h-3" /> Reinsert
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400 italic">
                No archived components.
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Drawer / Overlay Mode (Fallback or modal triggers)
  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-200"
        onClick={onClose}
        aria-label="Close Insert Drawer"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-[540px] max-w-[92vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 transform translate-x-0"
      >
        {/* Left Menu Panel */}
        <div className="w-[150px] sm:w-[160px] bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between py-6 shrink-0">
          <div className="space-y-6">
            <div className="px-4 flex items-center gap-2">
              <Layers2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-gray-800 dark:text-white">Insert</span>
            </div>

            <div className="space-y-4 px-2">
              {groups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">
                    {group.title}
                  </span>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => !item.comingSoon && setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeTab === item.id && !item.comingSoon
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        } ${item.comingSoon ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.id === "archived" && archivedComponents.length > 0 && (
                          <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                            {archivedComponents.length}
                          </span>
                        )}
                        {item.comingSoon && (
                          <span className="text-[8px] scale-90 font-semibold bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-500">
                            Soon
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 flex items-center gap-2 text-xs text-gray-400">
            <Info className="w-4 h-4" />
            <span>Visual Canvas</span>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
            <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
              {activeTab === "sections" ? "Components & Reusable Library" : activeTab === "archived" ? "Archived Components" : "Insert Element"}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors"
                title="Close Drawer (or press Esc)"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === "sections" ? (
              <>
                {/* Add Blank Custom Section */}
                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Add Custom Blank Section</h4>
                  <form onSubmit={handleAddBlank} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="e.g. Community Programs"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                </div>

                {/* Reusable & Built-in Components */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Available Components ({filteredComponents.length})</h4>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search Hero Slider, Events, Pillars, Grids..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:border-blue-500 dark:text-white"
                    />
                  </div>

                  {/* Component Cards */}
                  {filteredComponents.length > 0 ? (
                    <div className="grid gap-3">
                      {filteredComponents.map((comp) => {
                        const label = comp.reusableLabel || comp.heading || comp.title || comp.id;
                        return (
                          <div
                            key={comp.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/json", JSON.stringify(comp));
                              e.dataTransfer.setData("text/plain", comp.id);
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all bg-white dark:bg-gray-800/80 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {comp.embed === 'hero_slider' || comp.id === 'hero_slider' ? (
                                  <PlaySquare className="w-4 h-4" />
                                ) : comp.embed === 'events' ? (
                                  <Calendar className="w-4 h-4" />
                                ) : comp.layout === '2-col' ? (
                                  <Split className="w-4 h-4" />
                                ) : comp.layout === '3-col' || comp.columns === 3 ? (
                                  <LayoutGrid className="w-4 h-4" />
                                ) : (
                                  <Pin className="w-4 h-4" />
                                )}
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white">{label}</p>
                                  {comp.category && (
                                    <span className="text-[9px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-mono">
                                      {comp.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                  {comp.subtitle || comp.heading || "Ready to insert into layout"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => onAddReusable(comp)}
                              className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-bold flex items-center gap-1 shrink-0 border border-blue-200 dark:border-blue-800 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-gray-400 italic">
                      No matching components found.
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === "archived" ? (
              /* Archived Components Tab */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <Archive className="w-4 h-4 text-amber-500" />
                      Archived Components Library
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      All components archived from pages are preserved here and can be restored or re-inserted at any time.
                    </p>
                  </div>
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-gray-500 shrink-0">
                    {filteredArchived.length} archived
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search archived components..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:border-amber-500 dark:text-white"
                  />
                </div>

                {/* Archived List */}
                {filteredArchived.length > 0 ? (
                  <div className="grid gap-3">
                    {filteredArchived.map((archived) => {
                      const label = archived.label || archived.heading || archived.reusableLabel || archived.originalSectionId || archived.id;
                      const dateStr = archived.archivedAt ? new Date(archived.archivedAt).toLocaleDateString() : 'Previously';
                      return (
                        <div
                          key={archived.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10 hover:border-amber-400 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl">
                              <Archive className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-gray-800 dark:text-white">{label}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Archived on {dateStr} {archived.sourcePageId ? `from ${archived.sourcePageId}` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onAddReusable(archived)}
                            className="px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg font-bold flex items-center gap-1 shrink-0 border border-amber-300 dark:border-amber-800 transition-colors"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Reinsert
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-gray-400 italic">
                    No archived components found.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
