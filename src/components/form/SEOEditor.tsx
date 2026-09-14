"use client";

import React from 'react';
import Input from './input/InputField';
import Label from './Label';

interface SEOData {
    title?: string;
    description?: string;
    image?: string;
}

interface SEOEditorProps {
    data: SEOData;
    // Accepts both the modern full-object pattern and the legacy (field, value) pattern
    onChange: ((newData: SEOData) => void) | ((field: string, value: string) => void);
}

const SEOEditor: React.FC<SEOEditorProps> = ({ data, onChange }) => {
    const handleChange = (newData: SEOData) => {
        (onChange as (newData: SEOData) => void)(newData);
    };

    return (
        <div className="space-y-6">
            <div>
                <Label>Page Meta Title</Label>
                <Input 
                    placeholder="Enter meta title..."
                    value={data.title || ''}
                    onChange={(e) => handleChange({ ...data, title: e.target.value })}
                />
                <p className="mt-2 text-xs text-gray-400">
                    Recommended: 50-60 characters. This appears in search results and browser tabs.
                </p>
            </div>

            <div>
                <Label>Page Meta Description</Label>
                <textarea 
                    className="w-full bg-[#1e1e2d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-all text-sm min-h-[100px]"
                    placeholder="Enter meta description..."
                    value={data.description || ''}
                    onChange={(e) => handleChange({ ...data, description: e.target.value })}
                />
                <p className="mt-2 text-xs text-gray-400">
                    Recommended: 150-160 characters. A brief summary of the page for search engines.
                </p>
            </div>
        </div>
    );
};

export default SEOEditor;
