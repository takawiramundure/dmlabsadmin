"use client";

import React, { useState, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import Button from '../ui/button/Button';
import { X, ZoomIn, ZoomOut, RotateCw, Layout, Maximize, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface ImageCropperModalProps {
    isOpen: boolean;
    onClose: () => void;
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    aspect?: number | null;
}

export default function ImageCropperModal({ 
    isOpen, 
    onClose, 
    image, 
    onCropComplete,
    aspect: initialAspect = null // Default to Free Form
}: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [aspect, setAspect] = useState<number | undefined>(initialAspect === null ? undefined : initialAspect);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [corsError, setCorsError] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    // Fetch image as blob to handle CORS robustly
    React.useEffect(() => {
        if (!isOpen || !image) return;

        let active = true;
        const fetchImage = async () => {
            setError(null);
            setCorsError(false);
            try {
                // Determine bucket name from env or project context
                const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-bucket-name";
                
                const response = await fetch(image, { mode: 'cors' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();
                if (active) {
                    const url = URL.createObjectURL(blob);
                    setBlobUrl(url);
                }
            } catch (err: any) {
                console.error("CORS fetch failed:", err);
                if (active) {
                    setCorsError(true);
                    setError("Cross-Origin security block detected. Your browser is preventing the application from reading this image's pixels.");
                }
            }
        };

        fetchImage();
        return () => {
            active = false;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [isOpen, image]);

    const imageToCrop = blobUrl || image;

    const onCropChange = (crop: any) => {
        setCrop(crop);
    };

    const onZoomChange = (zoomValue: number) => {
        setZoom(zoomValue);
    };

    const onCropCompleteCallback = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => {
                console.error("Image load error for cropping:", error);
                reject(new Error("Failed to load image for cropping into canvas."));
            });
            // Object URLs don't need crossOrigin
            if (!url.startsWith('blob:')) {
                image.setAttribute('crossOrigin', 'anonymous');
            }
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: any,
        rotation = 0
    ): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Set canvas smoothing to high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const rotRad = (rotation * Math.PI) / 180;
        const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
            image.width,
            image.height,
            rotation
        );

        // Stage 1: Create a temporary canvas to handle the full rotated image at original resolution
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return null;

        tempCanvas.width = bBoxWidth;
        tempCanvas.height = bBoxHeight;

        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';

        tempCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
        tempCtx.rotate(rotRad);
        tempCtx.translate(-image.width / 2, -image.height / 2);
        tempCtx.drawImage(image, 0, 0);

        // Stage 2: Copy only the cropped area from the rotated full-res canvas to the final canvas
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            tempCanvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((file) => {
                if (file) resolve(file);
                else reject(new Error("Canvas toBlob failed"));
            }, 'image/png'); // Lossless PNG to preserve logo quality
        });
    };

    const rotateSize = (width: number, height: number, rotation: number) => {
        const rotRad = (rotation * Math.PI) / 180;

        return {
            width:
                Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
            height:
                Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
        };
    };

    const handleConfirm = async () => {
        if (corsError) {
            setError("Cannot save while CORS error is active. Please follow the troubleshooting steps below.");
            return;
        }
        setError(null);
        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
            if (croppedImage) {
                onCropComplete(croppedImage);
            } else {
                throw new Error("Failed to generate cropped image.");
            }
        } catch (e: any) {
            console.error("Crop error:", e);
            setError(e.message || "An unexpected error occurred during cropping.");
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setCrop({ x: 0, y: 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[92vh]">
                <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Crop & Optimize Logo</h3>
                        {error && (
                            <span className="flex items-center gap-1 text-red-500 text-[10px] font-medium animate-pulse">
                                <AlertCircle size={12} /> Failed to save
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative flex-1 bg-gray-950 overflow-hidden group">
                    <Cropper
                        image={imageToCrop}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={onZoomChange}
                        maxZoom={5}
                    />
                    <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5" />
                    
                    {/* Visual Overlay for Workspace */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <button 
                            onClick={handleReset}
                            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-all flex items-center gap-2 text-[10px] font-bold"
                        >
                            <Maximize size={14} /> RESET VIEW
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 border-t dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4 sm:space-y-6">
                    {(error || corsError) && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-600 dark:text-red-400 text-sm space-y-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
                                <div className="space-y-1">
                                    <p className="font-bold">Security Block Detected</p>
                                    <p className="leading-relaxed">{error}</p>
                                </div>
                            </div>

                            {corsError && (
                                <div className="mt-4 p-4 bg-white dark:bg-gray-900/40 rounded-md border border-red-200 dark:border-red-800 text-[13px] space-y-3">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">How to fix this (System Administrator):</p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Your database storage (Firebase) needs to be configured to allow cropping. Open your terminal in the проект root and run:
                                    </p>
                                    <div className="group relative">
                                        <code className="block p-3 bg-gray-100 dark:bg-black rounded border font-mono text-[11px] text-blue-700 dark:text-blue-400 break-all select-all">
                                            gsutil cors set cors.json gs://{process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-bucket-name"}
                                        </code>
                                        <p className="mt-2 text-[10px] text-gray-400 italic">
                                            Note: This requires the Google Cloud SDK (gsutil) to be installed and authenticated.
                                        </p>
                                    </div>
                                    <div className="pt-1 flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 text-[11px]" 
                                            onClick={() => window.open('https://firebase.google.com/docs/storage/web/download-files#cors', '_blank')}
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            View Official Docs
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <ZoomIn size={14} /> Zoom <span className="text-blue-600 ml-1">{Math.round(zoom * 100)}%</span>
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={5}
                                    step={0.1}
                                    onChange={(e) => onZoomChange(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <RotateCw size={14} /> Rotation <span className="text-blue-600 ml-1">{rotation}°</span>
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    value={rotation}
                                    min={0}
                                    max={360}
                                    step={1}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Layout size={14} /> Preset Aspect Ratio
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setAspect(undefined)}
                                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${!aspect ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-500'}`}
                                >
                                    Free Form
                                </button>
                                <button
                                    onClick={() => setAspect(1)}
                                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${aspect === 1 ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-500'}`}
                                >
                                    1:1
                                </button>
                                <button
                                    onClick={() => setAspect(16 / 9)}
                                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${aspect === 16 / 9 ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-500'}`}
                                >
                                    16:9
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">
                                Recommended for best results on your website headers.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button 
                            variant="outline" 
                            onClick={onClose}
                            disabled={isProcessing}
                            className="text-xs h-10"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className="min-w-[160px] text-xs h-10"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                'Apply Crop & Save'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
