"use client";

import { useState, useEffect } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import MediaLibrary from "@/components/common/MediaLibrary";
import {
    PencilIcon,
    TrashBinIcon,
    PlusIcon,
} from "@/icons";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface Video {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    videoUrl: string;
    published: boolean;
    order: number;
}

export default function VideoManager() {
    const { currentSite } = useSite();
    const { confirm } = useDialog();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState<Partial<Video>>({
        title: "",
        description: "",
        thumbnail: "",
        videoUrl: "",
        published: true,
        order: 0,
    });

    const {
        currentData: paginatedVideos,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<Video>({
        data: videos,
        searchKeys: ['title', 'description'],
        initialPageSize: 10
    });

    useEffect(() => {
        loadVideos();
    }, [currentSite.id]);

    const loadVideos = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getVideos(currentSite.id);
            // Sort by order ascending
            const sorted = data.sort((a: any, b: any) => a.order - b.order);
            setVideos(sorted as Video[]);
        } catch (err) {
            console.error(err);
            setError("Failed to load videos.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.videoUrl) {
            setError("Title and Video URL are required.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccessMsg("");

        try {
            await FirestoreService.saveVideo(
                currentSite.id,
                { ...formData, id: currentVideoId || undefined },
                currentVideoId || undefined
            );

            setSuccessMsg(currentVideoId ? "Video updated successfully!" : "Video created successfully!");
            setIsModalOpen(false);
            loadVideos();
            resetForm();
        } catch (err) {
            console.error(err);
            setError("Failed to save video.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete Video",
            message: "Are you sure you want to delete this video?",
            variant: "danger",
            confirmLabel: "Delete"
        });

        if (!isConfirmed) return;

        try {
            await FirestoreService.deleteVideo(currentSite.id, id);
            loadVideos();
        } catch (err) {
            console.error(err);
            setError("Failed to delete video.");
        }
    };

    const handleEdit = (video: Video) => {
        setFormData({ ...video });
        setCurrentVideoId(video.id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            thumbnail: "",
            videoUrl: "",
            published: true,
            order: videos.length + 1,
        });
        setCurrentVideoId(null);
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    return (
        <>
            <PageMeta
                title="Video Manager"
                description="Manage videos for the Media Center"
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Video Manager</h1>
                <VersionHistoryManager documentId="videos" siteId={currentSite.id} />
                <Button onClick={openModal} className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add Video
                </Button>
            </div>

            {error && <Alert variant="error" title="Error" message={error} />}
            {successMsg && <Alert variant="success" title="Success" message={successMsg} />}

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading videos...</div>
            ) : (
                <>
                    <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                        <TableControls
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchPlaceholder="Search videos..."
                        />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-medium">
                                    <th className="p-4">Thumbnail</th>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Order</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {paginatedVideos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No videos found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedVideos.map((video) => (
                                        <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-4">
                                                {video.thumbnail ? (
                                                    <img src={video.thumbnail} alt={video.title} className="w-20 h-12 object-cover rounded" />
                                                ) : (
                                                    <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                                                )}
                                            </td>
                                            <td className="p-4 font-medium dark:text-white">{video.title}</td>
                                            <td className="p-4 text-sm text-gray-500 truncate max-w-xs">{video.description}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${video.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                                    {video.published ? "Published" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500">{video.order}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(video)}
                                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(video.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <TrashBinIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="mt-6">
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        nextPage={nextPage}
                        prevPage={prevPage}
                    />
                </div>
            </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentVideoId ? "Edit Video" : "Add New Video"}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label>Video Title</Label>
                            <Input
                                placeholder="Enter video title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Video URL</Label>
                            <Input
                                placeholder="https://youtube.com/..."
                                value={formData.videoUrl}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Sort Order</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Thumbnail Image</Label>
                            <div className="flex gap-4 items-start">
                                {formData.thumbnail ? (
                                    <div className="relative group w-32 flex-shrink-0">
                                        <img
                                            src={formData.thumbnail}
                                            alt="Thumbnail"
                                            className="w-full h-20 object-cover rounded-lg border dark:border-gray-600"
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, thumbnail: "" })}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                        >
                                            <TrashBinIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setIsMediaLibraryOpen(true)}
                                        className="w-32 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors"
                                    >
                                        <span className="text-xs">Select Image</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-2">
                                        Click the box to select an image from your library, or enter a URL below.
                                    </p>
                                    <Input
                                        placeholder="Or paste image URL"
                                        value={formData.thumbnail}
                                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <Label>Description</Label>
                            <textarea
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                rows={4}
                                placeholder="Enter video description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.published}
                                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium dark:text-gray-300">Published</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t dark:border-gray-700">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : currentVideoId ? "Update Video" : "Create Video"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <MediaLibrary
                isOpen={isMediaLibraryOpen}
                onClose={() => setIsMediaLibraryOpen(false)}
                onSelect={(url) => {
                    setFormData({ ...formData, thumbnail: url });
                    setIsMediaLibraryOpen(false);
                }}
            />
        </>
    );
}
