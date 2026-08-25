export const DEFAULT_PILLARS = [
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

export const DEFAULT_STATS = [
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

export const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
];

export const DEFAULT_HERO_SLIDES = [
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

export interface ResolvedSectionItemsResult {
  items: any[];
  arrayKey: string;
}

export const resolveSectionItems = (
  section: any,
  siteId?: string,
  sectionId?: string
): ResolvedSectionItemsResult => {
  if (!section || typeof section !== "object") {
    return { items: [], arrayKey: "items" };
  }

  const priorityKeys = [
    "statCards",
    "items",
    "cards",
    "programs",
    "resources",
    "services",
    "projects",
    "reviews",
    "testimonials",
    "stats",
    "pillars",
    "features",
    "foundations",
    "facts",
    "destinations",
    "steps",
    "process",
    "slides",
    "team",
    "members",
    "tiers",
    "pricing"
  ];

  for (const key of priorityKeys) {
    if (Array.isArray(section[key]) && section[key].length > 0) {
      return { items: section[key], arrayKey: key };
    }
  }

  // Check any generic object array
  for (const key of Object.keys(section)) {
    if (Array.isArray(section[key]) && section[key].length > 0 && typeof section[key][0] === "object") {
      return { items: section[key], arrayKey: key };
    }
  }

  // Tenant-specific fallbacks strictly for BWEIC
  const normalizedSite = (siteId || "").toLowerCase();
  const lowerSecId = (sectionId || "").toLowerCase();

  if (normalizedSite === "bweic") {
    if (lowerSecId === "mission" || lowerSecId.includes("pillar")) {
      return { items: DEFAULT_PILLARS, arrayKey: "items" };
    }
    if (lowerSecId === "impact" || lowerSecId.startsWith("stat")) {
      return { items: DEFAULT_STATS, arrayKey: "items" };
    }
  }

  return { items: [], arrayKey: "items" };
};

export const getCardTitle = (item: any): string => {
  if (!item || typeof item !== "object") return typeof item === "string" ? item : "";
  return item.title || item.stat || item.value || item.heading || item.name || item.metric || item.label || item.question || item.service_name || "";
};

export const getCardTitleKey = (item: any): string => {
  if (!item || typeof item !== "object") return "title";
  if (item.stat !== undefined) return "stat";
  if (item.value !== undefined) return "value";
  if (item.heading !== undefined) return "heading";
  if (item.name !== undefined) return "name";
  if (item.metric !== undefined) return "metric";
  if (item.question !== undefined) return "question";
  if (item.service_name !== undefined) return "service_name";
  return "title";
};

export const getCardDescription = (item: any): string => {
  if (!item || typeof item !== "object") return "";
  return item.description || item.text || item.desc || item.content || item.body || item.quote || item.answer || item.details || item.summary || "";
};

export const getCardDescriptionKey = (item: any): string => {
  if (!item || typeof item !== "object") return "description";
  if (item.text !== undefined) return "text";
  if (item.desc !== undefined) return "desc";
  if (item.content !== undefined) return "content";
  if (item.body !== undefined) return "body";
  if (item.quote !== undefined) return "quote";
  if (item.answer !== undefined) return "answer";
  if (item.details !== undefined) return "details";
  if (item.summary !== undefined) return "summary";
  return "description";
};

export const getCardTag = (item: any): string => {
  if (!item || typeof item !== "object") return "";
  return item.tag || item.category || item.label || item.type || item.badge || item.role || item.author || item.year || "";
};

export const getCardTagKey = (item: any): string => {
  if (!item || typeof item !== "object") return "tag";
  if (item.category !== undefined) return "category";
  if (item.type !== undefined) return "type";
  if (item.badge !== undefined) return "badge";
  if (item.role !== undefined) return "role";
  if (item.label !== undefined && item.value === undefined) return "label";
  return "tag";
};

export const getCardImage = (item: any): string => {
  if (!item || typeof item !== "object") return "";
  return item.imageUrl || item.image || item.iconUrl || item.photo || item.url || "";
};

export const getCardImageKey = (item: any): string => {
  if (!item || typeof item !== "object") return "imageUrl";
  if (item.image !== undefined) return "image";
  if (item.iconUrl !== undefined) return "iconUrl";
  if (item.photo !== undefined) return "photo";
  if (item.url !== undefined) return "url";
  return "imageUrl";
};
