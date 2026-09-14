"use client";

import { useState, useEffect, useCallback } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useAuth } from "@/context/AuthContext";
import { RAW_SITES } from "@/config/sites";
import { db } from "@/firebaseConfig";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useDialog } from "@/context/DialogContext";
import {
    ExternalLinkIcon,
    LayoutDashboardIcon,
    GlobeIcon,
    CheckCircleIcon,
    XCircleIcon,
    RefreshCwIcon,
    CalendarIcon,
    UsersIcon,
    PencilIcon,
    SaveIcon,
    XIcon,
} from "lucide-react";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface TenantConfig {
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    deactivationReason?: string | null;
    updatedBy?: string;
    // Editable overrides
    displayName?: string;
    description?: string;
    frontendUrl?: string;
    backendUrl?: string;
}

interface TenantRow {
    id: string;
    name: string;
    domain: string;
    description?: string;
    frontendUrl: string;
    backendUrl: string;
    config: TenantConfig;
    userCount: number;
}

interface EditState {
    displayName: string;
    description: string;
    frontendUrl: string;
    backendUrl: string;
}

const DEFAULT_BACKEND: Record<string, string> = {
    nspc: "https://nspc.bk.digitalmaples.agency",
    bweic: "https://bk.bweic.org",
    kmfw: "https://kmfw.bk.digitalmaples.agency",
    elwg: "https://elwg.bk.digitalmaples.agency",
    noel: "https://noel.bk.digitalmaples.agency",
    dmlabs: "https://dmlabs.bk.digitalmaples.agency",
    phcg: "https://phcg.bk.digitalmaples.agency",
    aitasol: "https://aitasol.bk.digitalmaples.agency",
    havens: "https://havens.bk.digitalmaples.agency",
};

export default function TenantManagementPage() {
    const { profile, user: currentUser } = useAuth();
    const { confirm, alert: dialogAlert } = useDialog();
    const [tenants, setTenants] = useState<TenantRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Edit modal state
    const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null);
    const [editState, setEditState] = useState<EditState>({ displayName: "", description: "", frontendUrl: "", backendUrl: "" });
    const [saving, setSaving] = useState(false);

    const {
        currentData: paginatedTenants,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<TenantRow>({
        data: tenants,
        searchKeys: ['name', 'domain', 'id'],
        initialSortKey: 'name',
        initialPageSize: 10
    });

    const loadTenants = useCallback(async () => {
        setLoading(true);
        try {
            const configSnaps = await getDocs(collection(db, "tenant_config"));
            const configMap = new Map<string, TenantConfig>();
            configSnaps.forEach(d => configMap.set(d.id, d.data() as TenantConfig));

            const usersSnap = await getDocs(collection(db, "users"));
            const userCountMap = new Map<string, number>();
            usersSnap.forEach(d => {
                const data = d.data();
                if (data.deleted) return;
                const sites: string[] = data.allowedSites || [];
                sites.forEach(s => userCountMap.set(s, (userCountMap.get(s) || 0) + 1));
            });

            const rows: TenantRow[] = RAW_SITES.map(site => {
                const cfg = configMap.get(site.id) ?? { active: true };
                // Firestore overrides take precedence over static config
                return {
                    id: site.id,
                    name: cfg.displayName || site.name,
                    domain: site.domain,
                    description: cfg.description ?? site.description,
                    frontendUrl: cfg.frontendUrl || `https://${site.domain}`,
                    backendUrl: cfg.backendUrl || DEFAULT_BACKEND[site.id] || `https://${site.id}.bk.digitalmaples.agency`,
                    config: cfg,
                    userCount: userCountMap.get(site.id) || 0,
                };
            });

            setTenants(rows);
        } catch (err) {
            console.error("Failed to load tenants:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTenants(); }, [loadTenants]);

    const openEdit = (tenant: TenantRow) => {
        setEditingTenant(tenant);
        setEditState({
            displayName: tenant.name,
            description: tenant.description || "",
            frontendUrl: tenant.frontendUrl,
            backendUrl: tenant.backendUrl,
        });
    };

    const closeEdit = () => {
        setEditingTenant(null);
        setSaving(false);
    };

    const handleSaveEdit = async () => {
        if (!editingTenant) return;
        setSaving(true);
        try {
            const payload: Partial<TenantConfig> = {
                displayName: editState.displayName.trim() || editingTenant.id,
                description: editState.description.trim(),
                frontendUrl: editState.frontendUrl.trim(),
                backendUrl: editState.backendUrl.trim(),
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser?.uid || "unknown",
            };

            await setDoc(doc(db, "tenant_config", editingTenant.id), payload, { merge: true });

            // Audit log
            const { addDoc, collection: col, serverTimestamp } = await import("firebase/firestore");
            await addDoc(col(db, "audit_logs"), {
                timestamp: serverTimestamp(),
                userId: currentUser?.uid || "unknown",
                userEmail: currentUser?.email || "unknown",
                action: "admin_tenant_update",
                details: { siteId: editingTenant.id, changes: payload },
            });

            await loadTenants();
            closeEdit();
            await dialogAlert({
                title: "Tenant Updated",
                message: `${editState.displayName || editingTenant.id} has been updated successfully.`,
                variant: "success",
            });
        } catch (err: any) {
            await dialogAlert({
                title: "Save Failed",
                message: err.message || "Could not save tenant details. Please try again.",
                variant: "danger",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleTenant = async (tenant: TenantRow) => {
        const isActive = tenant.config.active !== false;
        const action = isActive ? "deactivate" : "activate";

        const confirmed = await confirm({
            title: isActive ? "Deactivate Tenant Site" : "Activate Tenant Site",
            message: isActive
                ? `Deactivating ${tenant.name} will show a "Site Not Available" page to all visitors. Their data is preserved. Continue?`
                : `Reactivating ${tenant.name} will restore full public access immediately. Continue?`,
            variant: isActive ? "danger" : "info",
            confirmLabel: isActive ? "Deactivate Site" : "Activate Site",
        });
        if (!confirmed) return;

        setTogglingId(tenant.id);
        try {
            const fns = getFunctions();
            const toggleFn = httpsCallable(fns, "toggleTenantStatus");
            await toggleFn({ siteId: tenant.id, active: !isActive, reason: "Admin action" });
            await loadTenants();
            await dialogAlert({
                title: isActive ? "Site Deactivated" : "Site Activated",
                message: isActive
                    ? `${tenant.name} is now offline. Visitors will see the maintenance page.`
                    : `${tenant.name} is now live and accessible to the public.`,
                variant: "success",
            });
        } catch (err: any) {
            await dialogAlert({
                title: `Failed to ${action} tenant`,
                message: err.message || `Could not ${action} ${tenant.name}. Please try again.`,
                variant: "danger",
            });
        } finally {
            setTogglingId(null);
        }
    };

    if (profile?.role !== "super_admin") {
        return (
            <div className="p-8 text-center text-gray-500">
                <XCircleIcon className="mx-auto mb-2 text-red-400" size={32} />
                <p className="font-semibold">Access Denied</p>
                <p className="text-sm">Only Super Admins can manage tenant sites.</p>
            </div>
        );
    }

    return (
        <>
            <PageMeta title="Tenant Management | Admin Portal" description="Manage all tenant sites." />
            <PageBreadcrumb pageTitle="Tenant Management" />

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Tenant Sites</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {tenants.filter(t => t.config.active !== false).length} active &nbsp;&middot;&nbsp;
                            {tenants.filter(t => t.config.active === false).length} inactive &nbsp;&middot;&nbsp;
                            {tenants.length} total
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadTenants}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-500"
                            title="Refresh"
                        >
                            <RefreshCwIcon size={15} />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                    <TableControls
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Search tenants..."
                    />
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-400 text-sm">Loading tenants&hellip;</div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Tenant</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Frontend</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Backend</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Users</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Last Modified</th>
                                        <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTenants.map(tenant => {
                                        const isActive = tenant.config.active !== false;
                                        return (
                                            <tr key={tenant.id} className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${!isActive ? "opacity-60" : ""}`}>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{tenant.name}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{tenant.id}</span>
                                                        {tenant.description && <span className="text-xs text-gray-500 mt-1 max-w-[180px]">{tenant.description}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <a href={tenant.frontendUrl} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline max-w-[160px] truncate">
                                                        <GlobeIcon size={12} className="shrink-0" />
                                                        <span className="truncate">{tenant.frontendUrl.replace(/^https?:\/\//, '')}</span>
                                                    </a>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <a href={tenant.backendUrl} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline max-w-[160px] truncate">
                                                        <LayoutDashboardIcon size={12} className="shrink-0" />
                                                        <span className="truncate">{tenant.backendUrl.replace(/^https?:\/\//, '')}</span>
                                                        <ExternalLinkIcon size={10} className="shrink-0" />
                                                    </a>
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    {isActive ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-700/10">
                                                            <CheckCircleIcon size={10} /> Active
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-700/10">
                                                                <XCircleIcon size={10} /> Inactive
                                                            </span>
                                                            {tenant.config.deactivationReason && (
                                                                <span className="text-[10px] text-gray-400">{tenant.config.deactivationReason}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                        <UsersIcon size={13} className="text-gray-400" />
                                                        {tenant.userCount}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 align-top text-xs text-gray-500 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            {tenant.config.updatedAt ? new Date(tenant.config.updatedAt).toLocaleDateString("en-CA") : "Never"}
                                                        </span>
                                                        {tenant.config.updatedAt && (
                                                            <span className="text-[10px] text-gray-400">
                                                                {new Date(tenant.config.updatedAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top text-right">
                                                    <div className="flex justify-end items-center gap-1.5">
                                                        <button
                                                            onClick={() => openEdit(tenant)}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 ring-1 ring-gray-200 dark:ring-gray-700 transition-all"
                                                            title="Edit tenant details"
                                                        >
                                                            <PencilIcon size={11} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleTenant(tenant)}
                                                            disabled={togglingId === tenant.id}
                                                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                                                                isActive
                                                                    ? "bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-200"
                                                                    : "bg-green-50 text-green-700 hover:bg-green-100 ring-1 ring-green-200"
                                                            }`}
                                                        >
                                                            {togglingId === tenant.id ? (
                                                                <RefreshCwIcon size={11} className="animate-spin" />
                                                            ) : isActive ? (
                                                                <><XCircleIcon size={11} /> Deactivate</>
                                                            ) : (
                                                                <><CheckCircleIcon size={11} /> Activate</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {paginatedTenants.length === 0 && (
                                <div className="py-10 text-center text-gray-400 text-sm">No tenants match your search.</div>
                            )}
                        </div>

                        {/* Mobile Card List */}
                        <div className="sm:hidden flex flex-col gap-3">
                            {paginatedTenants.map(tenant => {
                                const isActive = tenant.config.active !== false;
                                return (
                                    <div key={tenant.id} className={`rounded-xl border p-4 ${isActive ? "border-gray-200 dark:border-gray-700" : "border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10"}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{tenant.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{tenant.id}</p>
                                            </div>
                                            {isActive ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-700/10 shrink-0">
                                                    <CheckCircleIcon size={9} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-700/10 shrink-0">
                                                    <XCircleIcon size={9} /> Inactive
                                                </span>
                                            )}
                                        </div>
                                        {tenant.description && <p className="text-xs text-gray-500 mt-1">{tenant.description}</p>}
                                        <div className="mt-3 flex flex-col gap-1.5">
                                            <a href={tenant.frontendUrl} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline truncate">
                                                <GlobeIcon size={11} className="shrink-0" /> <span className="truncate">{tenant.frontendUrl}</span>
                                            </a>
                                            <a href={tenant.backendUrl} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline truncate">
                                                <LayoutDashboardIcon size={11} className="shrink-0" /> Admin Portal <ExternalLinkIcon size={9} className="shrink-0" />
                                            </a>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                                            <div className="text-[10px] text-gray-400 flex items-center gap-3">
                                                <span className="inline-flex items-center gap-1"><UsersIcon size={10} /> {tenant.userCount} users</span>
                                                {tenant.config.updatedAt && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarIcon size={10} /> {new Date(tenant.config.updatedAt).toLocaleDateString("en-CA")}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => openEdit(tenant)}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold bg-gray-50 dark:bg-white/5 text-gray-700 ring-1 ring-gray-200 dark:ring-gray-700"
                                                >
                                                    <PencilIcon size={9} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleTenant(tenant)}
                                                    disabled={togglingId === tenant.id}
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all disabled:opacity-50 ${
                                                        isActive ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-green-50 text-green-700 ring-1 ring-green-200"
                                                    }`}
                                                >
                                                    {togglingId === tenant.id ? <RefreshCwIcon size={9} className="animate-spin" /> : isActive ? <><XCircleIcon size={9} /> Deactivate</> : <><CheckCircleIcon size={9} /> Activate</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filtered.length === 0 && (
                                <div className="py-10 text-center text-gray-400 text-sm">No tenants match your search.</div>
                            )}
                        </div>
                        
                        {/* Pagination Footer controls */}
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            setPageSize={setPageSize}
                            nextPage={nextPage}
                            prevPage={prevPage}
                        />
                    </>
                )}
            </div>

            {/* Edit Tenant Modal */}
            {editingTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Tenant</h3>
                                <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">{editingTenant.id}</p>
                            </div>
                            <button
                                onClick={closeEdit}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                            >
                                <XIcon size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 flex flex-col gap-4">
                            {/* Display Name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Display Name</label>
                                <input
                                    type="text"
                                    value={editState.displayName}
                                    onChange={e => setEditState(s => ({ ...s, displayName: e.target.value }))}
                                    placeholder={editingTenant.id}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                                <textarea
                                    value={editState.description}
                                    onChange={e => setEditState(s => ({ ...s, description: e.target.value }))}
                                    placeholder="Short description of this tenant..."
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400 resize-none"
                                />
                            </div>

                            {/* Frontend URL */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                    <GlobeIcon size={11} className="inline mr-1" />
                                    Frontend URL
                                </label>
                                <input
                                    type="url"
                                    value={editState.frontendUrl}
                                    onChange={e => setEditState(s => ({ ...s, frontendUrl: e.target.value }))}
                                    placeholder="https://example.com"
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400 font-mono"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Public-facing website URL</p>
                            </div>

                            {/* Backend URL */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                                    <LayoutDashboardIcon size={11} className="inline mr-1" />
                                    Backend Admin URL
                                </label>
                                <input
                                    type="url"
                                    value={editState.backendUrl}
                                    onChange={e => setEditState(s => ({ ...s, backendUrl: e.target.value }))}
                                    placeholder="https://admin.example.com"
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400 font-mono"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Tenant-specific admin portal URL</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={closeEdit}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60 transition-all"
                            >
                                {saving ? <RefreshCwIcon size={14} className="animate-spin" /> : <SaveIcon size={14} />}
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
