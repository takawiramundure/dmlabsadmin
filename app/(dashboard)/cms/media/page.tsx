"use client";

import PageMeta from "@/components/common/PageMeta";
import { MediaLibraryContent } from "@/components/common/MediaLibrary";

export default function MediaManager() {
    return (
        <>
            <PageMeta title="Media Library | NSPC Admin" description="Manage uploaded images and files" />

            <div className="h-[calc(100vh-120px)] rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <MediaLibraryContent />
            </div>
        </>
    );
}
