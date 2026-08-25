import { db, getDb, auth } from "@/firebaseConfig";
import { getSiteById, SITES } from "@/config/sites";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { SiteSettings } from "@/types/siteSettings";
import { SEED_DATA } from "@/config/seedData";

export interface PageContent {
    title?: string;
    slug?: string;
    status?: 'published' | 'draft';
    template?: string; // used for dynamic rendering
    seo?: {
        title?: string;
        description?: string;
        image?: string;
    };
    sections?: Record<string, SectionContent>;
    lastUpdated?: string;
    updatedBy?: string;
    [key: string]: any; // Allow flexible content structure
}

export interface SectionContent {
    heading?: string;   // Optional — not all section types require a heading
    content?: string;   // Optional — not all section types require body text
    images?: { url: string; alt: string }[];
    imageAlignment?: 'top' | 'left' | 'right';
    enabled?: boolean;
    subtitle?: string;
    buttonText?: string;
    buttonUrl?: string;
    order?: number;
    stats?: { value: string; label: string }[];
    items?: any[]; // Generic array for varying lists (testimonials, pillars, features)
    list?: any[];  // Specifically for lists of people or structured items
    quote?: string;
    author_name?: string;
    author_title?: string;
    signature?: string;
    videoUrl?: string;
    // New fields for Careers and dynamic layouts
    location?: string;
    jobType?: string;
    pdfUrl?: string;
    externalLink?: string;
    footerImage?: string;
    sidebarContent?: {
        showNews?: boolean;
        showDonate?: boolean;
        showSocials?: boolean;
        customContent?: string;
    };
}

export interface ThemeSettings {
    typography: {
        displayFont: string;
        bodyFont: string;
        h1Font?: string;
        h2Font?: string;
        h3Font?: string;
        h4Font?: string;
        h5Font?: string;
        h6Font?: string;
        highlightFont?: string;
        h1Align?: 'left' | 'center' | 'right';
        h2Align?: 'left' | 'center' | 'right';
        h3Align?: 'left' | 'center' | 'right';
        h4Align?: 'left' | 'center' | 'right';
        h5Align?: 'left' | 'center' | 'right';
        h6Align?: 'left' | 'center' | 'right';
        highlightAlign?: 'left' | 'center' | 'right';
        h1Size: string;
        h2Size: string;
        h3Size: string;
        h4Size: string;
        h5Size: string;
        h6Size: string;
        bodySize: string;
        highlightSize: string;
        alignment: 'left' | 'center' | 'right';
        headingAlignment: 'left' | 'center' | 'right';
    };
    colors?: {
        primary: string;
        highlight: string;
        accent: string;
        cream: string;
        charcoal: string;
    };
}

export const FirestoreService = {
    // Fetch content for a specific page with siteId
    getPageContent: async (pageId: string, siteId: string, forceMode?: 'live' | 'draft'): Promise<PageContent | null> => {
        try {
            const isDraftMode = forceMode === 'draft' || (forceMode !== 'live' && typeof window !== 'undefined' && localStorage.getItem('cms_draft_mode') !== 'false');
            const targetPageId = isDraftMode && !pageId.endsWith('_draft') ? `${pageId}_draft` : pageId;

            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            
            let docRef = doc(dbInstance, collectionName, targetPageId);
            let docSnap = await getDoc(docRef);

            // Fall back to live document if draft is requested but doesn't exist
            if (!docSnap.exists() && isDraftMode && !forceMode) {
                const liveDocRef = doc(dbInstance, collectionName, pageId);
                docSnap = await getDoc(liveDocRef);
            }

            if (docSnap.exists()) {
                return docSnap.data() as PageContent;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching page content:", error);
            throw error;
        }
    },

    // Fetch comprehensive content across multiple collections (for SEO audit)
    getComprehensiveSiteContent: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const contentPrefix = site?.usePrefix !== false ? siteId : '';
            
            const docs: any[] = [];

            // 1. Pages (Content)
            const contentRef = collection(dbInstance, contentPrefix ? `${contentPrefix}_content` : 'content');
            const contentSnap = await getDocs(contentRef);
            contentSnap.docs.forEach(doc => docs.push({ id: doc.id, collection: 'page', ...doc.data() }));

            // 2. Events
            const eventsRef = collection(dbInstance, contentPrefix ? `${contentPrefix}_events` : 'events');
            const eventsSnap = await getDocs(eventsRef);
            eventsSnap.docs.forEach(doc => docs.push({ id: doc.id, collection: 'event', ...doc.data() }));

            // 3. Articles/Blog
            const articlesRef = collection(dbInstance, contentPrefix ? `${contentPrefix}_articles` : 'articles');
            const articlesSnap = await getDocs(articlesRef);
            articlesSnap.docs.forEach(doc => docs.push({ id: doc.id, collection: 'article', ...doc.data() }));

            return docs;
        } catch (error) {
            console.error("Error fetching comprehensive content:", error);
            return [];
        }
    },


    savePageContent: async (pageId: string, data: PageContent, siteId: string, forceMode?: 'live' | 'draft') => {
        try {
            const isDraftMode = forceMode === 'draft' || (forceMode !== 'live' && typeof window !== 'undefined' && localStorage.getItem('cms_draft_mode') !== 'false');
            const targetPageId = isDraftMode && !pageId.endsWith('_draft') ? `${pageId}_draft` : pageId;

            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            const docRef = doc(dbInstance, collectionName, targetPageId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous page content for history:", e);
            }

            const cleanData = {
                ...data,
                siteId, // Store siteId for reference
                lastUpdated: new Date().toISOString(),
            };

            await setDoc(docRef, cleanData); // No merge — full overwrite so deleted sections are removed

            await FirestoreService.recordHistory(
                siteId,
                'content',
                targetPageId,
                previousData ? 'update' : 'create',
                previousData,
                cleanData
            );
        } catch (error) {
            console.error("Error saving page content:", error);
            throw error;
        }
    },

    getPages: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            const contentRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(contentRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching pages:", error);
            return [];
        }
    },

    deletePage: async (siteId: string, pageId: string): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            const docRef = doc(dbInstance, collectionName, pageId);
            const prevSnap = await getDoc(docRef);
            const prevData = prevSnap.exists() ? prevSnap.data() : null;

            await deleteDoc(docRef);

            // Also clean up draft document if exists
            const draftDocRef = doc(dbInstance, collectionName, `${pageId}_draft`);
            const draftSnap = await getDoc(draftDocRef);
            if (draftSnap.exists()) {
                await deleteDoc(draftDocRef);
            }

            if (prevData) {
                await FirestoreService.recordHistory(
                    siteId,
                    'content',
                    pageId,
                    prevData,
                    null,
                    'system',
                    `Deleted page: ${pageId}`
                );
            }
        } catch (error) {
            console.error(`Error deleting page ${pageId}:`, error);
            throw error;
        }
    },

    seedSiteContent: async (siteId: string): Promise<{ count: number }> => {
        try {
            const site = getSiteById(siteId);
            const siteData = (SEED_DATA as any)[siteId];
            if (!siteData) {
                throw new Error(`No seed data available for site: ${siteId}`);
            }

            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            let seededCount = 0;

            for (const [docId, content] of Object.entries(siteData)) {
                if (!content || typeof content !== 'object') continue;
                const docRef = doc(dbInstance, collectionName, docId);
                const prevSnap = await getDoc(docRef);
                const prevData = prevSnap.exists() ? prevSnap.data() : null;

                const cleanData: any = {
                    ...(content as any),
                    id: docId,
                    siteId,
                    status: (content as any).status || 'published',
                    lastUpdated: new Date().toISOString(),
                };

                if (!cleanData.title) {
                    cleanData.title = docId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                }
                if (!cleanData.slug) {
                    cleanData.slug = docId;
                }

                await setDoc(docRef, cleanData, { merge: true });
                seededCount++;

                await FirestoreService.recordHistory(
                    siteId,
                    'content',
                    docId,
                    prevData ? 'update' : 'create',
                    prevData,
                    cleanData
                );

                // If seeding partners, also populate the partner collection
                if (docId === 'partners') {
                    const partnerItems = Array.isArray(content)
                        ? content
                        : (content as any).items || (content as any).partners || [];
                    if (partnerItems.length > 0) {
                        const existingPartners = await FirestoreService.getPartners(siteId);
                        for (const ep of existingPartners) {
                            await FirestoreService.deletePartner(siteId, ep.id);
                        }
                        for (let i = 0; i < partnerItems.length; i++) {
                            const p = partnerItems[i];
                            await FirestoreService.savePartner(siteId, {
                                name: p.name,
                                type: p.type || "Community Partner",
                                description: p.description || "",
                                website: p.website || p.link || "#",
                                logo: p.logo || "",
                                services: p.services || [],
                                published: p.published !== false,
                                order: p.order ?? i
                            });
                        }
                    }
                }
            }

            return { count: seededCount };
        } catch (error) {
            console.error("Error seeding site content:", error);
            throw error;
        }
    },

    clonePage: async (siteId: string, pageId: string, newPageId: string, newTitle: string): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            const originalDocRef = doc(dbInstance, collectionName, pageId);
            const docSnap = await getDoc(originalDocRef);
            if (!docSnap.exists()) throw new Error('Original page not found');
            
            const originalData = docSnap.data() as PageContent;
            const newDocRef = doc(dbInstance, collectionName, newPageId);
            const cleanData = {
                ...originalData,
                title: newTitle,
                slug: newPageId,
                status: 'draft',
                template: originalData.template || pageId,
                siteId,
                lastUpdated: new Date().toISOString(),
            };

            await setDoc(newDocRef, cleanData);

            await FirestoreService.recordHistory(
                siteId,
                'content',
                newPageId,
                'create',
                null,
                cleanData
            );
        } catch (error) {
            console.error("Error cloning page:", error);
            throw error;
        }
    },

    updatePageVisibility: async (siteId: string, pageId: string, status: 'published' | 'draft'): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            const docRef = doc(dbInstance, collectionName, pageId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous page visibility for history:", e);
            }

            const updateData = { status, lastUpdated: new Date().toISOString() };
            await updateDoc(docRef, updateData);

            await FirestoreService.recordHistory(
                siteId,
                'content',
                pageId,
                'update',
                previousData,
                previousData ? { ...previousData, ...updateData } : updateData
            );
        } catch (error) {
            console.error("Error updating page visibility:", error);
            throw error;
        }
    },

    // User Management
    getUsers: async (): Promise<any[]> => {
        try {
            const userMap = new Map<string, any>();

            // Query across default database AND all configured tenant databases
            const databasesToQuery = [
                { id: '(default)', instance: db },
                ...SITES.map(site => ({ id: site.id, instance: getDb(site.id) }))
            ];

            await Promise.all(
                databasesToQuery.map(async (dbObj) => {
                    try {
                        const usersRef = collection(dbObj.instance, "users");
                        const snapshot = await getDocs(usersRef);
                        snapshot.docs.forEach((d) => {
                            const data = d.data();
                            const existing = userMap.get(d.id);
                            if (!existing) {
                                userMap.set(d.id, { id: d.id, ...data });
                            } else {
                                // Merge allowedSites from stored data only.
                                // Do NOT auto-inject dbObj.id — document presence in a
                                // site db must NOT imply access; trust the stored field.
                                const combinedSites = Array.from(
                                    new Set([
                                        ...(existing.allowedSites || []),
                                        ...(data.allowedSites || []),
                                    ])
                                );
                                userMap.set(d.id, {
                                    ...existing,
                                    ...data,
                                    allowedSites: combinedSites
                                });
                            }
                        });
                    } catch (err) {
                        console.warn(`Could not fetch users from database '${dbObj.id}':`, err);
                    }
                })
            );

            return Array.from(userMap.values());
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    },

    updateUserRole: async (userId: string, role: 'super_admin' | 'editor') => {
        try {
            // Update user role across all tenant databases
            await Promise.all(
                SITES.map(async (site) => {
                    try {
                        const dbInstance = getDb(site.id);
                        const userRef = doc(dbInstance, "users", userId);
                        const docSnap = await getDoc(userRef);
                        if (docSnap.exists()) {
                            await setDoc(userRef, { role }, { merge: true });
                        }
                    } catch (err) {
                        console.warn(`Could not update user role in site database '${site.id}':`, err);
                    }
                })
            );
        } catch (error) {
            console.error("Error updating user role:", error);
            throw error;
        }
    },

    // Site Settings Management
    getSiteSettings: async (siteId: string): Promise<SiteSettings | null> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, "config");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as SiteSettings;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching site settings:", error);
            throw error;
        }
    },

    saveSiteSettings: async (siteId: string, settings: SiteSettings) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, "config");

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous site settings for history:", e);
            }

            const cleanData = {
                ...settings,
                siteId,
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    updatedBy: settings.metadata?.updatedBy || 'system',
                }
            };

            await setDoc(docRef, cleanData, { merge: true });

            await FirestoreService.recordHistory(
                siteId,
                'settings',
                'config',
                previousData ? 'update' : 'create',
                previousData,
                cleanData
            );
        } catch (error) {
            console.error("Error saving site settings:", error);
            throw error;
        }
    },

    // Event Management
    getEvents: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_events` : 'events';
            const eventsRef = collection(dbInstance, collectionName);
            // Default sort by date? For now getting all.
            const snapshot = await getDocs(eventsRef);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id };
            });
        } catch (error) {
            console.error("Error fetching events:", error);
            return [];
        }
    },

    saveEvent: async (siteId: string, event: any, eventId?: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_events` : 'events';
            
            let previousData = null;
            const timestamp = new Date().toISOString();

            if (eventId) {
                const docRef = doc(dbInstance, collectionName, eventId);
                try {
                    const prevSnap = await getDoc(docRef);
                    if (prevSnap.exists()) {
                        previousData = prevSnap.data();
                    }
                } catch (e) {
                    console.error("Failed to read previous event settings:", e);
                }

                const cleanData = { 
                    ...event,
                    updatedAt: timestamp
                };
                await setDoc(docRef, cleanData, { merge: true });

                await FirestoreService.recordHistory(
                    siteId,
                    'events',
                    eventId,
                    'update',
                    previousData,
                    cleanData
                );
            } else {
                const collectionRef = collection(dbInstance, collectionName);
                const cleanData = {
                    ...event,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                const docRef = await addDoc(collectionRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'events',
                    docRef.id,
                    'create',
                    null,
                    cleanData
                );
            }
        } catch (error) {
            console.error("Error saving event:", error);
            throw error;
        }
    },

    deleteEvent: async (siteId: string, eventId: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_events` : 'events';
            const docRef = doc(dbInstance, collectionName, eventId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous event for history:", e);
            }

            await deleteDoc(docRef);

            await FirestoreService.recordHistory(
                siteId,
                'events',
                eventId,
                'delete',
                previousData,
                null
            );
        } catch (error) {
            console.error("Error deleting event:", error);
            throw error;
        }
    },

    // Article Management
    getArticles: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_articles` : 'articles';
            const articlesRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(articlesRef);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            });
        } catch (error) {
            console.error("Error fetching articles:", error);
            return [];
        }
    },

    saveArticle: async (siteId: string, article: any, articleId?: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_articles` : 'articles';
            const timestamp = new Date().toISOString();
            let previousData = null;

            if (articleId) {
                const docRef = doc(dbInstance, collectionName, articleId);
                try {
                    const prevSnap = await getDoc(docRef);
                    if (prevSnap.exists()) {
                        previousData = prevSnap.data();
                    }
                } catch (e) {
                    console.error("Failed to read previous article settings:", e);
                }

                const cleanData = {
                    ...article,
                    updatedAt: timestamp
                };
                await setDoc(docRef, cleanData, { merge: true });

                await FirestoreService.recordHistory(
                    siteId,
                    'articles',
                    articleId,
                    'update',
                    previousData,
                    cleanData
                );
            } else {
                const collectionRef = collection(dbInstance, collectionName);
                const cleanData = {
                    ...article,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                const docRef = await addDoc(collectionRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'articles',
                    docRef.id,
                    'create',
                    null,
                    cleanData
                );
            }
        } catch (error) {
            console.error("Error saving article:", error);
            throw error;
        }
    },

    deleteArticle: async (siteId: string, articleId: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_articles` : 'articles';
            const docRef = doc(dbInstance, collectionName, articleId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous article for history:", e);
            }

            await deleteDoc(docRef);

            await FirestoreService.recordHistory(
                siteId,
                'articles',
                articleId,
                'delete',
                previousData,
                null
            );
        } catch (error) {
            console.error("Error deleting article:", error);
            throw error;
        }
    },

    // Video Management
    getVideos: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_videos` : 'videos';
            const videosRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(videosRef);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            });
        } catch (error) {
            console.error("Error fetching videos:", error);
            return [];
        }
    },

    saveVideo: async (siteId: string, video: any, videoId?: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_videos` : 'videos';
            const timestamp = new Date().toISOString();
            let previousData = null;

            if (videoId) {
                const docRef = doc(dbInstance, collectionName, videoId);
                try {
                    const prevSnap = await getDoc(docRef);
                    if (prevSnap.exists()) {
                        previousData = prevSnap.data();
                    }
                } catch (e) {
                    console.error("Failed to read previous video settings:", e);
                }

                const cleanData = {
                    ...video,
                    updatedAt: timestamp
                };
                await updateDoc(docRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'videos',
                    videoId,
                    'update',
                    previousData,
                    cleanData
                );
            } else {
                const collectionRef = collection(dbInstance, collectionName);
                const cleanData = {
                    ...video,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                const docRef = await addDoc(collectionRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'videos',
                    docRef.id,
                    'create',
                    null,
                    cleanData
                );
            }
        } catch (error) {
            console.error("Error saving video:", error);
            throw error;
        }
    },

    deleteVideo: async (siteId: string, videoId: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_videos` : 'videos';
            const docRef = doc(dbInstance, collectionName, videoId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous video for history:", e);
            }

            await deleteDoc(docRef);

            await FirestoreService.recordHistory(
                siteId,
                'videos',
                videoId,
                'delete',
                previousData,
                null
            );
        } catch (error) {
            console.error("Error deleting video:", error);
            throw error;
        }
    },

    // Partner Management
    getPartners: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_partners` : 'partners';
            const partnersRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(partnersRef);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            });
        } catch (error) {
            console.error("Error fetching partners:", error);
            return [];
        }
    },

    savePartner: async (siteId: string, partner: any, partnerId?: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_partners` : 'partners';
            const timestamp = new Date().toISOString();
            let previousData = null;

            if (partnerId) {
                const docRef = doc(dbInstance, collectionName, partnerId);
                try {
                    const prevSnap = await getDoc(docRef);
                    if (prevSnap.exists()) {
                        previousData = prevSnap.data();
                    }
                } catch (e) {
                    console.error("Failed to read previous partner settings:", e);
                }

                const cleanData = {
                    ...partner,
                    updatedAt: timestamp
                };
                await updateDoc(docRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'partners',
                    partnerId,
                    'update',
                    previousData,
                    cleanData
                );
            } else {
                const collectionRef = collection(dbInstance, collectionName);
                const cleanData = {
                    ...partner,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                const docRef = await addDoc(collectionRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'partners',
                    docRef.id,
                    'create',
                    null,
                    cleanData
                );
            }
        } catch (error) {
            console.error("Error saving partner:", error);
            throw error;
        }
    },

    deletePartner: async (siteId: string, partnerId: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_partners` : 'partners';
            const docRef = doc(dbInstance, collectionName, partnerId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous partner for history:", e);
            }

            await deleteDoc(docRef);

            await FirestoreService.recordHistory(
                siteId,
                'partners',
                partnerId,
                'delete',
                previousData,
                null
            );
        } catch (error) {
            console.error("Error deleting partner:", error);
            throw error;
        }
    },

    // Product Management
    getProducts: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_products` : 'products';
            const productsRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(productsRef);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data };
            });
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    saveProduct: async (siteId: string, product: any, productId?: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_products` : 'products';
            const timestamp = new Date().toISOString();
            let previousData = null;

            if (productId) {
                const docRef = doc(dbInstance, collectionName, productId);
                try {
                    const prevSnap = await getDoc(docRef);
                    if (prevSnap.exists()) {
                        previousData = prevSnap.data();
                    }
                } catch (e) {
                    console.error("Failed to read previous product settings:", e);
                }

                const cleanData = {
                    ...product,
                    updatedAt: timestamp
                };
                await updateDoc(docRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'products',
                    productId,
                    'update',
                    previousData,
                    cleanData
                );
            } else {
                const collectionRef = collection(dbInstance, collectionName);
                const cleanData = {
                    ...product,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                const docRef = await addDoc(collectionRef, cleanData);

                await FirestoreService.recordHistory(
                    siteId,
                    'products',
                    docRef.id,
                    'create',
                    null,
                    cleanData
                );
            }
        } catch (error) {
            console.error("Error saving product:", error);
            throw error;
        }
    },

    deleteProduct: async (siteId: string, productId: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_products` : 'products';
            const docRef = doc(dbInstance, collectionName, productId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous product for history:", e);
            }

            await deleteDoc(docRef);

            await FirestoreService.recordHistory(
                siteId,
                'products',
                productId,
                'delete',
                previousData,
                null
            );
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    },

    // SEO Management
    getSEOData: async (siteId: string): Promise<any | null> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, "seo");
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Error fetching SEO data:", error);
            throw error;
        }
    },

    saveSEOData: async (siteId: string, seoData: any) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, "seo");

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous SEO settings for history:", e);
            }

            await setDoc(docRef, seoData);

            await FirestoreService.recordHistory(
                siteId,
                'settings',
                'seo',
                previousData ? 'update' : 'create',
                previousData,
                seoData
            );
        } catch (error) {
            console.error("Error saving SEO data:", error);
            throw error;
        }
    },

    // Footer Management
    getFooterData: async (siteId: string): Promise<any | null> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            const docRef = doc(dbInstance, collectionName, "footer");
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Error fetching footer data:", error);
            throw error;
        }
    },

    saveFooterData: async (data: any, siteId: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
            const docRef = doc(dbInstance, collectionName, 'footer');

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous footer settings for history:", e);
            }

            const cleanData = { ...data, lastUpdated: new Date().toISOString() };
            await setDoc(docRef, cleanData);

            await FirestoreService.recordHistory(
                siteId,
                'settings',
                'footer',
                previousData ? 'update' : 'create',
                previousData,
                cleanData
            );
        } catch (error) {
            console.error("Error saving footer data:", error);
            throw error;
        }
    },

    // Theme Settings
    getThemeSettings: async (siteId: string): Promise<ThemeSettings | null> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, 'theme');
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() as ThemeSettings : null;
        } catch (error) {
            console.error("Error fetching theme settings:", error);
            return null;
        }
    },

    saveThemeSettings: async (data: ThemeSettings, siteId: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, 'theme');

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous theme settings for history:", e);
            }

            const cleanData = { ...data, lastUpdated: new Date().toISOString() };
            await setDoc(docRef, cleanData);

            await FirestoreService.recordHistory(
                siteId,
                'settings',
                'theme',
                previousData ? 'update' : 'create',
                previousData,
                cleanData
            );
        } catch (error) {
            console.error("Error saving theme settings:", error);
            throw error;
        }
    },

    // Generic Settings Management
    getSettings: async (siteId: string, docId: string): Promise<any | null> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, docId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error(`Error fetching ${docId} settings:`, error);
            throw error;
        }
    },

    saveSettings: async (siteId: string, docId: string, data: any) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
            const docRef = doc(dbInstance, collectionName, docId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error(`Failed to read previous ${docId} settings for history:`, e);
            }

            const cleanData = { ...data, lastUpdated: new Date().toISOString() };
            await setDoc(docRef, cleanData, { merge: true });

            await FirestoreService.recordHistory(
                siteId,
                'settings',
                docId,
                previousData ? 'update' : 'create',
                previousData,
                cleanData
            );
        } catch (error) {
            console.error(`Error saving ${docId} settings:`, error);
            throw error;
        }
    },

    // Message Management
    getMessages: async (siteId: string, collectionOverride?: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const defaultCollection = collectionOverride || 'messages';
            const collectionName = site?.usePrefix !== false ? `${siteId}_${defaultCollection}` : defaultCollection;
            const messagesRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(messagesRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => {
                    const timeA = (a.createdAt?.seconds || a.timestamp?.seconds || 0);
                    const timeB = (b.createdAt?.seconds || b.timestamp?.seconds || 0);
                    return timeB - timeA;
                });
        } catch (error) {
            console.error(`Error fetching ${collectionOverride || 'messages'}:`, error);
            return [];
        }
    },

    deleteMessage: async (siteId: string, messageId: string, collectionOverride?: string) => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const defaultCollection = collectionOverride || 'messages';
            const collectionName = site?.usePrefix !== false ? `${siteId}_${defaultCollection}` : defaultCollection;
            const docRef = doc(dbInstance, collectionName, messageId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error(`Error deleting ${collectionOverride || 'message'}:`, error);
            throw error;
        }
    },

    // Analytics Management
    getAnalyticsEvents: async (siteId: string, limitCount: number = 100): Promise<any[]> => {
        try {
            const dbInstance = getDb(siteId);
            const eventsRef = collection(dbInstance, "analytics_events");
            // In a real app we'd add sorting and limiting here
            const snapshot = await getDocs(eventsRef);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((ev: any) => ev.siteId === siteId)
                .slice(0, limitCount);
        } catch (error) {
            console.error("Error fetching analytics events:", error);
            return [];
        }
    },

    getAnalyticsAggregates: async (siteId: string, type: 'daily' | 'monthly'): Promise<any[]> => {
        try {
            const dbInstance = getDb(siteId);
            const aggregatesRef = collection(dbInstance, "analytics_aggregates");
            const snapshot = await getDocs(aggregatesRef);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((agg: any) => agg.siteId === siteId && (type === 'daily' ? !!agg.date : !!agg.month));
        } catch (error) {
            console.error("Error fetching analytics aggregates:", error);
            return [];
        }
    },

    getAnalyticsPages: async (siteId: string): Promise<any[]> => {
        try {
            const dbInstance = getDb(siteId);
            const pagesRef = collection(dbInstance, "analytics_pages");
            const snapshot = await getDocs(pagesRef);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((p: any) => p.siteId === siteId);
        } catch (error) {
            console.error("Error fetching analytics pages:", error);
            return [];
        }
    },

    // Sharing Snapshots
    saveAnalyticsSnapshot: async (siteId: string, data: any): Promise<string> => {
        try {
            const dbInstance = getDb(siteId);
            const snapshotsRef = collection(dbInstance, "shared_analytics");
            const docRef = await addDoc(snapshotsRef, {
                ...data,
                id: '', // Will be updated
            });
            await updateDoc(docRef, { id: docRef.id });
            return docRef.id;
        } catch (error) {
            console.error("Error saving analytics snapshot:", error);
            throw error;
        }
    },

    getAnalyticsSnapshot: async (snapshotId: string, siteId: string): Promise<any | null> => {
        try {
            const dbInstance = getDb(siteId);
            const docRef = doc(dbInstance, "shared_analytics", snapshotId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Error fetching analytics snapshot:", error);
            return null;
        }
    },

    // Aitasol Applications Management
    getApplications: async (siteId: string): Promise<any[]> => {
        try {
            const dbInstance = getDb(siteId);
            const applicationsRef = collection(dbInstance, "applications");
            const snapshot = await getDocs(applicationsRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => {
                    const timeA = (a.updatedAt?.seconds || 0);
                    const timeB = (b.updatedAt?.seconds || 0);
                    return timeB - timeA;
                });
        } catch (error) {
            console.error("Error fetching applications:", error);
            return [];
        }
    },

    updateApplicationStatus: async (siteId: string, applicationId: string, status: string) => {
        try {
            const dbInstance = getDb(siteId);
            const docRef = doc(dbInstance, "applications", applicationId);
            await updateDoc(docRef, {
                status,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating application status:", error);
            throw error;
        }
    },

    // Dynamic Forms Engine
    getForms: async (siteId: string): Promise<any[]> => {
        try {
            const dbInstance = getDb(siteId);
            const formsRef = collection(dbInstance, "forms");
            const snapshot = await getDocs(formsRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching forms:", error);
            return [];
        }
    },

    getForm: async (siteId: string, formId: string): Promise<any | null> => {
        try {
            const dbInstance = getDb(siteId);
            const docRef = doc(dbInstance, "forms", formId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) {
            console.error("Error fetching form:", error);
            return null;
        }
    },

    saveForm: async (siteId: string, formId: string, data: any): Promise<void> => {
        try {
            const dbInstance = getDb(siteId);
            const docRef = doc(dbInstance, "forms", formId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous form settings:", e);
            }

            const cleanData = {
                ...data,
                updatedAt: new Date().toISOString()
            };

            await setDoc(docRef, cleanData, { merge: true });

            await FirestoreService.recordHistory(
                siteId,
                'forms',
                formId,
                previousData ? 'update' : 'create',
                previousData,
                cleanData
            );
        } catch (error) {
            console.error("Error saving form:", error);
            throw error;
        }
    },

    deleteForm: async (siteId: string, formId: string): Promise<void> => {
        try {
            const dbInstance = getDb(siteId);
            const docRef = doc(dbInstance, "forms", formId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous form for history:", e);
            }

            await deleteDoc(docRef);

            await FirestoreService.recordHistory(
                siteId,
                'forms',
                formId,
                'delete',
                previousData,
                null
            );
        } catch (error) {
            console.error("Error deleting form:", error);
            throw error;
        }
    },

    // Reusable Sections / Components Management
    getReusableSections: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_reusable_sections` : 'reusable_sections';
            const colRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(colRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching reusable sections:", error);
            return [];
        }
    },

    saveReusableSection: async (siteId: string, sectionId: string, data: any): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_reusable_sections` : 'reusable_sections';
            const docRef = doc(dbInstance, collectionName, sectionId);

            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous reusable section settings:", e);
            }

            const cleanData = {
                ...data,
                id: sectionId,
                lastUpdated: new Date().toISOString()
            };

            await setDoc(docRef, cleanData);

            await FirestoreService.recordHistory(
                siteId,
                'reusable_sections',
                sectionId,
                previousData ? 'update' : 'create',
                previousData,
                cleanData
            );
        } catch (error) {
            console.error("Error saving reusable section:", error);
            throw error;
        }
    },

    deleteReusableSection: async (siteId: string, sectionId: string): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_reusable_sections` : 'reusable_sections';
            const docRef = doc(dbInstance, collectionName, sectionId);
            
            // Get previous data
            let previousData = null;
            try {
                const prevSnap = await getDoc(docRef);
                if (prevSnap.exists()) {
                    previousData = prevSnap.data();
                }
            } catch (e) {
                console.error("Failed to read previous data for history:", e);
            }

            await deleteDoc(docRef);

            await FirestoreService.recordHistory(
                siteId,
                'reusable_sections',
                sectionId,
                'delete',
                previousData,
                null
            );
        } catch (error) {
            console.error("Error deleting reusable section:", error);
            throw error;
        }
    },

    // Archived Sections & Components Management
    archiveSection: async (siteId: string, pageId: string, sectionId: string, sectionData: any): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_archived_sections` : 'archived_sections';
            const archiveId = `${pageId}_${sectionId}_${Date.now()}`;
            const docRef = doc(dbInstance, collectionName, archiveId);

            const archiveRecord = {
                ...sectionData,
                id: archiveId,
                originalSectionId: sectionId,
                sourcePageId: pageId,
                label: sectionData.heading || sectionData.reusableLabel || sectionData.title || sectionId,
                archivedAt: new Date().toISOString(),
                archivedBy: 'Admin'
            };

            await setDoc(docRef, archiveRecord);
            await FirestoreService.recordHistory(
                siteId,
                'archived_sections',
                archiveId,
                'archive',
                null,
                archiveRecord
            );
        } catch (error) {
            console.error("Error archiving section:", error);
            throw error;
        }
    },

    getArchivedSections: async (siteId: string): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_archived_sections` : 'archived_sections';
            const colRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(colRef);
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return list.sort((a: any, b: any) => new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime());
        } catch (error) {
            console.error("Error fetching archived sections:", error);
            return [];
        }
    },

    deleteArchivedSection: async (siteId: string, archiveId: string): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_archived_sections` : 'archived_sections';
            const docRef = doc(dbInstance, collectionName, archiveId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting archived section:", error);
            throw error;
        }
    },

    recordHistory: async (
        siteId: string,
        logicalCollection: string,
        documentId: string,
        action: 'create' | 'update' | 'delete',
        previousData: any | null,
        newData: any | null
    ): Promise<void> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_history` : 'history';
            const historyRef = collection(dbInstance, collectionName);
            const userEmail = auth.currentUser?.email || 'system';
            await addDoc(historyRef, {
                documentId,
                collectionName: logicalCollection,
                action,
                previousData,
                newData,
                timestamp: new Date().toISOString(),
                updatedBy: userEmail,
            });
        } catch (error) {
            console.error("Error recording history:", error);
        }
    },

    getHistory: async (siteId: string, limitCount: number = 100): Promise<any[]> => {
        try {
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            const collectionName = site?.usePrefix !== false ? `${siteId}_history` : 'history';
            const historyRef = collection(dbInstance, collectionName);
            const snapshot = await getDocs(historyRef);
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limitCount);
        } catch (error) {
            console.error("Error getting history:", error);
            return [];
        }
    },

    getLeads: async (siteId: string): Promise<any[]> => {
        try {
            const dbInstance = getDb(siteId);
            const collectionsToFetch = ['form_submissions', 'messages', 'subscribers'];
            let allLeads: any[] = [];

            for (const colName of collectionsToFetch) {
                const colRef = collection(dbInstance, colName);
                try {
                    const snapshot = await getDocs(colRef);
                    const leads = snapshot.docs.map(doc => ({
                        id: doc.id,
                        collectionSource: colName,
                        ...doc.data()
                    }));
                    allLeads = [...allLeads, ...leads];
                } catch (e) {
                    // Collection might not exist or permission denied, skip it
                    console.warn(`Could not fetch collection ${colName} for site ${siteId}`, e);
                }
            }

            // Sort by createdAt or timestamp descending
            return allLeads.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error("Error getting leads:", error);
            return [];
        }
    },
    getDocumentHistory: async (siteId: string, logicalCollection: string, documentId: string): Promise<any[]> => {
        try {
            if (!siteId || !logicalCollection || !documentId) {
                return [];
            }
            const site = getSiteById(siteId);
            const dbInstance = getDb(siteId);
            if (!dbInstance) return [];
            const collectionName = site?.usePrefix !== false ? `${siteId}_history` : 'history';
            const historyRef = collection(dbInstance, collectionName);
            const q = query(
                historyRef,
                where('documentId', '==', documentId)
            );
            const snapshot = await getDocs(q);
            const records = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((rec: any) => !rec.collectionName || rec.collectionName === logicalCollection);
            
            return records.sort((a: any, b: any) => {
                const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
                const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
                return timeB - timeA;
            });
        } catch (error) {
            console.error("Error getting document history:", error);
            return [];
        }
    },


    rollbackDocument: async (siteId: string, logicalCollection: string, documentId: string, data: any): Promise<void> => {
        try {
            if (data === null) {
                const site = getSiteById(siteId);
                const dbInstance = getDb(siteId);
                switch (logicalCollection) {
                    case 'content': {
                        const collectionName = site?.usePrefix !== false ? `${siteId}_content` : 'content';
                        const docRef = doc(dbInstance, collectionName, documentId);
                        await deleteDoc(docRef);
                        await FirestoreService.recordHistory(siteId, 'content', documentId, 'delete', null, null);
                        break;
                    }
                    case 'settings': {
                        const collectionName = site?.usePrefix !== false ? `${siteId}_settings` : 'settings';
                        const docRef = doc(dbInstance, collectionName, documentId);
                        await deleteDoc(docRef);
                        await FirestoreService.recordHistory(siteId, 'settings', documentId, 'delete', null, null);
                        break;
                    }
                    case 'events':
                        await FirestoreService.deleteEvent(siteId, documentId);
                        break;
                    case 'articles':
                        await FirestoreService.deleteArticle(siteId, documentId);
                        break;
                    case 'videos':
                        await FirestoreService.deleteVideo(siteId, documentId);
                        break;
                    case 'partners':
                        await FirestoreService.deletePartner(siteId, documentId);
                        break;
                    case 'products':
                        await FirestoreService.deleteProduct(siteId, documentId);
                        break;
                    case 'forms':
                        await FirestoreService.deleteForm(siteId, documentId);
                        break;
                    case 'reusable_sections':
                        await FirestoreService.deleteReusableSection(siteId, documentId);
                        break;
                    default:
                        throw new Error(`Unsupported rollback delete collection: ${logicalCollection}`);
                }
                return;
            }

            switch (logicalCollection) {
                case 'content':
                    const isDraft = documentId.endsWith('_draft');
                    const cleanPageId = isDraft ? documentId.replace('_draft', '') : documentId;
                    await FirestoreService.savePageContent(cleanPageId, data, siteId, isDraft ? 'draft' : 'live');
                    break;
                case 'settings':
                    if (documentId === 'config') {
                        await FirestoreService.saveSiteSettings(siteId, data);
                    } else if (documentId === 'theme') {
                        await FirestoreService.saveThemeSettings(data, siteId);
                    } else if (documentId === 'seo') {
                        await FirestoreService.saveSEOData(siteId, data);
                    } else if (documentId === 'footer') {
                        await FirestoreService.saveFooterData(data, siteId);
                    } else {
                        await FirestoreService.saveSettings(siteId, documentId, data);
                    }
                    break;
                case 'events':
                    await FirestoreService.saveEvent(siteId, data, documentId);
                    break;
                case 'articles':
                    await FirestoreService.saveArticle(siteId, data, documentId);
                    break;
                case 'videos':
                    await FirestoreService.saveVideo(siteId, data, documentId);
                    break;
                case 'partners':
                    await FirestoreService.savePartner(siteId, data, documentId);
                    break;
                case 'products':
                    await FirestoreService.saveProduct(siteId, data, documentId);
                    break;
                case 'forms':
                    await FirestoreService.saveForm(siteId, documentId, data);
                    break;
                case 'reusable_sections':
                    await FirestoreService.saveReusableSection(siteId, documentId, data);
                    break;
                default:
                    throw new Error(`Unsupported rollback collection: ${logicalCollection}`);
            }
        } catch (error) {
            console.error("Error executing rollback:", error);
            throw error;
        }
    },

    getCustomSites: async (): Promise<any[]> => {
        try {
            const dbInstance = getDb('nspc');
            const docRef = doc(dbInstance, "settings", "sites");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().sites) {
                return docSnap.data().sites;
            }
            return [];
        } catch (error) {
            console.error("Error fetching custom sites:", error);
            return [];
        }
    },

    saveCustomSite: async (site: any): Promise<void> => {
        try {
            const dbInstance = getDb('nspc');
            const docRef = doc(dbInstance, "settings", "sites");
            const docSnap = await getDoc(docRef);
            let currentSites = [];
            if (docSnap.exists() && docSnap.data().sites) {
                currentSites = docSnap.data().sites;
            }
            currentSites = currentSites.filter((s: any) => s.id !== site.id);
            currentSites.push(site);
            await setDoc(docRef, { sites: currentSites }, { merge: true });
        } catch (error) {
            console.error("Error saving custom site:", error);
            throw error;
        }
    },

    cloneTenantData: async (sourceSiteId: string, destSiteId: string, options: { pages?: boolean; settings?: boolean }): Promise<void> => {
        try {
            const srcSite = getSiteById(sourceSiteId);
            const destSite = getSiteById(destSiteId);
            
            const srcDb = getDb(sourceSiteId);
            const destDb = getDb(destSiteId);

            const srcPrefix = srcSite?.usePrefix !== false ? sourceSiteId : '';
            const destPrefix = destSite?.usePrefix !== false ? destSiteId : '';

            // 1. Pages/Content cloning
            if (options.pages) {
                const srcContentCol = collection(srcDb, srcPrefix ? `${srcPrefix}_content` : 'content');
                const destContentCol = collection(destDb, destPrefix ? `${destPrefix}_content` : 'content');
                const snapshot = await getDocs(srcContentCol);
                
                for (const document of snapshot.docs) {
                    const data = document.data();
                    const docId = document.id;
                    
                    const targetDocId = docId.endsWith('_draft') ? docId : `${docId}_draft`;
                    
                    const targetDocRef = doc(destContentCol, targetDocId);
                    await setDoc(targetDocRef, {
                        ...data,
                        siteId: destSiteId,
                        layout: data.layout || {}
                    });
                }
            }

            // 2. Settings cloning
            if (options.settings) {
                const srcSettingsCol = collection(srcDb, srcPrefix ? `${srcPrefix}_settings` : 'settings');
                const destSettingsCol = collection(destDb, destPrefix ? `${destPrefix}_settings` : 'settings');
                const snapshot = await getDocs(srcSettingsCol);
                
                for (const document of snapshot.docs) {
                    const data = document.data();
                    const docId = document.id;
                    
                    if (docId === 'config') {
                        await setDoc(doc(destSettingsCol, docId), {
                            ...data,
                            siteId: destSiteId,
                            siteTitle: destSite?.name || data.siteTitle,
                            branding: {
                                ...data.branding,
                                siteName: destSite?.name || data.branding?.siteName
                            }
                        });
                    } else {
                        await setDoc(doc(destSettingsCol, docId), data);
                    }
                }
            }
        } catch (error) {
            console.error("Error cloning tenant data:", error);
            throw error;
        }
    }
};
