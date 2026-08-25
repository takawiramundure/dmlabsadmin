"use client";

import React, { useState, useEffect } from 'react';
import { Link, Globe } from 'lucide-react';
import Input from './input/InputField';
import { useSite } from '@/context/SiteContext';
import { FirestoreService } from '@/services/firestore';

interface LinkOption {
    label: string;
    value: string;
}

const STATIC_PAGES_BY_SITE: Record<string, LinkOption[]> = {
    kmfw: [
        { label: "Home", value: "/" },
        { label: "About Us", value: "/about" },
        { label: "Our Story", value: "/about/our-story" },
        { label: "Meet Our Team", value: "/about/meet-our-team" },
        { label: "Strategic Plan", value: "/about/our-strategic-plan" },
        { label: "Founder's Message", value: "/about/founders-message" },
        { label: "Celebrating 5 Years", value: "/about/celebrating-5-years" },
        { label: "Services (Overview)", value: "/services" },
        { label: "→ Counseling", value: "/services/grounded-counseling" },
        { label: "→ Educational Programs", value: "/services/educational-programs" },
        { label: "→ Advocacy & Education", value: "/services/advocacy-education" },
        { label: "→ Community Support", value: "/services/community-support" },
        { label: "→ System Navigation", value: "/services/system-navigation" },
        { label: "Events", value: "/impact/events" },
        { label: "Black Excellence Gala", value: "/impact/events/black-excellence-gala" },
        { label: "Impact (Overview)", value: "/impact" },
        { label: "Newsletters", value: "/impact/newsletters" },
        { label: "Success Stories", value: "/impact/success-stories" },
        { label: "Community Blog", value: "/impact/blog" },
        { label: "Gallery", value: "/impact/gallery" },
        { label: "Research (Overview)", value: "/research" },
        { label: "→ Black Wellness", value: "/research/black-wellness" },
        { label: "→ PHAC Child Welfare", value: "/research/phac-child-welfare" },
        { label: "→ Umoja Neurodivergent", value: "/research/umoja-neurodivergent" },
        { label: "Join Us", value: "/join" },
        { label: "→ Funders", value: "/join/funders" },
        { label: "→ Partners", value: "/join/partners" },
        { label: "→ Volunteer", value: "/join/volunteer" },
        { label: "→ Careers", value: "/join/careers" },
        { label: "Contact Us", value: "/contact" },
        { label: "Donate", value: "/donate" },
    ],
    bweic: [
        { label: "Home", value: "/" },
        { label: "Who We Are", value: "/who-we-are" },
        { label: "Our Story", value: "/our-story" },
        { label: "Leadership", value: "/leadership" },
        { label: "Board Members", value: "/board-members" },
        { label: "Partners", value: "/partners" },
        { label: "Careers", value: "/careers" },
        { label: "Our Work", value: "/our-work" },
        { label: "→ Healing & Wellness", value: "/signature-programs" },
        { label: "→ Empowerment & Capacity Building", value: "/special-initiatives" },
        { label: "→ Community & Belonging", value: "/policy-research" },
        { label: "→ The Sovereignty Circle", value: "/publications" },
        { label: "Take Action", value: "/take-action" },
        { label: "Media Center", value: "/media-center" },
        { label: "→ Videos", value: "/videos" },
        { label: "→ Upcoming Events", value: "/upcoming-events" },
        { label: "Blog", value: "/blogs" },
        { label: "Shop", value: "/shop" },
    ],
    nspc: [
        { label: "Home", value: "/" },
        { label: "Resources", value: "/resources" },
        { label: "Understanding", value: "/understanding" },
        { label: "Coping", value: "/coping" },
        { label: "Programs", value: "/programs" },
        { label: "Crisis Support", value: "/crisis-support" },
    ],
    elwg: [
        { label: "Home", value: "/" },
        { label: "About Us", value: "/about" },
        { label: "Programs", value: "/programs" },
        { label: "Volunteers", value: "/volunteers" },
        { label: "Contact", value: "/contact" },
        { label: "Donate", value: "/donate" },
    ],
    noel: [
        { label: "Home", value: "/" },
        { label: "Services (Overview)", value: "/services" },
        { label: "→ Exterior Work", value: "/services/exterior-work" },
        { label: "→ Sustainability", value: "/services/sustainability" },
        { label: "→ Decks & Patios", value: "/services/decks-patios" },
        { label: "→ Stairs & Railings", value: "/services/stairs-railings" },
        { label: "→ Renovations", value: "/services/renovations" },
        { label: "→ Eco-Solutions", value: "/services/eco-solutions" },
        { label: "→ Get Quote", value: "/services/get-quote" },
        { label: "Portfolio", value: "/portfolio" },
        { label: "Before & After", value: "/before-after" },
        { label: "Reviews", value: "/reviews" },
        { label: "Contact", value: "/contact" },
    ],
    phcg: [
        { label: "Home", value: "/" },
        { label: "About Us", value: "/about" },
        { label: "Care Services", value: "/services" },
        { label: "Join Team", value: "/careers" },
        { label: "FAQs", value: "/faq" },
        { label: "Contact", value: "/contact" },
        { label: "Free Consultation", value: "/#appointment" },
    ],
    aitasol: [
        { label: "Home", value: "/" },
        { label: "About Us", value: "/about" },
        { label: "Destinations", value: "/destinations" },
        { label: "Our Services", value: "/services" },
        { label: "Universities", value: "/universities" },
        { label: "Resources", value: "/blog" },
        { label: "Contact", value: "/contact" },
        { label: "Apply Now", value: "/apply" },
    ],
};

interface LinkPickerProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    siteId?: string;
}

const LinkPicker: React.FC<LinkPickerProps> = ({ value, onChange, label, placeholder, siteId }) => {
    const { currentSite } = useSite();
    const activeSiteId = siteId || currentSite?.id || 'kmfw';

    const [dynamicPages, setDynamicPages] = useState<LinkOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExternal, setIsExternal] = useState(false);

    // Fetch dynamic database pages
    useEffect(() => {
        let isMounted = true;
        const fetchPages = async () => {
            setLoading(true);
            try {
                const pages = await FirestoreService.getPages(activeSiteId);
                if (isMounted) {
                    const dynamicOptions = pages
                        .filter(p => p.id !== 'config' && p.id !== 'footer' && p.id !== 'theme' && p.id !== 'seo')
                        .map(p => {
                            const title = p.title || p.id;
                            const slug = p.slug || p.id;
                            const path = slug.startsWith('/') ? slug : `/${slug}`;
                            return {
                                label: `✨ ${title} (Database Page)`,
                                value: path
                            };
                        });
                    setDynamicPages(dynamicOptions);
                }
            } catch (err) {
                console.error("Error fetching pages in LinkPicker:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchPages();
        return () => {
            isMounted = false;
        };
    }, [activeSiteId]);

    // Static pages for active site
    const staticPages = STATIC_PAGES_BY_SITE[activeSiteId] || [{ label: "Home", value: "/" }];

    // Combine static and dynamic pages uniquely
    const allPages: LinkOption[] = React.useMemo(() => {
        const list = [...staticPages];
        dynamicPages.forEach(dyn => {
            if (!list.some(p => p.value === dyn.value)) {
                list.push(dyn);
            }
        });
        return list;
    }, [staticPages, dynamicPages]);

    useEffect(() => {
        // Detect if value is external (i.e. is not empty and does not start with "/" and is not a section link like "#")
        const isInternal = value === "" || value.startsWith('/') || value.startsWith('#');
        setIsExternal(!isInternal);
    }, [value]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === "external") {
            setIsExternal(true);
            // Don't clear value immediately, let the user edit the current path
        } else {
            setIsExternal(false);
            onChange(val);
        }
    };

    // If the value is internal but not in our list of static/dynamic pages,
    // add it dynamically to the options so it doesn't cause blank select boxes.
    const displayOptions = React.useMemo(() => {
        const list = [...allPages];
        if (value && (value.startsWith('/') || value.startsWith('#')) && !list.some(p => p.value === value)) {
            list.push({
                label: `Custom Path (${value})`,
                value: value
            });
        }
        return list;
    }, [allPages, value]);

    return (
        <div className="space-y-2 w-full">
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
            <div className="flex flex-col gap-2 w-full">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {isExternal ? <Globe size={16} /> : <Link size={16} />}
                    </div>
                    <select
                        value={isExternal ? "external" : value}
                        onChange={handleSelectChange}
                        className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <option value="">Select an internal page...</option>
                        {displayOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                        <option value="external" className="font-bold text-primary">Custom/External URL...</option>
                    </select>
                </div>

                {isExternal && (
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "https://example.com/..."}
                    />
                )}
            </div>
        </div>
    );
};

export default LinkPicker;
