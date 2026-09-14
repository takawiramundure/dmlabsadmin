"use client";

import { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import MediaPickerModal from "@/components/common/MediaPickerModal";
import { GridIcon } from "@/icons";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { storage } from "@/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { SEED_DATA } from "@/config/seedData";
import FolderPicker from "@/components/form/FolderPicker";
import { optimizeImage } from "@/utils/imageOptimizer";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

// ---- Sortable Item Component for Slides ----
function SortableSlideItem({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    // We add a 'handle' class to specific elements if we wanted a drag handle,
    // but here we just want to ensure inputs are clickable.
    // Dnd-kit usually handles this well with PointerSensor constraints, see parent component.

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4">
            {children}
        </div>
    );
}

interface HeroSlide {
    id: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    pillText?: string;
    cta: string;
    link: string;
    ticketCta?: string;
    ticketCtaLink?: string;
    showTicketCta?: boolean;
    isActive: boolean;
}

export default function HeroManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [useFolderMapping, setUseFolderMapping] = useState(false);
    const [folderPath, setFolderPath] = useState("");
    const [globalTitle, setGlobalTitle] = useState("");
    const [globalSubtitle, setGlobalSubtitle] = useState("");
    const [globalPillText, setGlobalPillText] = useState("");
    const [globalCta, setGlobalCta] = useState("");
    const [globalLink, setGlobalLink] = useState("");
    const [globalTicketCta, setGlobalTicketCta] = useState("");
    const [globalTicketCtaLink, setGlobalTicketCtaLink] = useState("");
    const [globalShowTicketCta, setGlobalShowTicketCta] = useState(true);
    const [gradientLevel, setGradientLevel] = useState(70);
    const [showTrustInfo, setShowTrustInfo] = useState(true);
    const [trustText, setTrustText] = useState("");
    const [trustColor1, setTrustColor1] = useState("#D4AF37");
    const [trustColor2, setTrustColor2] = useState("#0D9488");
    const [trustColor3, setTrustColor3] = useState("#D4AF37");
    const [trustColor4, setTrustColor4] = useState("#0D9488");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<string | null>(null); // ID of slide being uploaded
    const [migrating, setMigrating] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

    // Sensors configuration to allow text selection and input focus
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Drag only starts after moving 8px, preventing accidental drags on clicks
            },
        })
    );

    // Site-specific default slides
    const getDefaultSlides = (): HeroSlide[] => {
        const siteData = SEED_DATA[currentSite.id as keyof typeof SEED_DATA];
        return siteData?.hero_slider?.slides || [];
    };

    useEffect(() => {
        loadSlides();
    }, [currentSite.id]); // Reload when site changes

    const loadSlides = async () => {
        setLoading(true);
        try {
            const data: any = await FirestoreService.getPageContent("hero_slider", currentSite.id);
            if (data) {
                if (data.slides && data.slides.length > 0) {
                    setSlides(data.slides);
                } else {
                    setSlides(getDefaultSlides());
                }
                setUseFolderMapping(data.useFolderMapping || false);
                setFolderPath(data.folderPath || "");
                const firstSlide = data.slides?.[0] || {};
                setGlobalTitle(data.globalTitle !== undefined ? data.globalTitle : (firstSlide.title || ""));
                setGlobalSubtitle(data.globalSubtitle !== undefined ? data.globalSubtitle : (firstSlide.subtitle || ""));
                setGlobalPillText(data.globalPillText !== undefined ? data.globalPillText : (firstSlide.pillText || ""));
                setGlobalCta(data.globalCta !== undefined ? data.globalCta : (firstSlide.cta || ""));
                setGlobalLink(data.globalLink !== undefined ? data.globalLink : (firstSlide.link || ""));
                setGlobalTicketCta(data.globalTicketCta !== undefined ? data.globalTicketCta : (firstSlide.ticketCta || ""));
                setGlobalTicketCtaLink(data.globalTicketCtaLink !== undefined ? data.globalTicketCtaLink : (firstSlide.ticketCtaLink || ""));
                setGlobalShowTicketCta(data.globalShowTicketCta !== undefined ? data.globalShowTicketCta : (firstSlide.showTicketCta !== false));
                setGradientLevel(data.gradientLevel !== undefined ? Number(data.gradientLevel) : 70);
                setShowTrustInfo(data.showTrustInfo !== undefined ? data.showTrustInfo : true);
                setTrustText(data.trustText !== undefined ? data.trustText : "Joined by 200+ families in our community");
                setTrustColor1(data.trustColor1 || "#D4AF37");
                setTrustColor2(data.trustColor2 || "#0D9488");
                setTrustColor3(data.trustColor3 || "#D4AF37");
                setTrustColor4(data.trustColor4 || "#0D9488");
            } else {
                const defaults = getDefaultSlides();
                setSlides(defaults);
                setUseFolderMapping(false);
                setFolderPath("");
                const firstSlide = defaults[0] || {};
                setGlobalTitle(firstSlide.title || "");
                setGlobalSubtitle(firstSlide.subtitle || "");
                setGlobalPillText(firstSlide.pillText || "");
                setGlobalCta(firstSlide.cta || "");
                setGlobalLink(firstSlide.link || "");
                setGlobalTicketCta(firstSlide.ticketCta || "");
                setGlobalTicketCtaLink(firstSlide.ticketCtaLink || "");
                setGlobalShowTicketCta(firstSlide.showTicketCta !== false);
                setGradientLevel(70);
                setShowTrustInfo(true);
                setTrustText("Joined by 200+ families in our community");
                setTrustColor1("#D4AF37");
                setTrustColor2("#0D9488");
                setTrustColor3("#D4AF37");
                setTrustColor4("#0D9488");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load slides.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccessMsg("");
        try {
            await FirestoreService.savePageContent("hero_slider", { 
                slides, 
                useFolderMapping, 
                folderPath,
                globalTitle,
                globalSubtitle,
                globalPillText,
                globalCta,
                globalLink,
                globalTicketCta,
                globalTicketCtaLink,
                globalShowTicketCta,
                gradientLevel,
                showTrustInfo,
                trustText,
                trustColor1,
                trustColor2,
                trustColor3,
                trustColor4
            } as any, currentSite.id);
            setSuccessMsg("Hero slider updated successfully!");
        } catch (err) {
            console.error(err);
            setError("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(slideId);
        try {
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `${currentSite.id}/hero_slider/${Date.now()}_${cleanName}`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            updateSlide(slideId, 'imageUrl', downloadURL);
        } catch (err) {
            console.error(err);
            setError("Failed to upload image. Please try again.");
        } finally {
            setUploading(null);
        }
    };

    // Function to migrate external images to Firebase
    const migrateImages = async () => {
        const isConfirmed = await confirm({
            title: "Migrate External Images",
            message: "This will download all \'framerusercontent\' images and re-upload them to your own storage settings. Continue?",
            variant: "warning",
            confirmLabel: "Migrate"
        });

        if (!isConfirmed) return;

        setMigrating(true);
        setError("");
        setSuccessMsg("Migrating images... please wait.");

        try {
            const updatedSlides = [...slides];
            let changed = false;

            for (let i = 0; i < updatedSlides.length; i++) {
                const slide = updatedSlides[i];
                if (slide.imageUrl && slide.imageUrl.includes("framerusercontent")) {
                    try {
                        // Fetch the image as blob
                        const response = await fetch(slide.imageUrl);
                        const blob = await response.blob();
                        const filename = `migrated_slide_${Date.now()}_${i}.jpg`;

                        // Upload to firebase
                        const storageRef = ref(storage, `${currentSite.id}/hero_slider/${filename}`);
                        const snapshot = await uploadBytes(storageRef, blob);
                        const firebaseURL = await getDownloadURL(snapshot.ref);

                        updatedSlides[i] = { ...slide, imageUrl: firebaseURL };
                        changed = true;

                    } catch (e) {
                        console.error(`Failed to migrate image for slide ${i + 1}`, e);
                    }
                }
            }

            if (changed) {
                setSlides(updatedSlides);
                // Auto save after migration
                await FirestoreService.savePageContent("hero_slider", { slides: updatedSlides } as any, currentSite.id);
                setSuccessMsg("All images successfully migrated to Firebase!");
            } else {
                setSuccessMsg("No external images found to migrate.");
            }

        } catch (err) {
            console.error(err);
            setError("Migration failed. Please check console.");
        } finally {
            setMigrating(false);
        }
    };

    const addSlide = () => {
        const newSlide: HeroSlide = {
            id: Date.now().toString(),
            imageUrl: "",
            title: "New Slide",
            subtitle: "Subtitle goes here",
            pillText: "",
            cta: "Learn More",
            link: "#",
            ticketCta: "Get Tickets",
            ticketCtaLink: "/tickets",
            showTicketCta: true,
            isActive: true
        };
        setSlides([...slides, newSlide]);
    };

    const updateSlide = (id: string, field: keyof HeroSlide, value: any) => {
        setSlides(slides.map(slide =>
            slide.id === id ? { ...slide, [field]: value } : slide
        ));
    };

    const removeSlide = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Slide",
            message: "Are you sure you want to delete this slide?",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (isConfirmed) {
            setSlides(slides.filter(s => s.id !== id));
        }
    };

    const seedKMFWHero = () => {
        const kmfwSlide: HeroSlide = {
            id: Date.now().toString(),
            imageUrl: "/assets/illustrations/butterfly.jpg",
            title: "You don't have to navigate this alone.",
            subtitle: "We provide a gentle hand and expert guidance for families seeking mental health support. Your journey to wellness starts with a single, safe step.",
            pillText: "Welcome to Kind Minds Family Wellness",
            cta: "Get Support Now",
            link: "/services",
            ticketCta: "Get Tickets",
            ticketCtaLink: "/tickets",
            showTicketCta: true,
            isActive: true
        };
        setSlides([kmfwSlide]);
        setSuccessMsg("KMFW Hero content seeded! Remember to click Save Changes.");
    };

    const seedNoelHero = () => {
        const noelSlides: HeroSlide[] = [
            {
                id: 'n1-' + Date.now(),
                title: 'Mastering the Art of Woodworking',
                subtitle: 'Custom cabinetry and fine carpentry that transforms your home.',
                cta: 'View Our Gallery',
                link: '/portfolio',
                imageUrl: '/hero-bg.png',
                isActive: true
            },
            {
                id: 'n2-' + Date.now(),
                title: 'High-End Renovations',
                subtitle: 'Meticulous attention to detail for residential and commercial transformations.',
                cta: 'Our Services',
                link: '/services',
                imageUrl: '/project-stairs.png',
                isActive: true
            },
            {
                id: 'n3-' + Date.now(),
                title: 'Luxury Outdoor Living',
                subtitle: 'Architectural decks and patios built to last a lifetime.',
                cta: 'Get a Quote',
                link: '/contact',
                imageUrl: '/service-decks.png',
                isActive: true
            }
        ];
        setSlides(noelSlides);
        setSuccessMsg("Noel Construction Hero content seeded! Remember to click Save Changes.");
    };

    const seedPHCGHero = () => {
        const phcgSlides: HeroSlide[] = [
            {
                id: 'ph1-' + Date.now(),
                title: 'Compassionate Home Care for Your Loved Ones',
                subtitle: 'Professional PSW and nursing services tailored to your needs in the comfort of home.',
                cta: 'View Services',
                link: '/services',
                imageUrl: 'https://storage.googleapis.com/nspc-web.firebasestorage.app/phcg/senior_care_1.png',
                isActive: true
            },
            {
                id: 'ph2-' + Date.now(),
                title: 'Your Health, Our Priority',
                subtitle: 'Our team of RNs and RPNs provide expert medical care right at your doorstep.',
                cta: 'Book Consultation',
                link: '/#appointment',
                imageUrl: 'https://storage.googleapis.com/nspc-web.firebasestorage.app/phcg/senior_care_2.png',
                isActive: true
            },
            {
                id: 'ph3-' + Date.now(),
                title: 'Quality Care You Can Trust',
                subtitle: 'Dedicated professionals providing personalized support for seniors.',
                cta: 'Contact Us',
                link: '/contact',
                imageUrl: 'https://storage.googleapis.com/nspc-web.firebasestorage.app/phcg/senior_care_3.png',
                isActive: true
            },
            {
                id: 'ph4-' + Date.now(),
                title: 'Supporting Independent Living',
                subtitle: 'Helping seniors maintain independence and quality of life at home.',
                cta: 'Learn More',
                link: '/about',
                imageUrl: 'https://storage.googleapis.com/nspc-web.firebasestorage.app/phcg/senior_care_4.png',
                isActive: true
            }
        ];
        setSlides(phcgSlides);
        setSuccessMsg("PHCG Hero content seeded with Firebase images! Remember to click Save Changes.");
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setSlides((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    if (loading) return <div className="p-6">Loading slider configuration...</div>;

    return (
        <>
            <PageMeta title="Hero Manager | NSPC Admin" description="Manage Home Page Slider" />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            Hero Section Manager
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage the main image slider on the home page.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {currentSite.id === 'kmfw' && (
                            <>
                                <VersionHistoryManager documentId="hero_slider" siteId={currentSite.id} />
                                <Button requireSuperAdmin variant="outline" onClick={seedKMFWHero}>
                                    Seed KMFW Hero Content
                                </Button>
                            </>
                        )}
                        {currentSite.id === 'noel' && (
                            <Button requireSuperAdmin variant="outline" onClick={seedNoelHero}>
                                Seed Noel Hero Content
                            </Button>
                        )}
                        {currentSite.id === 'phcg' && (
                            <Button requireSuperAdmin variant="outline" onClick={seedPHCGHero}>
                                Seed PHCG Hero Content
                            </Button>
                        )}
                        <Button variant="outline" onClick={migrateImages} disabled={migrating}>
                            {migrating ? "Migrating..." : "↻ Migrate Images to Storage"}
                        </Button>
                        <Button variant="outline" onClick={addSlide}>+ Add Slide</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error && <div className="mb-4"><Alert variant="error" title="Error" message={error} /></div>}
                {successMsg && <div className="mb-4"><Alert variant="success" title="Success" message={successMsg} /></div>}

                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                    <h4 className="font-semibold mb-1">Image Guidelines:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Recommended resolution: <strong>1920x1080 px</strong> (16:9 aspect ratio)</li>
                        <li>Format: JPG or WebP. Max size: 2MB.</li>
                    </ul>
                </div>

                {/* Folder Mapping Settings */}
                <div className="mb-6 p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Image Slider Source Settings</h3>
                    <div className="flex items-center gap-3 mb-4">
                        <input
                            id="use-folder-mapping"
                            type="checkbox"
                            checked={useFolderMapping}
                            onChange={(e) => setUseFolderMapping(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="use-folder-mapping" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Use Firebase Storage folder for Hero images (overrides individual slide images)
                        </label>
                    </div>
                    
                    {useFolderMapping && (
                        <div className="max-w-xl">
                            <FolderPicker
                                label="Select Media Folder"
                                value={folderPath}
                                onChange={(path) => setFolderPath(path)}
                                helpText="Select a folder from the Media Library to use its images in the Hero slider."
                            />
                        </div>
                    )}
                </div>

                {/* Hero Overlay Style Settings */}
                <div className="mb-6 p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Hero Overlay Style Settings</h3>
                    <div className="max-w-xl">
                        <Label>Gradient Overlay Opacity (Darkness level)</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={gradientLevel}
                                onChange={(e) => setGradientLevel(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                            />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-12 text-right">
                                {gradientLevel}%
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Adjust how dark the overlay is on background images. Lower values make images brighter; higher values increase text contrast. Set to 0% to turn off completely.
                        </p>
                    </div>
                </div>

                {/* KMFW-specific Trust Settings */}
                {currentSite.id === 'kmfw' && (
                    <div className="mb-6 p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700">
                        <div className="flex items-center justify-between border-b pb-3 mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Community Trust Settings</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">{showTrustInfo ? 'Enabled' : 'Disabled'}</span>
                                <button
                                    onClick={() => setShowTrustInfo(prev => !prev)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showTrustInfo ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showTrustInfo ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {showTrustInfo && (
                            <div className="space-y-4">
                                <div className="max-w-xl">
                                    <Label>Trust Badge Text</Label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Joined by 200+ families in our community"
                                        value={trustText}
                                        onChange={(e) => setTrustText(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label className="mb-2">Trust Circle Colors</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl">
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Circle 1</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={trustColor1}
                                                    onChange={(e) => setTrustColor1(e.target.value)}
                                                    className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={trustColor1}
                                                    onChange={(e) => setTrustColor1(e.target.value)}
                                                    className="w-full text-xs font-mono p-1 border border-gray-200 rounded dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                                                    placeholder="#D4AF37"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Circle 2</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={trustColor2}
                                                    onChange={(e) => setTrustColor2(e.target.value)}
                                                    className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={trustColor2}
                                                    onChange={(e) => setTrustColor2(e.target.value)}
                                                    className="w-full text-xs font-mono p-1 border border-gray-200 rounded dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                                                    placeholder="#0D9488"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Circle 3</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={trustColor3}
                                                    onChange={(e) => setTrustColor3(e.target.value)}
                                                    className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={trustColor3}
                                                    onChange={(e) => setTrustColor3(e.target.value)}
                                                    className="w-full text-xs font-mono p-1 border border-gray-200 rounded dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                                                    placeholder="#D4AF37"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Circle 4</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={trustColor4}
                                                    onChange={(e) => setTrustColor4(e.target.value)}
                                                    className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={trustColor4}
                                                    onChange={(e) => setTrustColor4(e.target.value)}
                                                    className="w-full text-xs font-mono p-1 border border-gray-200 rounded dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                                                    placeholder="#0D9488"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {useFolderMapping ? (
                    <div className="p-6 border border-gray-200 rounded-xl bg-white dark:bg-white/[0.02] dark:border-gray-800 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90 border-b pb-2 mb-4">Global Hero Caption (Overlay Text)</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Heading (Title)</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Culture, Research & Engagement"
                                    value={globalTitle}
                                    onChange={(e) => setGlobalTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Subtitle (Description)</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. We provide mental health support for families..."
                                    value={globalSubtitle}
                                    onChange={(e) => setGlobalSubtitle(e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Pill Text (Optional Highlight Tag)</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Welcome to Kind Minds"
                                    value={globalPillText}
                                    onChange={(e) => setGlobalPillText(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Primary Button Text</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Learn More"
                                    value={globalCta}
                                    onChange={(e) => setGlobalCta(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Primary Button Link</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. /about"
                                    value={globalLink}
                                    onChange={(e) => setGlobalLink(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="col-span-2 flex items-center justify-between">
                                <Label className="!mb-0">Secondary Button (Gold Gradient / Tickets)</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{globalShowTicketCta !== false ? 'Enabled' : 'Disabled'}</span>
                                    <button
                                        onClick={() => setGlobalShowTicketCta(prev => !prev)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${globalShowTicketCta !== false ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${globalShowTicketCta !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <Label>Button Label</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. Get Tickets"
                                    value={globalTicketCta}
                                    onChange={(e) => setGlobalTicketCta(e.target.value)}
                                    disabled={globalShowTicketCta === false}
                                />
                            </div>
                            <div>
                                <Label>Button Link</Label>
                                <Input
                                    type="text"
                                    placeholder="e.g. /tickets"
                                    value={globalTicketCtaLink}
                                    onChange={(e) => setGlobalTicketCtaLink(e.target.value)}
                                    disabled={globalShowTicketCta === false}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                    >
                        <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {slides.map((slide, index) => (
                                    <SortableSlideItem key={slide.id} id={slide.id}>
                                        <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 dark:bg-white/[0.02] dark:border-gray-700 relative group">
                                            <div className="absolute top-4 right-4 flex gap-2 z-10">
                                                <button
                                                    onClick={() => updateSlide(slide.id, 'isActive', !slide.isActive)}
                                                    className={`text-xs px-2 py-1 rounded border ${slide.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                >
                                                    {slide.isActive ? 'Active' : 'Disabled'}
                                                </button>
                                                <button
                                                    onClick={() => removeSlide(slide.id)}
                                                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                >
                                                    Delete
                                                </button>
                                            </div>

                                            <div className="mb-4 pr-20">
                                                <span className="inline-block px-2 py-1 text-xs font-mono text-gray-500 bg-gray-200 rounded mb-2">Slide {index + 1}</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4" onPointerDown={(e) => e.stopPropagation()}>
                                                    <div>
                                                        <Label>Image Source</Label>
                                                        <div className="flex flex-col gap-2">
                                                            <Input
                                                                type="text"
                                                                placeholder="https://..."
                                                                value={slide.imageUrl}
                                                                onChange={(e) => updateSlide(slide.id, 'imageUrl', e.target.value)}
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500">OR</span>
                                                                    <label className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading === slide.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                                        {uploading === slide.id ? "Uploading..." : "Upload Image"}
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            className="hidden"
                                                                            onChange={(e) => handleFileUpload(e, slide.id)}
                                                                            disabled={uploading === slide.id}
                                                                        />
                                                                    </label>
                                                                </div>
                                                                <button
                                                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                                                                    onClick={() => {
                                                                        setActiveSlideId(slide.id);
                                                                        setShowMediaPicker(true);
                                                                    }}
                                                                >
                                                                    <GridIcon className="w-4 h-4 mr-2 text-gray-500" />
                                                                    Select from Library
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Heading</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="Slide Title (Leave empty to hide)"
                                                        value={slide.title}
                                                        onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Subtitle</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="Slide Subtitle (Leave empty to hide)"
                                                        value={slide.subtitle}
                                                        onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <Label>Pill Text (Optional Highlight Tag)</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g. Welcome to Kind Minds"
                                                            value={slide.pillText || ""}
                                                            onChange={(e) => updateSlide(slide.id, 'pillText', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <Label>Primary Button Text</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g. Learn More"
                                                            value={slide.cta || ""}
                                                            onChange={(e) => updateSlide(slide.id, 'cta', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Primary Button Link</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g. /about"
                                                            value={slide.link || ""}
                                                            onChange={(e) => updateSlide(slide.id, 'link', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                    <div className="col-span-2 flex items-center justify-between">
                                                        <Label className="!mb-0">Secondary Button (Gold Gradient / Tickets)</Label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500">{slide.showTicketCta !== false ? 'Enabled' : 'Disabled'}</span>
                                                            <button
                                                                onClick={() => updateSlide(slide.id, 'showTicketCta', slide.showTicketCta === false)}
                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${slide.showTicketCta !== false ? 'bg-blue-600' : 'bg-gray-300'}`}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                            >
                                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${slide.showTicketCta !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Button Label</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g. Get Tickets"
                                                            value={slide.ticketCta || ""}
                                                            onChange={(e) => updateSlide(slide.id, 'ticketCta', e.target.value)}
                                                            disabled={slide.showTicketCta === false}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Button Link</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g. /tickets"
                                                            value={slide.ticketCtaLink || ""}
                                                            onChange={(e) => updateSlide(slide.id, 'ticketCtaLink', e.target.value)}
                                                            disabled={slide.showTicketCta === false}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center">
                                                <Label>Preview</Label>
                                                <div className="aspect-video w-full bg-gray-200 rounded-lg overflow-hidden border border-gray-300 relative group-hover:border-blue-300 transition-colors">
                                                    {slide.imageUrl ? (
                                                        <>
                                                            <img src={slide.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            {(slide.title || slide.subtitle) && (
                                                                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-white p-6 text-center">
                                                                    {slide.title && <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>}
                                                                    {slide.subtitle && <p className="text-sm opacity-90 mb-4">{slide.subtitle}</p>}
                                                                    {slide.cta && <span className="px-4 py-2 bg-blue-600 rounded text-xs font-semibold">{slide.cta}</span>}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                            No Image Selected
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </SortableSlideItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                <MediaPickerModal
                    isOpen={showMediaPicker}
                    onClose={() => setShowMediaPicker(false)}
                    onSelect={(url) => {
                        if (activeSlideId) {
                            updateSlide(activeSlideId, 'imageUrl', url);
                        }
                    }}
                />
            </div >
        </>
    );
}
