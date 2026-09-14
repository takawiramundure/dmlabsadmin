"use client";

import React, { useEffect, useState } from 'react';
import { storage } from "@/firebaseConfig";
import { ref, listAll } from "firebase/storage";
import { useSite } from "@/context/SiteContext";
import Label from "./Label";
import Input from "./input/InputField";

interface FolderPickerProps {
    label?: string;
    value: string;
    onChange: (path: string) => void;
    helpText?: string;
}

export default function FolderPicker({
    label,
    value,
    onChange,
    helpText
}: FolderPickerProps) {
    const { currentSite } = useSite();
    const [folders, setFolders] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const siteId = currentSite?.id;

    useEffect(() => {
        if (!siteId) return;
        setLoading(true);
        const siteRef = ref(storage, siteId);
        listAll(siteRef)
            .then(async (res) => {
                // Filter prefixes to check which ones have at least one picture
                const folderChecks = await Promise.all(
                    res.prefixes.map(async (prefixRef) => {
                        try {
                            const subRes = await listAll(prefixRef);
                            const hasPictures = subRes.items.some((item) => {
                                const ext = item.name.split('.').pop()?.toLowerCase();
                                return ext ? ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'heic', 'bmp', 'tiff'].includes(ext) : false;
                            });
                            return { name: prefixRef.name, hasPictures };
                        } catch (err) {
                            console.error(`Error checking folder ${prefixRef.name}:`, err);
                            return { name: prefixRef.name, hasPictures: false };
                        }
                    })
                );
                const validFolders = folderChecks
                    .filter((c) => c.hasPictures)
                    .map((c) => c.name);
                setFolders(validFolders);
            })
            .catch(err => {
                console.error("Error listing folders in Storage:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [siteId]);

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div className="flex gap-3">
                <div className="w-1/2">
                    <select
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={folders.includes(value) ? value : ""}
                        onChange={(e) => {
                            if (e.target.value) {
                                onChange(e.target.value);
                            }
                        }}
                    >
                        <option value="">-- Select Folder --</option>
                        {folders.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <Input
                        placeholder="Or enter custom path, e.g. gala/retro"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                </div>
            </div>
            {helpText && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {helpText}
                </p>
            )}
        </div>
    );
}
