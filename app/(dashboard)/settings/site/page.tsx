"use client";

import React, { useState, useEffect } from 'react';
import { FirestoreService } from "@/services/firestore";
import { SiteSettings, SiteTheme, NavigationItem } from "@/types/siteSettings";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Plus, Trash2, GripVertical, Save, Upload, ExternalLink, ArrowUp, ArrowDown, Image as ImageIcon, Search, Crop, Eye, EyeOff } from 'lucide-react';
import MediaPickerModal from "@/components/common/MediaPickerModal";
import ImageCropperModal from "@/components/common/ImageCropperModal";
import { storage } from "@/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { availableRoutes } from "@/utils/routes";
import { GET_DEFAULT_NAV, GET_SITE_DEFAULTS, GET_SITE_THEME_DEFAULTS } from "@/config/navigationDefaults";
import { useDialog } from "@/context/DialogContext";
import { optimizeImage } from "@/utils/imageOptimizer";

import RichTextEditor from "@/components/form/RichTextEditor";
import LinkPicker from "@/components/form/LinkPicker";

type TabType = 'general' | 'navigation' | 'theme' | 'seo' | 'scripts' | 'payments' | 'retell' | 'ai' | 'integrations';

export default function SiteSettingsManager() {
    const { currentSite } = useSite();
    const { confirm, alert } = useDialog();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'favicon' | 'aiLogo' | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [isAiLogoUploading, setIsAiLogoUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // ... (rest of the component state and callbacks)

    // Helper to render datalist options
    const renderRouteOptions = () => (
        <datalist id="route-options">
            {availableRoutes.map((route) => (
                <option key={route.path} value={route.path}>
                    {route.label}
                </option>
            ))}
        </datalist>
    );

    // ... (rendering logic)



    useEffect(() => {
        if (currentSite) {
            loadSettings();
        }
    }, [currentSite]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await FirestoreService.getSiteSettings(currentSite.id);
            
            const defaultNav = GET_DEFAULT_NAV(currentSite.id);
            const siteDefaults = GET_SITE_DEFAULTS(currentSite.id, currentSite.name);

            if (data && data.navigation && data.navigation.length > 0) {
                // Firestore is the single source of truth for navigation.
                // Do NOT re-inject default sub-items that are missing — the admin may have
                // intentionally moved or removed them. Trust what is saved in Firestore.
                // (No merge needed here; the admin UI renders exactly what Firestore holds.)
            } else if (data && (!data.navigation || data.navigation.length <= 1)) {
                data.navigation = defaultNav;
            }

            if (data && data.theme) {
                const defaultTheme = GET_SITE_THEME_DEFAULTS(currentSite.id);
                // If the primary color is black or missing, we treat it as an unconfigured default
                const isUnconfigured = data.theme.primary === '#000' || data.theme.primary === '#000000' || !data.theme.primary;
                if (isUnconfigured) {
                    data.theme = {
                        ...defaultTheme,
                        ...data.theme,
                        primary: data.theme.primary && data.theme.primary !== '#000' && data.theme.primary !== '#000000' ? data.theme.primary : defaultTheme.primary,
                        secondary: data.theme.secondary && data.theme.secondary !== '#000' && data.theme.secondary !== '#000000' ? data.theme.secondary : defaultTheme.secondary,
                        accent: data.theme.accent && data.theme.accent !== '#000' && data.theme.accent !== '#000000' ? data.theme.accent : defaultTheme.accent,
                        brandColor: data.theme.brandColor && data.theme.brandColor !== '#000' && data.theme.brandColor !== '#000000' ? data.theme.brandColor : defaultTheme.brandColor,
                        brandColorLight: data.theme.brandColorLight && data.theme.brandColorLight !== '#000' && data.theme.brandColorLight !== '#000000' ? data.theme.brandColorLight : defaultTheme.brandColorLight,
                        brandColorDark: data.theme.brandColorDark && data.theme.brandColorDark !== '#000' && data.theme.brandColorDark !== '#000000' ? data.theme.brandColorDark : defaultTheme.brandColorDark,
                        topBarBg: data.theme.topBarBg && data.theme.topBarBg !== '#000' && data.theme.topBarBg !== '#000000' ? data.theme.topBarBg : defaultTheme.topBarBg,
                        textDark: data.theme.textDark && data.theme.textDark !== '#000' && data.theme.textDark !== '#000000' ? data.theme.textDark : defaultTheme.textDark,
                    };
                }
            }

            // Auto-initialize if no data found
            const finalSettings: SiteSettings = data || {
                siteId: currentSite.id,
                siteTitle: currentSite.name,
                siteDescription: siteDefaults.description,
                siteKeywords: siteDefaults.keywords,
                branding: { 
                    siteName: currentSite.name, 
                    logo: '',
                    favicon: '/favicon.ico'
                },
                theme: GET_SITE_THEME_DEFAULTS(currentSite.id),
                navigation: defaultNav,
                maintenanceMode: false,
                emergencyBar: {
                    enabled: false,
                    content: 'Important update regarding our services.',
                    bgColor: '#84cc16'
                },
                topBar: {
                    enabled: false,
                    message: '',
                    phone: '',
                    email: ''
                },
                paymentGateways: {
                    currency: 'CAD',
                    stripePublicKey: '',
                    squareAppId: '',
                    squareLocationId: ''
                },
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    updatedBy: 'system'
                }
            };

            // Auto-save to Firestore if this is the first time (config doc was null)
            if (!data) {
                try {
                    await FirestoreService.saveSiteSettings(currentSite.id, finalSettings);
                    console.log('[SiteSettingsManager] Auto-seeded default settings to Firestore.');
                } catch (saveErr) {
                    console.warn('[SiteSettingsManager] Could not auto-save defaults:', saveErr);
                }
            }

            setSettings(finalSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
            setStatus({ type: 'error', msg: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            setStatus(null);
            await FirestoreService.saveSiteSettings(currentSite.id, settings);
            setStatus({ type: 'success', msg: 'Settings saved successfully!' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setStatus({ type: 'error', msg: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !settings) return;

        setUploading(true);
        try {
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `${currentSite.id}/branding/${Date.now()}_${cleanName}`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            updateBranding('logo', downloadURL);
            setStatus({ type: 'success', msg: 'Logo uploaded successfully!' });
        } catch (error) {
            console.error('Logo upload error:', error);
            setStatus({ type: 'error', msg: 'Failed to upload logo. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !settings) return;

        setUploading(true);
        try {
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `${currentSite.id}/branding/${Date.now()}_${cleanName}`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            updateBranding('favicon', downloadURL);
            setStatus({ type: 'success', msg: 'Favicon uploaded successfully!' });
        } catch (error) {
            console.error('Favicon upload error:', error);
            setStatus({ type: 'error', msg: 'Failed to upload favicon. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    const handleAiLogoUpload = async (file: File) => {
        if (!settings || !currentSite) return;
        setIsAiLogoUploading(true);
        try {
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageRef = ref(storage, `${currentSite.id}/ai-chat/logo/${Date.now()}_${cleanName}`);
            const snapshot = await uploadBytes(storageRef, optimizedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            setSettings({
                ...settings,
                retellAi: { ...settings.retellAi!, logoUrl: downloadURL }
            });
            setStatus({ type: 'success', msg: 'AI Logo uploaded successfully!' });
        } catch (error) {
            console.error('AI Logo upload error:', error);
            setStatus({ type: 'error', msg: 'Failed to upload AI logo. Please try again.' });
        } finally {
            setIsAiLogoUploading(false);
        }
    };

    const handleAiLogoSelect = (url: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            retellAi: { ...settings.retellAi!, logoUrl: url }
        });
        setStatus({ type: 'success', msg: 'AI Logo selected from library!' });
        setIsMediaPickerOpen(false);
        setMediaPickerTarget(null);
    };

    const handleMediaPickerSelect = (url: string) => {
        if (!settings) return;
        if (mediaPickerTarget === 'logo') {
            updateBranding('logo', url);
            setStatus({ type: 'success', msg: 'Logo selected from media library!' });
        } else if (mediaPickerTarget === 'favicon') {
            updateBranding('favicon', url);
            setStatus({ type: 'success', msg: 'Favicon selected from media library!' });
        } else if (mediaPickerTarget === 'aiLogo') {
            handleAiLogoSelect(url);
            return;
        }
        setIsMediaPickerOpen(false);
        setMediaPickerTarget(null);
    };

    const updateTheme = (key: keyof SiteTheme, value: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            theme: { ...settings.theme, [key]: value }
        });
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!currentSite || !settings) return;
        
        try {
            setUploading(true);
            setIsCropperOpen(false);
            
            const fileName = `logo_${Date.now()}.png`;
            const file = new File([croppedBlob], fileName, { type: croppedBlob.type });
            const optimizedFile = await optimizeImage(file);
            const cleanName = optimizedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const logoRef = ref(storage, `sites/${currentSite.id}/branding/${cleanName}`);
            
            await uploadBytes(logoRef, optimizedFile);
            const downloadURL = await getDownloadURL(logoRef);
            
            updateBranding('logo', downloadURL);
            setStatus({ type: 'success', msg: 'Logo cropped and uploaded successfully!' });
        } catch (error) {
            console.error('Error uploading cropped logo:', error);
            setStatus({ type: 'error', msg: 'Failed to upload cropped logo.' });
        } finally {
            setUploading(false);
        }
    };

    const updateBranding = (key: keyof import("@/types/siteSettings").SiteBranding, value: string) => {
        if (!settings) return;
        setSettings({
            ...settings!,
            branding: { ...settings!.branding, [key]: value }
        });
    };

    const addNavItem = () => {
        if (!settings) return;
        const newItem: NavigationItem = {
            id: `nav-${Date.now()}`,
            name: 'New Item',
            path: '/',
            order: settings.navigation.length + 1
        };
        setSettings({
            ...settings!,
            navigation: [...settings!.navigation, newItem]
        });
    };

    const updateNavItem = (id: string, updates: Partial<NavigationItem>) => {
        if (!settings) return;
        setSettings({
            ...settings!,
            navigation: settings!.navigation.map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        });
    };

    const deleteNavItem = async (id: string) => {
        if (!settings) return;
        const isConfirmed = await confirm({
            title: "Delete Navigation Item",
            message: "Are you sure you want to delete this menu item and all its sub-items?",
            variant: "danger",
            confirmLabel: "Delete"
        });
        
        if (!isConfirmed) return;

        setSettings({
            ...settings,
            navigation: settings.navigation.filter(item => item.id !== id)
        });
    };

    const addSubItem = (parentId: string) => {
        if (!settings) return;
        const newSubItem: NavigationItem = {
            id: `nav-${Date.now()}`,
            name: 'New Sub Item',
            path: '/',
            order: 1
        };

        setSettings({
            ...settings!,
            navigation: settings!.navigation.map(item => {
                if (item.id === parentId) {
                    return {
                        ...item,
                        subItems: [...(item.subItems || []), newSubItem]
                    };
                }
                return item;
            })
        });
    };

    const updateSubItem = (parentId: string, subId: string, updates: Partial<NavigationItem>) => {
        if (!settings) return;
        setSettings({
            ...settings,
            navigation: settings.navigation.map(item => {
                if (item.id === parentId && item.subItems) {
                    return {
                        ...item,
                        subItems: item.subItems.map(sub =>
                            sub.id === subId ? { ...sub, ...updates } : sub
                        )
                    };
                }
                return item;
            })
        });
    };

    const deleteSubItem = async (parentId: string, subId: string) => {
        if (!settings) return;
        const isConfirmed = await confirm({
            title: "Delete Sub-item",
            message: "Are you sure you want to delete this sub-item?",
            variant: "danger",
            confirmLabel: "Delete"
        });
        
        if (!isConfirmed) return;

        setSettings({
            ...settings,
            navigation: settings.navigation.map(item => {
                if (item.id === parentId && item.subItems) {
                    return {
                        ...item,
                        subItems: item.subItems.filter(sub => sub.id !== subId)
                    };
                }
                return item;
            })
        });
    };


    const moveNavItem = (index: number, direction: 'up' | 'down') => {
        if (!settings) return;
        const newNavigation = [...settings.navigation];
        if (direction === 'up' && index > 0) {
            [newNavigation[index], newNavigation[index - 1]] = [newNavigation[index - 1], newNavigation[index]];
        } else if (direction === 'down' && index < newNavigation.length - 1) {
            [newNavigation[index], newNavigation[index + 1]] = [newNavigation[index + 1], newNavigation[index]];
        }

        // Update order property
        const updatedNavigation = newNavigation.map((item, idx) => ({ ...item, order: idx + 1 }));

        setSettings({
            ...settings,
            navigation: updatedNavigation
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading settings...</div>
            </div>
        );
    }

    if (!settings) return null;

    const tabs: { id: TabType; label: string }[] = [
        { id: 'general', label: 'General & Support' },
        { id: 'seo', label: 'SEO & Metadata' },
        { id: 'ai', label: '✨ AI Configuration' },
        { id: 'integrations', label: '⚡ Webhooks & Integrations' },
        { id: 'navigation', label: 'Navigation' },
        { id: 'theme', label: 'Branding & Theme' },
        { id: 'payments', label: 'Payments' },
        { id: 'retell', label: 'Voice AI Widget' },
        { id: 'scripts', label: 'Global Scripts' },
    ];

    return (
        <>
            <datalist id="route-options">
                {availableRoutes.map((route) => (
                    <option key={route.path} value={route.path}>{route.label}</option>
                ))}
            </datalist>

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Site Settings - {currentSite.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Configure navigation, branding, and theme for {currentSite.name}
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                {status && (
                    <Alert
                        variant={status.type}
                        title={status.type === 'success' ? 'Success' : 'Error'}
                        message={status.msg}
                    />
                )}

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             {/* Emergency Bar Configuration */}
                            {settings.emergencyBar && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-lime-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Emergency / Alert Bar</h2>
                                        <label className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={settings.emergencyBar.enabled}
                                                    onChange={async (e) => {
                                                        if (!settings) return;
                                                        const isChecked = e.target.checked;
                                                        
                                                        if (isChecked) {
                                                            const isConfirmed = await confirm({
                                                                title: "Enable Emergency Bar",
                                                                message: "Are you sure you want to show the emergency alert bar on the live site?",
                                                                variant: "warning",
                                                                confirmLabel: "Enable"
                                                            });
                                                            if (!isConfirmed) return;
                                                        }

                                                        setSettings({
                                                            ...settings,
                                                            emergencyBar: { ...settings.emergencyBar!, enabled: isChecked }
                                                        });
                                                    }}
                                                />
                                                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.emergencyBar.enabled ? 'bg-lime-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.emergencyBar.enabled ? 'transform translate-x-4' : ''}`}></div>
                                            </div>
                                            <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                                                {settings.emergencyBar.enabled ? 'Enabled' : 'Disabled'}
                                            </div>
                                        </label>
                                    </div>

                                    <div className={`space-y-4 ${!settings.emergencyBar.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Content
                                            </label>
                                            <div className="bg-white text-black rounded-lg">
                                                <RichTextEditor
                                                    theme="snow"
                                                    className="h-64 mb-12"
                                                    value={settings.emergencyBar.content}
                                                    onChange={(value) => {
                                                        if (!settings) return;
                                                        setSettings({
                                                            ...settings,
                                                            emergencyBar: { ...settings.emergencyBar!, content: value }
                                                        });
                                                    }}
                                                    modules={{
                                                        toolbar: [
                                                            ['bold', 'italic', 'underline', 'strike'],
                                                            ['link'],
                                                            [{ 'color': [] }, { 'background': [] }],
                                                            ['clean']
                                                        ],
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Use the toolbar to format text. Links and phone numbers (e.g., <code>tel:988</code>) are supported.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Background Color
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={settings.emergencyBar.bgColor}
                                                    onChange={(e) => {
                                                        if (!settings) return;
                                                        setSettings({
                                                            ...settings,
                                                            emergencyBar: { ...settings.emergencyBar!, bgColor: e.target.value }
                                                        });
                                                    }}
                                                    className="w-16 h-10 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={settings.emergencyBar.bgColor}
                                                    onChange={(e) => {
                                                        if (!settings) return;
                                                        setSettings({
                                                            ...settings,
                                                            emergencyBar: { ...settings.emergencyBar!, bgColor: e.target.value }
                                                        });
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Bar Configuration */}
                            {settings.topBar && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Support & Contact Tips</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Support Ticket Link (URL)
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.supportTicketLink || ''}
                                                onChange={(e) => setSettings({ ...settings, supportTicketLink: e.target.value })}
                                                placeholder="https://support.example.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Support Email
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.supportEmail || ''}
                                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                                placeholder="contact@example.com"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                                Site Status
                                                <span className={`inline-block w-2 h-2 rounded-full ${settings.maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                                <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${settings.maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {settings.maintenanceMode ? 'OFFLINE' : 'LIVE'}
                                                </span>
                                            </label>
                                            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                                                <strong>⚠️ Entire Site:</strong> Switching to Maintenance Mode will replace <em>all pages</em> of the live website with a branded "We'll Be Right Back" splash screen showing the site logo. This affects every visitor. It does <strong>not</strong> affect individual sections — use <strong>Page Visibility</strong> for that.
                                            </div>
                                            <select
                                                value={settings.maintenanceMode ? "true" : "false"}
                                                onChange={async (e) => {
                                                    const isEnabling = e.target.value === "true";
                                                    
                                                    if (isEnabling) {
                                                        const isConfirmed = await confirm({
                                                            title: "Enable Global Maintenance Mode",
                                                            message: "This will take the ENTIRE website offline and replace all pages with a splash screen. Are you absolutely sure?",
                                                            variant: "danger",
                                                            confirmLabel: "Take Site Offline"
                                                        });
                                                        if (!isConfirmed) return;
                                                    } else {
                                                        const isConfirmed = await confirm({
                                                            title: "Disable Maintenance Mode",
                                                            message: "The website will go LIVE for all visitors. Proceed?",
                                                            variant: "primary",
                                                            confirmLabel: "Go Live"
                                                        });
                                                        if (!isConfirmed) return;
                                                    }

                                                    setSettings({ 
                                                        ...settings, 
                                                        maintenanceMode: isEnabling, 
                                                        maintenanceScope: settings.maintenanceScope || 'all' 
                                                    });
                                                }}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-3"
                                            >
                                                <option value="false">🟢 Live — Site is publicly accessible</option>
                                                <option value="true">🔴 Maintenance Mode — Active</option>
                                            </select>

                                            {settings.maintenanceMode && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Maintenance Scope
                                                    </label>
                                                    <select
                                                        value={settings.maintenanceScope || "all"}
                                                        onChange={(e) => setSettings({ ...settings, maintenanceScope: e.target.value as any })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    >
                                                        <option value="all">🌍 All Environments (Live & Local)</option>
                                                        <option value="production">🚀 Production Only (Live site offline, Local site works)</option>
                                                        <option value="development">💻 Development Only (Local site offline, Live site works)</option>
                                                    </select>
                                                    <p className="text-xs text-gray-500">
                                                        Control which environments see the maintenance splash screen.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="space-y-6 animate-in fade-in duration-300 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Global SEO Defaults</h2>
                            
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-blue-800 dark:text-blue-300">
                                    <h3 className="font-bold mb-1">Looking to edit SEO for a specific page?</h3>
                                    <p className="text-sm">The fields below are your <strong>Global Fallbacks</strong>. They only apply if a specific page doesn't have custom metadata assigned to it. To edit SEO for an individual page (like the Homepage or Gala page), use the dedicated SEO Manager.</p>
                                </div>
                                <a href="/settings/seo" className="flex items-center justify-center whitespace-nowrap gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    Open Page SEO Manager <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Site Title
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.siteTitle || ""}
                                        onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                                        placeholder={currentSite.name}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Site Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={settings.siteDescription || ""}
                                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                        placeholder="Enter site description for search engines..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Keywords (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.siteKeywords || ""}
                                        onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
                                        placeholder="keyword1, keyword2, keyword3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'navigation' && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                             {/* Navigation Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Navigation Menu</h2>
                                    <Button onClick={addNavItem} variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Item
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {settings.navigation.map((item, index) => (
                                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveNavItem(index, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-700 dark:text-gray-300"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveNavItem(index, 'down')}
                                                        disabled={index === settings.navigation.length - 1}
                                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-gray-700 dark:text-gray-300"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => updateNavItem(item.id, { name: e.target.value })}
                                                            placeholder="Name"
                                                            className="px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                        />
                                                        <LinkPicker
                                                            value={item.path}
                                                            onChange={(val) => {
                                                                // Automatically set isExternal if it is a custom external link
                                                                const isExternalLink = val !== "" && !val.startsWith('/') && !val.startsWith('#');
                                                                updateNavItem(item.id, { 
                                                                    path: val,
                                                                    isExternal: isExternalLink
                                                                });
                                                            }}
                                                            placeholder="/path"
                                                            siteId={currentSite.id}
                                                        />
                                                        <div className="flex items-center gap-4">
                                                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.isExternal || false}
                                                                    onChange={(e) => updateNavItem(item.id, { isExternal: e.target.checked })}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <ExternalLink className="w-4 h-4" />
                                                                External
                                                            </label>
                                                            <div className="flex items-center ml-auto gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateNavItem(item.id, { isHidden: !item.isHidden })}
                                                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${item.isHidden ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'}`}
                                                                    title={item.isHidden ? "Hidden from Navigation" : "Visible in Navigation"}
                                                                >
                                                                    {item.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                    {item.isHidden ? 'Hidden' : 'Visible'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deleteNavItem(item.id)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                                                                    title="Delete Item"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sub Items */}
                                                    {item.subItems && item.subItems.length > 0 && (
                                                        <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                                            {item.subItems.map((subItem) => (
                                                                <div key={subItem.id} className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={subItem.name}
                                                                        onChange={(e) => updateSubItem(item.id, subItem.id, { name: e.target.value })}
                                                                        placeholder="Sub Item Name"
                                                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <LinkPicker
                                                                            value={subItem.path}
                                                                            onChange={(val) => updateSubItem(item.id, subItem.id, { path: val })}
                                                                            placeholder="/path"
                                                                            siteId={currentSite.id}
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateSubItem(item.id, subItem.id, { isHidden: !subItem.isHidden })}
                                                                        className={`p-1.5 rounded transition-colors ${subItem.isHidden ? 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                                                        title={subItem.isHidden ? "Hidden" : "Visible"}
                                                                    >
                                                                        {subItem.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteSubItem(item.id, subItem.id)}
                                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => addSubItem(item.id)}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Add Sub Item
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'theme' && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Branding</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Site Name
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.branding.siteName}
                                            onChange={(e) => updateBranding('siteName', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Logo URL
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={settings.branding.logo}
                                                onChange={(e) => updateBranding('logo', e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="/logo.png"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setMediaPickerTarget('logo'); setIsMediaPickerOpen(true); }}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                title="Pick from media library"
                                            >
                                                <ImageIcon className="w-4 h-4 mr-1.5" />
                                                Library
                                            </button>
                                            <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <Upload className="w-4 h-4 mr-2" />
                                                {uploading ? 'Uploading...' : 'Upload'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleLogoUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                        {settings.branding.logo && (
                                            <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <img
                                                        src={settings.branding.logo}
                                                        alt="Logo preview"
                                                        style={{ height: `${settings.branding.logoHeight || 64}px` }}
                                                        className="object-contain border rounded p-2 bg-white max-w-[200px]"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                                            Logo Height
                                                            <span className="text-blue-600 dark:text-blue-400 font-bold">{settings.branding.logoHeight || 64}px</span>
                                                        </label>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs text-gray-400">20px</span>
                                                            <input 
                                                                type="range"
                                                                min="20"
                                                                max="800"
                                                                value={settings.branding.logoHeight || 64}
                                                                onChange={(e) => updateBranding('logoHeight', String(parseInt(e.target.value)))}
                                                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                                                            />
                                                            <span className="text-xs text-gray-400">800px</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setIsCropperOpen(true)}>
                                                        <Search className="w-4 h-4 mr-2" />
                                                        Crop Image
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Favicon URL
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={settings.branding.favicon || ''}
                                                onChange={(e) => updateBranding('favicon', e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="/favicon.ico"
                                            />
                                            {settings.branding.logo && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => updateBranding('favicon', settings.branding.logo)}
                                                    className="px-3"
                                                >
                                                    Use Logo
                                                </Button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => { setMediaPickerTarget('favicon'); setIsMediaPickerOpen(true); }}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                title="Pick from media library"
                                            >
                                                <ImageIcon className="w-4 h-4 mr-1.5" />
                                                Library
                                            </button>
                                            <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <Upload className="w-4 h-4 mr-2" />
                                                {uploading ? 'Uploading...' : 'Upload'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFaviconUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                        {settings.branding.favicon && (
                                            <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 max-w-max">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={settings.branding.favicon}
                                                        alt="Favicon preview"
                                                        className="w-8 h-8 object-contain border rounded p-1 bg-white"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Favicon Preview (32x32px)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Theme Colors</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(settings.theme).map(([key, value]) => (
                                        <div key={key}>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={value}
                                                    onChange={(e) => updateTheme(key as any, e.target.value)}
                                                    className="w-16 h-10 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => updateTheme(key as any, e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="animate-in fade-in duration-300 bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Payment Gateways</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-bold text-blue-600">
                                        Currency
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.paymentGateways?.currency || 'CAD'}
                                        onChange={(e) => {
                                            if (!settings) return;
                                            setSettings({
                                                ...settings,
                                                paymentGateways: { ...settings.paymentGateways!, currency: e.target.value }
                                            });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="CAD"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Stripe Public Key
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.paymentGateways?.stripePublicKey || ''}
                                        onChange={(e) => {
                                            if (!settings) return;
                                            setSettings({
                                                ...settings,
                                                paymentGateways: { ...settings.paymentGateways!, stripePublicKey: e.target.value }
                                            });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="pk_test_..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Square App ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.paymentGateways?.squareAppId || ''}
                                        onChange={(e) => {
                                            if (!settings) return;
                                            setSettings({
                                                ...settings,
                                                paymentGateways: { ...settings.paymentGateways!, squareAppId: e.target.value }
                                            });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="sq0idp-..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Square Location ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.paymentGateways?.squareLocationId || ''}
                                        onChange={(e) => {
                                            if (!settings) return;
                                            setSettings({
                                                ...settings,
                                                paymentGateways: { ...settings.paymentGateways!, squareLocationId: e.target.value }
                                            });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="L..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'retell' && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-rose-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Retell AI Integration</h2>
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={settings.retellAi?.enabled || false}
                                                onChange={(e) => {
                                                    setSettings({
                                                        ...settings,
                                                        retellAi: { 
                                                            ...(settings.retellAi || { publicKey: '', agentId: '', widgetType: 'chat' }), 
                                                            enabled: e.target.checked 
                                                        }
                                                    });
                                                }}
                                            />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${settings.retellAi?.enabled ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.retellAi?.enabled ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>

                                <div className={`space-y-4 ${!settings.retellAi?.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Public Key (data-public-key)
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.retellAi?.publicKey || ""}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    retellAi: { ...settings.retellAi!, publicKey: e.target.value }
                                                })}
                                                placeholder="pk_..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Agent ID (data-agent-id)
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.retellAi?.agentId || ""}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    retellAi: { ...settings.retellAi!, agentId: e.target.value }
                                                })}
                                                placeholder="agent_..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Chat Title
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.retellAi?.title || ""}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    retellAi: { ...settings.retellAi!, title: e.target.value }
                                                })}
                                                placeholder="Digital Maples AI"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Bot Name
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.retellAi?.botName || ""}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    retellAi: { ...settings.retellAi!, botName: e.target.value }
                                                })}
                                                placeholder="Gilfoy"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                AI Bot Avatar/Logo
                                            </label>
                                            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                                {/* Preview */}
                                                <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex-shrink-0 group">
                                                    {settings.retellAi?.logoUrl ? (
                                                        <img src={settings.retellAi.logoUrl} alt="AI Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                            <ImageIcon size={24} />
                                                        </div>
                                                    )}
                                                    {isAiLogoUploading && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-grow flex flex-col gap-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <label className="cursor-pointer">
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                accept="image/*"
                                                                onChange={(e) => e.target.files?.[0] && handleAiLogoUpload(e.target.files[0])}
                                                            />
                                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all">
                                                                <Upload size={16} />
                                                                Upload New
                                                            </div>
                                                        </label>
                                                        <button 
                                                            type="button"
                                                            onClick={() => { setMediaPickerTarget('aiLogo'); setIsMediaPickerOpen(true); }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold transition-all"
                                                        >
                                                            <Search size={16} />
                                                            Select from Library
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Recommended size: 256x256px. Supports PNG, JPG, or SVG.
                                                    </p>
                                                    <input
                                                        type="text"
                                                        value={settings.retellAi?.logoUrl || ""}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            retellAi: { ...settings.retellAi!, logoUrl: e.target.value }
                                                        })}
                                                        placeholder="Or paste external URL here..."
                                                        className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <MediaPickerModal 
                                        isOpen={isMediaPickerOpen && mediaPickerTarget === 'aiLogo'}
                                        onClose={() => { setIsMediaPickerOpen(false); setMediaPickerTarget(null); }}
                                        onSelect={handleMediaPickerSelect}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Widget Type
                                        </label>
                                        <select
                                            value={settings.retellAi?.widgetType || 'chat'}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                retellAi: { ...settings.retellAi!, widgetType: e.target.value as 'chat' | 'callback' }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="chat">Standard AI Chat Bubble</option>
                                            <option value="callback">Callback / Request a Call (data-widget="callback")</option>
                                        </select>
                                    </div>

                                    {settings.retellAi?.widgetType === 'callback' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-300">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Outbound Phone Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.retellAi?.phoneNumber || ""}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        retellAi: { ...settings.retellAi!, phoneNumber: e.target.value }
                                                    })}
                                                    placeholder="+15489000027"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Terms & Conditions URL
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.retellAi?.termsUrl || ""}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        retellAi: { ...settings.retellAi!, termsUrl: e.target.value }
                                                    })}
                                                    placeholder="https://example.com/terms"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="animate-in fade-in duration-300 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-6">
                            <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    ✨ AI Configuration & BYOK Engine
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Configure your organization's own Large Language Model (LLM) API keys and brand voice.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        LLM Provider *
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium"
                                        value={settings.aiSettings?.provider || 'gemini'}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            aiSettings: {
                                                ...settings.aiSettings,
                                                provider: e.target.value as any
                                            }
                                        })}
                                    >
                                        <option value="gemini">Google Gemini (Recommended / Fast)</option>
                                        <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                                        <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Model Identifier (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={
                                            settings.aiSettings?.provider === 'openai' ? 'gpt-4o-mini' :
                                            settings.aiSettings?.provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' :
                                            'gemini-1.5-flash'
                                        }
                                        value={settings.aiSettings?.model || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            aiSettings: {
                                                ...settings.aiSettings,
                                                provider: settings.aiSettings?.provider || 'gemini',
                                                model: e.target.value
                                            }
                                        })}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-900 dark:text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    API Key (Tenant Isolated) *
                                </label>
                                <input
                                    type="password"
                                    placeholder={
                                        settings.aiSettings?.provider === 'openai' ? 'sk-...' :
                                        'Enter API Key...'
                                    }
                                    value={settings.aiSettings?.apiKey || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        aiSettings: {
                                            ...settings.aiSettings,
                                            provider: settings.aiSettings?.provider || 'gemini',
                                            apiKey: e.target.value
                                        }
                                    })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-900 dark:text-white font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">
                                    Stored securely in your site configuration. Used exclusively for your website's content generation and AI tasks.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Brand Voice & Tone
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Empowering, community-focused, trauma-informed, authoritative, warm"
                                    value={settings.aiSettings?.brandTone || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        aiSettings: {
                                            ...settings.aiSettings,
                                            provider: settings.aiSettings?.provider || 'gemini',
                                            brandTone: e.target.value
                                        }
                                    })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Custom System Instructions / Audience Context
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Provide background context about your organization, mission, key audiences, and editorial rules..."
                                    value={settings.aiSettings?.systemPrompt || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        aiSettings: {
                                            ...settings.aiSettings,
                                            provider: settings.aiSettings?.provider || 'gemini',
                                            systemPrompt: e.target.value
                                        }
                                    })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-900 dark:text-white resize-y"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className="animate-in fade-in duration-300 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-6">
                            <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    ⚡ Webhooks & Omni-Channel Automation
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Configure endpoints for n8n, Slack, ClickUp, and your central ticketing desk.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                                    <label className="block text-sm font-bold text-purple-950 dark:text-purple-300 mb-1">
                                        n8n Automation Webhook URL
                                    </label>
                                    <p className="text-xs text-purple-800/80 dark:text-purple-400 mb-2">
                                        When tickets or help chats are submitted, this webhook triggers your multi-channel workflow (Telegram alerts, ClickUp tasks, and ticketing sync).
                                    </p>
                                    <input
                                        type="url"
                                        placeholder="https://n8n.youragency.com/webhook/..."
                                        value={settings.integrations?.n8nWebhookUrl || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            integrations: {
                                                ...settings.integrations,
                                                n8nWebhookUrl: e.target.value
                                            }
                                        })}
                                        className="w-full px-4 py-2.5 border border-purple-200 dark:border-purple-700 rounded-xl text-sm font-mono dark:bg-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                    <label className="block text-sm font-bold text-emerald-950 dark:text-emerald-300 mb-1">
                                        Slack Incoming Webhook URL
                                    </label>
                                    <p className="text-xs text-emerald-800/80 dark:text-emerald-400 mb-2">
                                        Instant rich alerts posted to your agency's support channel.
                                    </p>
                                    <input
                                        type="url"
                                        placeholder="https://hooks.slack.com/services/..."
                                        value={settings.integrations?.slackWebhookUrl || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            integrations: {
                                                ...settings.integrations,
                                                slackWebhookUrl: e.target.value
                                            }
                                        })}
                                        className="w-full px-4 py-2.5 border border-emerald-200 dark:border-emerald-700 rounded-xl text-sm font-mono dark:bg-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Central Ticket System API URL
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://tickets.digitalmaples.ca/api/v1/tickets"
                                            value={settings.integrations?.ticketSystemApiUrl || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                integrations: {
                                                    ...settings.integrations,
                                                    ticketSystemApiUrl: e.target.value
                                                }
                                            })}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Ticket System API Key
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Bearer token or API key"
                                            value={settings.integrations?.ticketSystemApiKey || ''}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                integrations: {
                                                    ...settings.integrations,
                                                    ticketSystemApiKey: e.target.value
                                                }
                                            })}
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono dark:bg-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Support Notification Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="support@digitalmaples.ca"
                                        value={settings.integrations?.supportEmail || ''}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            integrations: {
                                                ...settings.integrations,
                                                supportEmail: e.target.value
                                            }
                                        })}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'scripts' && (
                        <div className="animate-in fade-in duration-300 bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-6">
                            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Custom Script Injection</h2>
                            <p className="text-sm text-gray-500 mb-4">Add tracking codes, chat widgets, or custom analytics here.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Header Scripts (e.g., GTM, Facebook Pixel)
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={settings.headerScripts || ""}
                                        onChange={(e) => setSettings({ ...settings, headerScripts: e.target.value })}
                                        placeholder="<script>...</script>"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-green-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Body Scripts (Appended to end of body)
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={settings.bodyScripts || ""}
                                        onChange={(e) => setSettings({ ...settings, bodyScripts: e.target.value })}
                                        placeholder="<script>...</script>"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-green-400"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isCropperOpen && settings?.branding?.logo && (
                <ImageCropperModal
                    isOpen={isCropperOpen}
                    image={settings.branding.logo}
                    onClose={() => setIsCropperOpen(false)}
                    onCropComplete={handleCropComplete}
                    aspect={null} // Default to 'Free Form' in our new enhanced modal
                />
            )}
            {/* Global Media Library Picker — for Logo and Favicon fields */}
            {isMediaPickerOpen && mediaPickerTarget !== 'aiLogo' && (
                <MediaPickerModal
                    isOpen={isMediaPickerOpen}
                    onClose={() => { setIsMediaPickerOpen(false); setMediaPickerTarget(null); }}
                    onSelect={handleMediaPickerSelect}
                />
            )}
        </>
    );
}
