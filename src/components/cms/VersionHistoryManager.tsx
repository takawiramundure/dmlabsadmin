"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { History, Clock, RotateCcw } from "lucide-react";
import { FirestoreService } from "@/services/firestore";

interface VersionHistoryManagerProps {
    documentId: string;
    siteId: string;
    collection?: string;
    onRestore?: (oldData: any) => void;
}

export default function VersionHistoryManager({
    documentId,
    siteId,
    collection = "content",
    onRestore,
}: VersionHistoryManagerProps) {
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const handleOpenHistory = async () => {
        setIsHistoryModalOpen(true);
        if (!siteId || !documentId) {
            setHistoryLogs([]);
            return;
        }
        setLoadingHistory(true);
        try {
            const logs = await FirestoreService.getDocumentHistory(siteId, collection, documentId);
            setHistoryLogs(logs || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleRestoreVersion = async (logId: string, oldData: any) => {
        if (!oldData) return;
        
        if (!window.confirm("Are you sure you want to restore this version? This will overwrite your current unsaved changes in the editor.")) {
            return;
        }

        if (onRestore) {
            onRestore(oldData);
        } else {
            try {
                await FirestoreService.savePageContent(documentId, oldData, siteId);
                window.location.reload();
            } catch (e) {
                console.error("Failed to restore directly:", e);
                alert("Failed to restore version. Check console.");
            }
        }
        setIsHistoryModalOpen(false);
    };

    return (
        <>
            <Button variant="outline" onClick={handleOpenHistory} className="flex items-center gap-2">
                <History size={16} /> Version History
            </Button>

            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Version History" className="max-w-3xl">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and restore previous versions of this content.</p>
                    {loadingHistory ? (
                        <div className="py-12 flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500"></div>
                        </div>
                    ) : historyLogs.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 border border-dashed rounded-xl border-gray-200 dark:border-gray-800">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p>No version history available for this document.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {historyLogs.map((log: any) => {
                                const logDate = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp);
                                const dateStr = isNaN(logDate.getTime()) ? 'Unknown Date' : logDate.toLocaleString();
                                const isUpdate = log.action === 'update';
                                
                                return (
                                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white capitalize">{log.action}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                <Clock size={12} /> {dateStr}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {log.previousData && (
                                                <Button size="sm" variant="outline" onClick={() => handleRestoreVersion(log.id, log.previousData)} className="flex items-center gap-2">
                                                    <RotateCcw size={14} /> Restore
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
