"use client";

import React, { useState } from 'react';
import { Video, X, Upload } from 'lucide-react';
import MediaLibrary from '../common/MediaLibrary';
import Button from '../ui/button/Button';
import Label from './Label';
import InputField from './input/InputField';
import { useSite } from "@/context/SiteContext";

interface VideoPickerProps {
    label?: string;
    value: string;
    onChange: (url: string) => void;
    placeholder?: string;
    helpText?: string;
    className?: string;
}

export default function VideoPicker({
    label,
    value,
    onChange,
    placeholder = "https://...",
    helpText,
    className = ""
}: VideoPickerProps) {
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const { currentSite } = useSite();

    const isYoutube = (url: string) => url && (url.includes('youtube.com') || url.includes('youtu.be'));

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <Label>{label}</Label>}

            <div className="space-y-3">
                {/* Preview Area */}
                {value && (
                    <div className="relative group w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        {isYoutube(value) ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400">
                                <Video size={48} className="mb-2" />
                                <span className="text-sm">YouTube Video Linked</span>
                            </div>
                        ) : (
                            <video
                                src={value}
                                className="w-full h-full object-cover"
                                controls
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            title="Remove Video"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <InputField
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsLibraryOpen(true)}
                        className="whitespace-nowrap"
                    >
                        <Upload size={16} className="mr-2" />
                        Media Library
                    </Button>
                </div>

                {helpText && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line">
                        {helpText}
                    </p>
                )}
            </div>

            <MediaLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onSelect={(url) => {
                    onChange(url);
                    setIsLibraryOpen(false);
                }}
                basePath={`${currentSite.id}/videos`}
            />
        </div>
    );
}
