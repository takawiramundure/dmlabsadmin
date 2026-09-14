"use client";

import React, { useEffect, useState, useCallback } from 'react';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Eye, EyeOff, ChevronDown, ChevronUp, Layers } from 'lucide-react';

// Map every page to its known sections, with human-readable names
const KMFW_PAGE_MAP: Record<string, { label: string; sections: Record<string, string> }> = {
    home: {
        label: 'Home Page',
        sections: {
            coreFoundations: 'Core Foundations',
            mindfulness: 'Mindfulness Section',
            mission: 'Mission / Objectives',
            whyWeWorkDifferently: 'Why We Work Differently',
            slideshow: 'Animated Image Slideshow',
            slider: 'Gallery Slider',
            howItWorks: 'How It Works',
            testimonials: 'Testimonials',
        }
    },
    about: {
        label: 'About Us',
        sections: {
            header: 'About Header',
            strategicPlan: 'Strategic Plan Summary',
            coreValues: 'Core Values',
        }
    },
    our_story: {
        label: 'Our Story',
        sections: {
            hero: 'Our Story Hero',
            origin: 'Origin Story',
            culturalIdentity: 'Cultural Identity',
            impact: 'Impact / Stats',
        }
    },
    meet_our_team: {
        label: 'Meet Our Team',
        sections: {
            hero: 'Team Hero',
            categories: 'Team Categories',
        }
    },
    contact: {
        label: 'Contact Us',
        sections: {
            details: 'Contact Details',
            officeHours: 'Office Hours',
            form: 'Contact Form',
        }
    },
    services: {
        label: 'Services Gateway',
        sections: {
            hero: 'Services Hero',
            overview: 'Services Overview',
            cta: 'Call to Action',
        }
    },
    educational_programs: {
        label: 'Educational Programs',
        sections: {
            hero: 'Programs Hero',
            programs: 'Program List',
            gallery: 'Photo Gallery',
        }
    },
    grounded_counseling: {
        label: 'Grounded Counseling',
        sections: {
            hero: 'Counseling Hero',
            success_benefits: 'Success & Benefits',
            referral_process: 'Referral Process',
        }
    },
    advocacy_education: {
        label: 'Advocacy & Education',
        sections: {
            hero: 'Hero Section',
            main_content: 'Workshops & Training List',
        }
    },
    community_support: {
        label: 'Community Support',
        sections: {
            hero: 'Hero Section',
            navigating_resources: 'Navigating Resources',
            community_events: 'Community Events',
            gallery: 'Photo Gallery',
        }
    },
    system_navigation: {
        label: 'System Navigation',
        sections: {
            hero: 'Hero Section',
            main_content: 'Navigation Services List',
            quote: 'Inspirational Quote',
        }
    },
    programs: {
        label: 'Programs & Services',
        sections: {
            hero: 'Programs Hero',
            overview: 'Programs Overview',
        }
    },
    impact: {
        label: 'Impact Gateway',
        sections: {
            hero: 'Impact Hero',
            stats: 'Impact Statistics',
            stories: 'Success Stories',
        }
    },
    newsletters: {
        label: 'Newsletters & News',
        sections: {
            newsletters: 'Quarterly Newsletters',
            news: 'Recent News & Features',
            mailingList: 'Mailing List CTA',
        }
    },
    success_stories: {
        label: 'Success Stories',
        sections: {
            hero: 'Success Stories Hero',
            stories: 'Client Success Stories',
        }
    },
    research: {
        label: 'Research & Consultancy',
        sections: {
            youthSurvey: 'Youth Survey Section',
            overview: 'Research Overview',
            quotes: 'Quotes & Visual Vision',
            leadConsultant: 'Founder Profile',
            additionalServices: 'Additional Services',
            additionalServicesItems: 'Additional Services List',
            activeProjects: 'Active Projects',
            contactCTA: 'Contact CTA',
        }
    },
    gala: {
        label: 'Black Excellence Gala',
        sections: {
            hero: 'Gala Hero',
            mission: 'Gala Mission',
            speakers: 'Keynote & Panelists',
            agenda: 'Event Agenda',
            awards: 'Award Categories',
            nominees: 'Nominees Directory',
            nominations: 'Nominations CTA',
            sponsors: 'Sponsors',
            network: 'Network',
            testimonials: 'Testimonials',
            finalCta: 'Final CTA',
        }
    },
    join_us: {
        label: 'Join Us Gateway',
        sections: {
            hero: 'Join Us Hero',
            ways: 'Ways to Join',
        }
    },
    funders: {
        label: 'Our Funders',
        sections: {
            hero: 'Funders Hero',
            main_content: 'Funder Categories',
        }
    },
    partners: {
        label: 'Our Partners',
        sections: {
            hero: 'Partners Hero',
            main_content: 'Partner Categories',
        }
    },
    careers: {
        label: 'Careers',
        sections: {
            hero: 'Careers Hero',
            quote: 'Philosophy Quote',
            employment_support: 'Employment Support',
            join_our_team: 'Join Our Team CTA',
            listings: 'Current Opportunities',
        }
    },
    volunteer: {
        label: 'Volunteer',
        sections: {
            hero: 'Volunteer Hero',
            testimonials: 'Volunteer Testimonials',
            application_cta: 'Application Form CTA',
            board_call: 'Board Membership Call',
            volunteer_needs: 'Current Needs List',
        }
    },
    blog: {
        label: 'Blog Page',
        sections: {
            main: 'Main Blog Feed'
        }
    }
};

const BWEIC_PAGE_MAP: Record<string, { label: string; sections: Record<string, string> }> = {
    home: {
        label: 'Home Page',
        sections: {
            founder: 'Message from Founder',
            mission: 'Why Choose BWEIC',
            slider: 'Image Slider',
            impact: 'Impact / Stats',
        }
    },
};

export default function PageVisibilityManager() {
    const { currentSite } = useSite();
    const pageMap = currentSite.id === 'kmfw' ? KMFW_PAGE_MAP : BWEIC_PAGE_MAP;

    // pageId -> sectionId -> enabled boolean
    const [visibilityState, setVisibilityState] = useState<Record<string, Record<string, boolean>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');
    const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});

    const loadAll = useCallback(async () => {
        setLoading(true);
        const newState: Record<string, Record<string, boolean>> = {};

        await Promise.all(
            Object.entries(pageMap).map(async ([pageId, pageConfig]) => {
                try {
                    const data = await FirestoreService.getPageContent(pageId, currentSite.id);
                    const sections = data?.sections || {};
                    newState[pageId] = {};
                    Object.keys(pageConfig.sections).forEach(sectionId => {
                        // Default to true (visible) if not specified
                        newState[pageId][sectionId] = sections[sectionId]?.enabled !== false;
                    });
                } catch {
                    // Page data doesn't exist — all sections default to visible
                    newState[pageId] = {};
                    Object.keys(pageConfig.sections).forEach(sectionId => {
                        newState[pageId][sectionId] = true;
                    });
                }
            })
        );

        setVisibilityState(newState);
        setLoading(false);
    }, [currentSite.id]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const toggleSection = (pageId: string, sectionId: string) => {
        setVisibilityState(prev => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                [sectionId]: !prev[pageId]?.[sectionId]
            }
        }));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setError('');
        setSuccessMsg('');
        try {
            await Promise.all(
                Object.entries(visibilityState).map(async ([pageId, sections]) => {
                    // Fetch existing data so we don't overwrite fields
                    const existing = await FirestoreService.getPageContent(pageId, currentSite.id) || { sections: {} };
                    const updatedSections = { ...(existing.sections || {}) };
                    Object.entries(sections).forEach(([sectionId, enabled]) => {
                        updatedSections[sectionId] = {
                            ...(updatedSections[sectionId] || {}),
                            enabled
                        };
                    });
                    await FirestoreService.savePageContent(pageId, { ...existing, sections: updatedSections }, currentSite.id);
                })
            );
            setSuccessMsg('All visibility settings saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error(err);
            setError('Failed to save some settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const togglePage = (pageId: string) => {
        setExpandedPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
    };

    const getPageStats = (pageId: string) => {
        const sections = visibilityState[pageId] || {};
        const total = Object.keys(pageMap[pageId]?.sections || {}).length;
        const visible = Object.values(sections).filter(Boolean).length;
        return { visible, total };
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-48">
                <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-5 h-5 border-2 border-t-blue-500 rounded-full animate-spin border-gray-300" />
                    Loading visibility settings...
                </div>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title={`Page Visibility Manager - ${currentSite.name} | Admin Portal`}
                description="Toggle any section on or off across all pages"
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Layers size={20} className="text-blue-500" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Page Visibility Manager</h2>
                        </div>
                        <p className="text-sm text-gray-500">
                            Toggle any section on any page on or off for {currentSite.name}. Click {'"'}Save All{'"'} to apply changes.
                        </p>
                    </div>
                    <Button onClick={handleSaveAll} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <div className="space-y-3">
                    {Object.entries(pageMap).map(([pageId, pageConfig]) => {
                        const isExpanded = expandedPages[pageId];
                        const { visible, total } = getPageStats(pageId);
                        const allVisible = visible === total;
                        const noneVisible = visible === 0;

                        return (
                            <div
                                key={pageId}
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                            >
                                {/* Page row header */}
                                <div
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
                                    onClick={() => togglePage(pageId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${allVisible ? 'bg-green-500' : noneVisible ? 'bg-red-400' : 'bg-amber-400'}`} />
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white/90">{pageConfig.label}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {visible}/{total} sections visible
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-gray-400">
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>

                                {/* Section rows */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                                        {Object.entries(pageConfig.sections).map(([sectionId, sectionLabel]) => {
                                            const isEnabled = visibilityState[pageId]?.[sectionId] !== false;
                                            return (
                                                <div
                                                    key={sectionId}
                                                    className={`flex items-center justify-between px-5 py-3 transition-colors ${isEnabled ? 'bg-white dark:bg-transparent' : 'bg-gray-50/80 dark:bg-black/10'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-sm font-medium ${isEnabled ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 line-through'}`}>
                                                            {sectionLabel}
                                                        </span>
                                                        {!isEnabled && (
                                                            <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Hidden</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSection(pageId, sectionId)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                            isEnabled
                                                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700/30'
                                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                        }`}
                                                    >
                                                        {isEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
                                                        {isEnabled ? 'Visible' : 'Hidden'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
