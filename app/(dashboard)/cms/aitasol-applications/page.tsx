"use client";

import { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { EyeIcon, FileTextIcon, UserIcon, CalendarIcon, GraduationCapIcon, GlobeIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";
import { useDialog } from "@/context/DialogContext";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface Application {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    highestDegree: string;
    institution: string;
    gpa: string;
    passingYear: string;
    targetCountry: string;
    preferredCourse: string;
    targetIntake: string;
    status: 'pending' | 'draft' | 'approved' | 'rejected' | 'in-review';
    passportUrl?: string;
    transcriptUrl?: string;
    cvUrl?: string;
    updatedAt?: any;
}

export default function AitasolApplications() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    const {
        currentData: paginatedApps,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<Application>({
        data: applications,
        searchKeys: ['firstName', 'lastName', 'email', 'phone', 'preferredCourse', 'targetCountry', 'highestDegree', 'institution', 'status'],
        initialPageSize: 10
    });

    useEffect(() => {
        if (currentSite.id === 'aitasol') {
            loadApplications();
        }
    }, [currentSite]);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getApplications('aitasol');
            setApplications(data as Application[]);
        } catch (error) {
            console.error("Failed to load applications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async (appId: string, newStatus: string) => {
        const isConfirmed = await confirm({
            title: "Update Status",
            message: `Are you sure you want to change the status of this application to "${newStatus.toUpperCase()}"?`,
            variant: newStatus === 'rejected' ? 'danger' : 'warning',
            confirmLabel: `Update to ${newStatus}`
        });

        if (!isConfirmed) return;

        setUpdating(true);
        try {
            await FirestoreService.updateApplicationStatus('aitasol', appId, newStatus);
            await loadApplications();
            // Update selected app in modal if it's the same one
            if (selectedApp?.id === appId) {
                setSelectedApp({ ...selectedApp, status: newStatus as any });
            }
        } catch (error) {
            await dialogAlert({
                title: "Update Error",
                message: "Failed to update application status. Please try again.",
                variant: "danger"
            });
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon size={12} /> Approved</span>;
            case 'rejected':
                return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon size={12} /> Rejected</span>;
            case 'in-review':
                return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><ClockIcon size={12} /> In Review</span>;
            case 'pending':
                return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><ClockIcon size={12} /> Pending</span>;
            default:
                return <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (currentSite.id !== 'aitasol') {
        return (
            <div className="p-6 text-center">
                <h3 className="text-lg font-semibold">Please select Aitasol site to manage applications.</h3>
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Student Applications | Aitasol Admin" description="Manage study abroad applications" />
            
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Student Applications</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage and track student consultancy submissions</p>
                    </div>
                    <Button onClick={loadApplications} variant="outline" size="sm">Refresh</Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                            <TableControls
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                searchPlaceholder="Search applications..."
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course & Country</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Education</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 dark:bg-transparent dark:divide-gray-800">
                                {paginatedApps.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                                                    {app.firstName[0]}{app.lastName[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{app.firstName} {app.lastName}</div>
                                                    <div className="text-xs text-gray-500">{app.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">{app.preferredCourse}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1"><GlobeIcon size={12} /> {app.targetCountry}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">{app.highestDegree}</div>
                                            <div className="text-xs text-gray-500">{app.institution} (GPA: {app.gpa})</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(app.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleViewDetails(app)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                                            >
                                                <EyeIcon size={16} /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {paginatedApps.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <FileTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <p>No applications found.</p>
                            </div>
                        )}
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
            </div>

            {/* Details Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="7xl" className="p-0 overflow-hidden">
                {selectedApp && (
                    <div className="flex flex-col h-full max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-brand-600 p-6 text-white">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                        {selectedApp.firstName[0]}{selectedApp.lastName[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedApp.firstName} {selectedApp.lastName}</h2>
                                        <p className="text-brand-100">{selectedApp.email} | {selectedApp.phone}</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                                    <span className="text-xs uppercase tracking-wider text-brand-100 block mb-1">Status</span>
                                    <div className="font-bold capitalize">{selectedApp.status}</div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Info */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <GraduationCapIcon size={16} /> Education Background
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-500 block">Highest Degree</span>
                                                <p className="text-sm font-semibold">{selectedApp.highestDegree}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block">Institution</span>
                                                <p className="text-sm font-semibold">{selectedApp.institution}</p>
                                            </div>
                                            <div className="flex gap-8">
                                                <div>
                                                    <span className="text-xs text-gray-500 block">GPA / Score</span>
                                                    <p className="text-sm font-semibold">{selectedApp.gpa}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 block">Passing Year</span>
                                                    <p className="text-sm font-semibold">{selectedApp.passingYear}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <GlobeIcon size={16} /> Target Preferences
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-xs text-gray-500 block">Country of Choice</span>
                                                <p className="text-sm font-semibold">{selectedApp.targetCountry}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block">Preferred Course</span>
                                                <p className="text-sm font-semibold">{selectedApp.preferredCourse}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block">Target Intake</span>
                                                <p className="text-sm font-semibold">{selectedApp.targetIntake}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Documents & Actions */}
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <FileTextIcon size={16} /> Supporting Documents
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">PDF</div>
                                                    <span className="text-sm font-medium">Passport Copy</span>
                                                </div>
                                                {selectedApp.passportUrl ? (
                                                    <a href={selectedApp.passportUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-600 hover:underline">View File</a>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Not Uploaded</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">PDF</div>
                                                    <span className="text-sm font-medium">Academic Transcripts</span>
                                                </div>
                                                {selectedApp.transcriptUrl ? (
                                                    <a href={selectedApp.transcriptUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-600 hover:underline">View File</a>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Not Uploaded</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">CV</div>
                                                    <span className="text-sm font-medium">Curriculum Vitae</span>
                                                </div>
                                                {selectedApp.cvUrl ? (
                                                    <a href={selectedApp.cvUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-600 hover:underline">View File</a>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Not Uploaded</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-white/[0.03] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Update Application Status</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleUpdateStatus(selectedApp.id, 'in-review')}
                                                disabled={updating}
                                            >
                                                Mark as Reviewing
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="primary" 
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                                                disabled={updating}
                                            >
                                                Approve Application
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="border-red-200 text-red-700 hover:bg-red-50"
                                                onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                                                disabled={updating}
                                            >
                                                Reject Application
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                Close details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
