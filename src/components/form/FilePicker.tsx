"use client";

import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { Modal } from '../ui/modal';
import { MediaLibraryContent } from '../common/MediaLibrary';

interface FilePickerProps {
    label: string;
    value: string;
    onChange: (url: string) => void;
    placeholder?: string;
    description?: string;
}

export const FilePicker: React.FC<FilePickerProps> = ({
    label,
    value,
    onChange,
    placeholder = "Select or paste file URL",
    description
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="mb-4">
            <label className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">
                {label}
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-2 text-sm text-gray-800 bg-transparent border border-gray-200 rounded-lg dark:border-gray-800 dark:text-white dark:bg-gray-900 focus:border-brand-500 focus:outline-none"
                    />
                    {value && (
                        <button
                            onClick={() => onChange('')}
                            className="absolute -translate-y-1/2 right-3 top-1/2"
                        >
                            <X className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white transition-colors border border-transparent rounded-lg bg-brand-500 hover:bg-brand-600 focus:outline-none"
                >
                    Browse
                </button>
            </div>
            {description && (
                <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Select File"
                size="xl"
            >
                <div className="h-[60vh] overflow-hidden">
                    <MediaLibraryContent
                        onSelect={(url) => {
                            onChange(url);
                            setIsModalOpen(false);
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
};
