"use client";

import React, { useState } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import MediaLibrary from '../common/MediaLibrary';
import Button from '../ui/button/Button';
import Label from './Label';
import Input from './input/InputField';

interface ImagePickerProps {
    label?: string;
    value: string;
    onChange: (url: string) => void;
    placeholder?: string;
    helpText?: string;
    className?: string;
}

export default function ImagePicker({
    label,
    value,
    onChange,
    placeholder = "https://...",
    helpText,
    className = ""
}: ImagePickerProps) {
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    return (
        <div className={`space-y-2 ${className}`}>
            {label && <Label>{label}</Label>}

            <div className="space-y-3">
                {/* Preview Area */}
                {value && (
                    <div className="relative group w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove Image"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Input
                            value={value}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
            />
        </div>
    );
}
