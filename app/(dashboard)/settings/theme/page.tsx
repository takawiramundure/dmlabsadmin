"use client";

import React, { useState, useEffect } from 'react';
import { FirestoreService, ThemeSettings } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Save, RefreshCcw, Type } from 'lucide-react';

const DEFAULT_THEME: ThemeSettings = {
    typography: {
        displayFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
        h1Font: "",
        h2Font: "",
        h3Font: "",
        h4Font: "",
        h5Font: "",
        h6Font: "",
        highlightFont: "",
        h1Align: undefined,
        h2Align: undefined,
        h3Align: undefined,
        h4Align: undefined,
        h5Align: undefined,
        h6Align: undefined,
        highlightAlign: undefined,
        h1Size: "4.5rem",
        h2Size: "3.5rem",
        h3Size: "2.5rem",
        h4Size: "1.75rem",
        h5Size: "1.25rem",
        h6Size: "1.125rem",
        bodySize: "1.125rem",
        highlightSize: "1.5rem",
        alignment: 'left',
        headingAlignment: 'center'
    }
};

const COMMON_FONTS = [
    "Plus Jakarta Sans", "Inter", "Outfit", "Playfair Display", "Montserrat", 
    "Roboto", "Open Sans", "Lato", "Poppins", "Raleway", "Lora", "Libre Baskerville"
];

export default function ThemeManager() {
    const { currentSite } = useSite();
    const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" } as { type: 'success' | 'error' | '', text: string });

    useEffect(() => {
        loadSettings();
    }, [currentSite]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getThemeSettings(currentSite.id);
            if (data) {
                setSettings(data);
            } else {
                setSettings(DEFAULT_THEME);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await FirestoreService.saveThemeSettings(settings, currentSite.id);
            setMessage({ type: 'success', text: "Theme settings saved successfully! Changes will reflect on the live site." });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (e) {
            setMessage({ type: 'error', text: "Failed to save theme settings." });
        } finally {
            setSaving(false);
        }
    };

    const updateTypography = (key: keyof ThemeSettings['typography'], value: string) => {
        setSettings({
            ...settings,
            typography: {
                ...settings.typography,
                [key]: value
            }
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading theme configurations...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Global Theme Manager</h1>
                    <p className="text-gray-500">Manage typography, sizes, and global alignment for the entire website.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={loadSettings} disabled={saving}>
                        <RefreshCcw size={18} className="mr-2" />
                        Reload
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save size={18} className="mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {message.text && (
                <div className="mb-6">
                    <Alert 
                        variant={message.type as any} 
                        title={message.type === 'success' ? 'Success' : 'Error'} 
                        message={message.text} 
                    />
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-gray-800">
                            <Type size={20} className="text-primary" />
                            Typography Selection
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Display Font (Headings)</Label>
                                    <select 
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={settings.typography.displayFont}
                                        onChange={(e) => updateTypography('displayFont', e.target.value)}
                                    >
                                        {COMMON_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Body Font (Text)</Label>
                                    <select 
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={settings.typography.bodyFont}
                                        onChange={(e) => updateTypography('bodyFont', e.target.value)}
                                    >
                                        {COMMON_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Global Text Alignment (Body)</Label>
                                <select 
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={settings.typography.alignment}
                                    onChange={(e) => updateTypography('alignment', e.target.value as any)}
                                >
                                    <option value="left">Left Aligned (Standard)</option>
                                    <option value="center">Center Aligned</option>
                                    <option value="right">Right Aligned</option>
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Headings Alignment</Label>
                                <select 
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={settings.typography.headingAlignment}
                                    onChange={(e) => updateTypography('headingAlignment', e.target.value as any)}
                                >
                                    <option value="left">Left Aligned</option>
                                    <option value="center">Center Aligned (Standard for Titles)</option>
                                    <option value="right">Right Aligned</option>
                                </select>
                            </div>

                            {/* Individual Fonts (Granular) */}
                            <div className="pt-6 border-t border-gray-100 mt-6">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">Granular Font Overrides</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map(lvl => (
                                        <div key={lvl} className="grid grid-cols-2 gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400">{lvl} Font</Label>
                                                <select 
                                                    className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                                                    value={(settings.typography as any)[`${lvl}Font`] || ""}
                                                    onChange={(e) => updateTypography(`${lvl}Font` as any, e.target.value)}
                                                >
                                                    <option value="">Global</option>
                                                    {COMMON_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-gray-400">{lvl} Align</Label>
                                                <select 
                                                    className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none"
                                                    value={(settings.typography as any)[`${lvl}Align`] || ""}
                                                    onChange={(e) => updateTypography(`${lvl}Align` as any, e.target.value)}
                                                >
                                                    <option value="">Global</option>
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-2 gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10 lg:col-span-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-primary/60">Highlight Font</Label>
                                            <select 
                                                className="w-full px-2 py-1 bg-white border border-primary/20 rounded-lg text-xs outline-none"
                                                value={settings.typography.highlightFont || ""}
                                                onChange={(e) => updateTypography('highlightFont', e.target.value)}
                                            >
                                                <option value="">Global</option>
                                                {COMMON_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-primary/60">Highlight Align</Label>
                                            <select 
                                                className="w-full px-2 py-1 bg-white border border-primary/20 rounded-lg text-xs outline-none"
                                                value={settings.typography.highlightAlign || ""}
                                                onChange={(e) => updateTypography('highlightAlign', e.target.value as any)}
                                            >
                                                <option value="">Global</option>
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-[11px] text-gray-400 italic">
                                    Leave as "Global" to use the primary fonts defined above.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-6 text-gray-800">Heading & Text Sizes</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label>H1 Size</Label>
                                <InputField value={settings.typography.h1Size} onChange={(e) => updateTypography('h1Size', e.target.value)} placeholder="4.5rem" />
                            </div>
                            <div className="space-y-1">
                                <Label>H2 Size</Label>
                                <InputField value={settings.typography.h2Size} onChange={(e) => updateTypography('h2Size', e.target.value)} placeholder="3.5rem" />
                            </div>
                            <div className="space-y-1">
                                <Label>H3 Size</Label>
                                <InputField value={settings.typography.h3Size} onChange={(e) => updateTypography('h3Size', e.target.value)} placeholder="2.5rem" />
                            </div>
                            <div className="space-y-1">
                                <Label>Body Size</Label>
                                <InputField value={settings.typography.bodySize} onChange={(e) => updateTypography('bodySize', e.target.value)} placeholder="1.125rem" />
                            </div>
                            <div className="space-y-1">
                                <Label>Highlight</Label>
                                <InputField value={settings.typography.highlightSize} onChange={(e) => updateTypography('highlightSize', e.target.value)} placeholder="1.5rem" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100 p-8 rounded-3xl border border-gray-200 sticky top-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Typography Preview</h2>
                        <div className="px-2 py-1 bg-white rounded text-[10px] font-bold text-gray-400 shadow-sm uppercase">Renderer</div>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <span className="text-[10px] text-primary/60 font-mono block mb-1 uppercase tracking-tighter">Headline H1 / {settings.typography.h1Size}</span>
                            <h1 style={{ 
                                textAlign: (settings.typography.h1Align || settings.typography.headingAlignment) as any,
                                fontFamily: settings.typography.h1Font || settings.typography.displayFont, 
                                fontSize: settings.typography.h1Size, 
                                fontWeight: 800, 
                                lineHeight: 1.1, 
                                color: '#111' 
                            }}>
                                The Future of Mindful Wellness
                            </h1>
                        </div>
                        
                        <div>
                            <span className="text-[10px] text-primary/60 font-mono block mb-1 uppercase tracking-tighter">Subheading H2 / {settings.typography.h2Size}</span>
                            <h2 style={{ 
                                textAlign: (settings.typography.h2Align || settings.typography.headingAlignment) as any,
                                fontFamily: settings.typography.h2Font || settings.typography.displayFont, 
                                fontSize: settings.typography.h2Size, 
                                fontWeight: 700, 
                                lineHeight: 1.2, 
                                color: '#333' 
                            }}>
                                Empowering Black Excellence through cultural safety.
                            </h2>
                        </div>

                        <div style={{ textAlign: settings.typography.alignment }}>
                            <span className="text-[10px] text-primary/60 font-mono block mb-1 uppercase tracking-tighter">Body Text / {settings.typography.bodySize}</span>
                            <p style={{ 
                                fontFamily: settings.typography.bodyFont, 
                                fontSize: settings.typography.bodySize, 
                                lineHeight: 1.7, 
                                color: '#555' 
                            }}>
                                This is a sample paragraph demonstrate how your content will appear across all pages. Choosing the right font balance ensures that your mission is communicated clearly and professionally.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-200">
                             <span className="text-[10px] text-primary/60 font-mono block mb-2 uppercase tracking-tighter">Highlight Text / {settings.typography.highlightSize}</span>
                             <p style={{ 
                                 textAlign: (settings.typography.highlightAlign || settings.typography.alignment) as any,
                                 fontFamily: settings.typography.highlightFont || settings.typography.bodyFont, 
                                 fontSize: settings.typography.highlightSize, 
                                 fontWeight: 600, 
                                 color: 'var(--color-primary, #0D9488)', 
                                 fontStyle: 'italic' 
                             }}>
                                 "Our story is rooted in community, care, and resilience."
                             </p>
                        </div>
                    </div>

                    <div className="mt-12 text-[10px] text-gray-400 italic text-center">
                        Note: Live preview uses local CSS color variables.
                    </div>
                </div>
            </div>
        </div>
    );
}
