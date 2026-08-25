"use client";

import React, { useEffect, useState } from 'react';
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import ImagePicker from "@/components/form/ImagePicker";
import MediaLibrary from "@/components/common/MediaLibrary";
import { Images, Plus, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { useDialog } from "@/context/DialogContext";
import FolderPicker from "@/components/form/FolderPicker";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

interface GalleryImage {
    id: string;
    url: string;
    caption: string;
    category: string;
    order: number;
}

function generateId() {
    return `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white';

export default function GalleryManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [addingImage, setAddingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [useFolderMapping, setUseFolderMapping] = useState(false);
    const [folderPaths, setFolderPaths] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [currentSite?.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const doc = await FirestoreService.getPageContent('gallery', currentSite.id);
            if (doc) {
                setUseFolderMapping(!!doc.useFolderMapping);
                if (doc.folderPaths) {
                    const normalized = doc.folderPaths.map((p: any) => {
                        if (typeof p === 'string') {
                            return { path: p, name: p };
                        }
                        return { path: p.path || '', name: p.name || '' };
                    });
                    setFolderPaths(normalized);
                } else if (doc.folderPath) {
                    setFolderPaths([{ path: doc.folderPath, name: doc.folderPath }]);
                } else {
                    setFolderPaths([]);
                }
                if (doc.images) {
                    const sorted = [...doc.images].sort((a: GalleryImage, b: GalleryImage) => (a.order ?? 0) - (b.order ?? 0));
                    setImages(sorted);

                    const cats = Array.from(new Set(sorted.map((img: GalleryImage) => img.category).filter(Boolean))) as string[];
                    setCategories(cats);
                } else {
                    setImages([]);
                }
            }
        } catch (e) {
            console.error('Error loading gallery:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            const ordered = images.map((img, i) => ({ ...img, order: i }));
            await FirestoreService.savePageContent('gallery', {
                images: ordered,
                useFolderMapping,
                folderPaths,
                folderPath: folderPaths[0]?.path || ''
            }, currentSite.id);
            setStatus({ type: 'success', msg: `Gallery saved successfully!` });
        } catch (e) {
            console.error('Error saving gallery:', e);
            setStatus({ type: 'error', msg: 'Failed to save gallery. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const addMultipleImages = (urls: string[]) => {
        const cleanUrls = urls.map(u => u.trim()).filter(Boolean);
        if (cleanUrls.length === 0) return;
        
        const newImgs: GalleryImage[] = cleanUrls.map((url, i) => ({
            id: generateId(),
            url,
            caption: '',
            category: '',
            order: images.length + i,
        }));
        
        setImages(prev => [...prev, ...newImgs]);
        setNewImageUrl('');
        setAddingImage(false);
    };

    const updateImage = (id: string, field: keyof GalleryImage, value: any) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, [field]: value } : img));
    };

    const removeImage = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Remove Image",
            message: "Remove this image from the gallery? You will need to save the gallery to apply the changes.",
            variant: "danger",
            confirmLabel: "Remove"
        });

        if (!isConfirmed) return;
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const moveImage = (id: string, direction: 'up' | 'down') => {
        const idx = images.findIndex(img => img.id === id);
        if (idx < 0) return;
        const newImages = [...images];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newImages.length) return;
        [newImages[idx], newImages[swapIdx]] = [newImages[swapIdx], newImages[idx]];
        setImages(newImages);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-gray-500">Loading gallery...</div>;
    }

    return (
        <>
            <PageMeta title="Gallery Manager | Admin" description="Manage the community photo gallery" />
            <PageBreadcrumb pageTitle="Gallery Manager" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Images className="w-6 h-6 text-purple-500" />
                            Community Gallery
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Add and manage images for the Gallery page at <strong>/impact/gallery</strong>. Images appear as an animated mosaic automatically.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href="http://localhost:5174/impact/gallery"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Preview Gallery
                        </a>
                        <VersionHistoryManager documentId="gallery" siteId={currentSite.id} />
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Gallery'}
                        </Button>
                    </div>
                </div>

                {status && (
                    <Alert
                        variant={status.type}
                        title={status.type === 'success' ? 'Saved!' : 'Error'}
                        message={status.msg}
                    />
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Images', value: images.length },
                        { label: 'Categories', value: categories.length || 0 },
                        { label: 'Uncategorized', value: images.filter(i => !i.category).length },
                        { label: 'With Captions', value: images.filter(i => i.caption).length },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow text-center">
                            <div className="text-2xl font-black text-gray-800 dark:text-white">{stat.value}</div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Gallery Mode Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <h2 className="text-base font-semibold text-gray-700 dark:text-white mb-2">Gallery Image Source</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Choose whether to select gallery images manually or link directly to a Media Library folder.
                    </p>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-medium">
                            <input
                                type="radio"
                                checked={!useFolderMapping}
                                onChange={() => setUseFolderMapping(false)}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            Manual Image Selection
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-medium">
                            <input
                                type="radio"
                                checked={useFolderMapping}
                                onChange={() => setUseFolderMapping(true)}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            Link Folder from Media Library
                        </label>
                    </div>

                    {useFolderMapping && (
                        <div className="mt-4 p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-xl space-y-4 max-w-2xl">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                                    Linked Media Library Folders
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setFolderPaths(prev => [...prev, { path: '', name: '' }])}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Folder
                                </button>
                            </div>
                            
                            {folderPaths.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No folders linked yet. Click "Add Folder" to link a folder.</p>
                            ) : (
                                <div className="space-y-3">
                                    {folderPaths.map((pathObj, idx) => (
                                        <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-end gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex-1">
                                                <FolderPicker
                                                    label="Select Library Folder"
                                                    value={pathObj.path || ''}
                                                    onChange={(newPath) => {
                                                        const updated = [...folderPaths];
                                                        updated[idx] = { ...updated[idx], path: newPath };
                                                        setFolderPaths(updated);
                                                    }}
                                                />
                                            </div>
                                            <div className="w-full md:w-1/3">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                                    Category Caption / Display Name
                                                </label>
                                                <input
                                                    className={inputClass}
                                                    value={pathObj.name || ''}
                                                    onChange={(e) => {
                                                        const updated = [...folderPaths];
                                                        updated[idx] = { ...updated[idx], name: e.target.value };
                                                        setFolderPaths(updated);
                                                    }}
                                                    placeholder="e.g. Black Excellence Gala 2026"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFolderPaths(prev => prev.filter((_, i) => i !== idx));
                                                }}
                                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer self-end mb-0.5"
                                                title="Remove folder link"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500">
                                All images inside these folders in Firebase Storage (relative to your site's folder, e.g. <code>kmfw/your-folder</code>) will automatically render on the live website's gallery.
                            </p>
                        </div>
                    )}
                </div>

                {/* Add Image Panel */}
                {!useFolderMapping && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-700 dark:text-white">Add New Image</h2>
                            <button
                                onClick={() => setAddingImage(!addingImage)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Image
                            </button>
                        </div>

                        {addingImage && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                                <p className="text-sm text-gray-500">
                                    Select up to 10 images from the Media Library, or paste multiple image URLs (one per line, or comma-separated).
                                </p>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                            Paste Image URL(s)
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={newImageUrl}
                                            onChange={(e) => setNewImageUrl(e.target.value)}
                                            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                            Or Choose from Library
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsLibraryOpen(true)}
                                            className="inline-flex items-center px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Select from Media Library (Up to 10)
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <Button 
                                        onClick={() => addMultipleImages(newImageUrl.split(/[\n,]+/))} 
                                        disabled={!newImageUrl.trim()}
                                    >
                                        Add Paste URL(s) to Gallery
                                    </Button>
                                    <button
                                        onClick={() => { setAddingImage(false); setNewImageUrl(''); }}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Image List */}
                {!useFolderMapping && (
                    images.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                            <Images className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No images yet</h3>
                            <p className="text-sm text-gray-400">
                                Click "Add Image" above to add your first gallery image. Images will appear as an animated mosaic on the website.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-base font-semibold text-gray-700 dark:text-white">
                                    Gallery Images ({images.length})
                                </h2>
                                <p className="text-xs text-gray-400">Drag to reorder · Use ↑↓ buttons to move</p>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {images.map((img, index) => (
                                    <div key={img.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        {/* Order controls */}
                                        <div className="flex flex-col items-center gap-1 mt-1 text-gray-400">
                                            <button
                                                onClick={() => moveImage(img.id, 'up')}
                                                disabled={index === 0}
                                                className="p-1 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title="Move up"
                                            >
                                                ↑
                                            </button>
                                            <GripVertical className="w-4 h-4 opacity-30" />
                                            <button
                                                onClick={() => moveImage(img.id, 'down')}
                                                disabled={index === images.length - 1}
                                                className="p-1 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title="Move down"
                                            >
                                                ↓
                                            </button>
                                        </div>

                                        {/* Thumbnail */}
                                        <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                            {img.url ? (
                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Images className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Fields */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Image URL</label>
                                                <input
                                                    className={inputClass}
                                                    value={img.url}
                                                    onChange={e => updateImage(img.id, 'url', e.target.value)}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Caption</label>
                                                <input
                                                    className={inputClass}
                                                    value={img.caption}
                                                    onChange={e => updateImage(img.id, 'caption', e.target.value)}
                                                    placeholder="Optional caption..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
                                                <input
                                                    className={inputClass}
                                                    value={img.category}
                                                    onChange={e => updateImage(img.id, 'category', e.target.value)}
                                                    placeholder="e.g. Events, Community..."
                                                    list="category-suggestions"
                                                />
                                                <datalist id="category-suggestions">
                                                    {categories.map(cat => <option key={cat} value={cat} />)}
                                                    <option value="Events" />
                                                    <option value="Community" />
                                                    <option value="Programs" />
                                                    <option value="Gala" />
                                                    <option value="Youth" />
                                                    <option value="Volunteers" />
                                                </datalist>
                                            </div>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="flex-shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                                            title="Remove image"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}

                {/* Bottom Save */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button onClick={handleSave} disabled={saving || (!useFolderMapping && images.length === 0)}>
                        {saving ? 'Saving...' : 'Save Gallery Settings'}
                    </Button>
                </div>
            </div>

            <MediaLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                multiSelect={true}
                onSelectMultiple={addMultipleImages}
            />
        </>
    );
}
