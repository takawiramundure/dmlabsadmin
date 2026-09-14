"use client";

import { useEffect, useState, useMemo } from "react";
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, query, where, getDocs, collection } from "firebase/firestore";
import { db, getDb, firebaseConfig } from "@/firebaseConfig";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { EyeIcon, PencilIcon, XIcon, AlertTriangleIcon, KeyRoundIcon, Lock, ChevronUpIcon, ChevronDownIcon, ChevronsUpDownIcon, UserX, UserCheck } from "lucide-react";
import { SITES } from "@/config/sites";
import { useDialog } from "@/context/DialogContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface User {
    id: string;
    email: string;
    role: 'super_admin' | 'tenant_admin' | 'editor';
    displayName?: string;
    phoneNumber?: string;
    allowedSites?: string[];
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    lastModified?: string;
    pending?: boolean;
    tempPasswordActive?: boolean;
    accountStatus?: 'active' | 'inactive';
    disabledUntil?: string | null;
    disabledReason?: string | null;
}

const PERMISSION_KEYS = [
    { key: "view_content", label: "View Content" },
    { key: "edit_content", label: "Edit Content" },
    { key: "manage_media", label: "Manage Media" },
    { key: "site_settings", label: "Site Settings" },
    { key: "page_seo", label: "Page SEO" },
    { key: "manage_users", label: "Manage Users" },
    { key: "delete_users", label: "Delete Users" },
    { key: "system_settings", label: "System Settings" },
    { key: "view_leads", label: "View Leads / Submissions" },
    { key: "manage_forms", label: "Manage / Edit Forms" },
    { key: "impersonate_users", label: "Impersonate Users (View As)" },
];

export default function UserManagement() {
    const { confirm, alert: dialogAlert } = useDialog();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser, profile, impersonate, isImpersonating, stopImpersonation, hasPermission, permissionsConfig, savePermissionsConfig } = useAuth();
    const [showImpersonationModal, setShowImpersonationModal] = useState(false);

    // User Edit/Create State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserDisplayName, setNewUserDisplayName] = useState("");
    const [newUserPhone, setNewUserPhone] = useState("");
    const [newUserRole, setNewUserRole] = useState<'editor' | 'tenant_admin' | 'super_admin'>('editor');
    const [selectedSites, setSelectedSites] = useState<string[]>([]);
    const [newUserTempPassword, setNewUserTempPassword] = useState("");
    const [creating, setCreating] = useState(false);

    // Permissions Modal State
    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [tempPermissions, setTempPermissions] = useState<Record<string, Record<string, boolean>>>({});
    const [savingPermissions, setSavingPermissions] = useState(false);

    // Tenant Filter State
    const [selectedTenant, setSelectedTenant] = useState("all");

    // Filter users based on current user's role and tenant dropdown selection
    const preFilteredUsers = useMemo(() => {
        if (!profile) return [];
        
        let users = allUsers;
        if (profile.role !== 'super_admin') {
            // If Editor/Tenant Admin, filter out Super Admins and users from other sites
            users = allUsers.filter(u => {
                if (u.deleted === true) return false;
                if (u.role === 'super_admin') return false;
                if (u.id === profile.uid) return true;
                const mySites = profile.allowedSites || [];
                const theirSites = u.allowedSites || [];
                return mySites.some(site => theirSites.includes(site));
            });
        } else {
            // If Super Admin, just hide soft-deleted users
            users = allUsers.filter(u => u.deleted !== true);
        }

        // Apply Tenant Filter dropdown selection
        if (selectedTenant !== 'all') {
            users = users.filter(u => u.allowedSites?.includes(selectedTenant));
        }

        return users;
    }, [allUsers, profile, selectedTenant]);

    const {
        currentData: paginatedUsers,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        sortKey,
        sortDirection: sortDir,
        handleSort,
        searchQuery,
        setSearchQuery,
    } = useDataTable<User>({
        data: preFilteredUsers,
        searchKeys: ['displayName', 'email'],
        initialSortKey: 'displayName',
        initialPageSize: 20
    });

    type SortKey = 'displayName' | 'email' | 'role' | 'lastModified';

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronsUpDownIcon size={13} className="inline ml-1 opacity-40" />;
        return sortDir === 'asc'
            ? <ChevronUpIcon size={13} className="inline ml-1 text-primary" />
            : <ChevronDownIcon size={13} className="inline ml-1 text-primary" />;
    };

    useEffect(() => {
        if (isPermissionsOpen) {
            setTempPermissions(JSON.parse(JSON.stringify(permissionsConfig)));
        }
    }, [isPermissionsOpen, permissionsConfig]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getUsers();
            setAllUsers(data as User[]);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    // (Data already filtered, sorted, and paginated by useDataTable)

    // Available Sites for Assignment (Filtered for Editor)
    const availableSitesToAssign = useMemo(() => {
        if (!profile) return [];
        if (profile.role === 'super_admin') return SITES;
        return SITES.filter(site => profile.allowedSites?.includes(site.id));
    }, [profile]);

    const openCreateModal = () => {
        setEditUser(null);
        setNewUserEmail("");
        setNewUserDisplayName("");
        setNewUserPhone("");
        setNewUserRole("editor"); // Default to editor
        setSelectedSites([]);
        setNewUserTempPassword("");
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditUser(user);
        setNewUserEmail(user.email);
        setNewUserDisplayName(user.displayName || "");
        setNewUserPhone(user.phoneNumber || "");
        setNewUserRole(user.role);
        setSelectedSites(user.allowedSites || []);
        setIsModalOpen(true);
    };

    const handleImpersonate = async (userId: string) => {
        await impersonate(userId);
        setShowImpersonationModal(true);
    }

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleSendResetLink = async (email: string) => {
        const isConfirmed = await confirm({
            title: "Send Password Reset Link",
            message: `Are you sure you want to send a password reset link to ${email}?`,
            variant: "warning",
            confirmLabel: "Send Link"
        });

        if (isConfirmed) {
            try {
                await sendPasswordResetEmail(auth, email, {
                    url: window.location.origin + '/signin',
                });
                
                // Log action to audit logs collection in the centralized (default) database
                const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
                const { db } = await import("@/firebaseConfig");
                await addDoc(collection(db, 'audit_logs'), {
                    timestamp: serverTimestamp(),
                    userId: currentUser?.uid || "unknown",
                    userEmail: currentUser?.email || "unknown",
                    action: "admin_password_reset_trigger",
                    details: {
                        targetUserEmail: email,
                        triggeredFrom: "User Manager"
                    },
                    realRole: "admin",
                    activeRole: "admin"
                });

                await dialogAlert({
                    title: "Email Sent",
                    message: `A password reset email has been sent to ${email}.`,
                    variant: "success"
                });
            } catch (error: any) {
                console.error("Error sending reset email:", error);
                await dialogAlert({
                    title: "Failed to Send",
                    message: "Failed to send reset email: " + error.message,
                    variant: "danger"
                });
            }
        }
    };

    const handleAssignTempPassword = async (userId: string, email: string) => {
        const generatedPassword = generatePassword();
        let tempPassword = window.prompt(
            `Enter a temporary password for ${email}\n\nLeave blank to auto-generate a secure 16-character password.`
        );

        if (tempPassword === null) return; // User cancelled
        
        tempPassword = tempPassword.trim() || generatedPassword;

        const isConfirmed = await confirm({
            title: "Assign Temporary Password",
            message: `Are you sure you want to assign the following 12-hour temporary password for ${email}?\n\nPassword: ${tempPassword}`,
            variant: "warning",
            confirmLabel: "Assign Password"
        });

        if (isConfirmed) {
            setLoading(true);
            try {
                const functions = getFunctions();
                const setTempPasswordFn = httpsCallable(functions, "setTemporaryPassword");
                await setTempPasswordFn({ targetUid: userId, password: tempPassword });

                await dialogAlert({
                    title: "Temporary Password Assigned",
                    message: `Temporary password set successfully! Please copy and send this temporary password securely to the user: ${tempPassword} (expires in 12 hours).`,
                    variant: "success"
                });
            } catch (error: any) {
                console.error("Error setting temporary password:", error);
                await dialogAlert({
                    title: "Failed to Set Password",
                    message: error.message || "Failed to assign temporary password.",
                    variant: "danger"
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSaveUser = async () => {
        if (!editUser && !newUserEmail) {
            await dialogAlert({
                title: "Validation Error",
                message: "Email is required for new users.",
                variant: "warning"
            });
            return;
        }

        // Security check for Non-Super-Admins creating/editing users
        if (profile?.role !== 'super_admin') {
            if (newUserRole === 'super_admin') {
                await dialogAlert({
                    title: "Access Denied",
                    message: "You cannot create or manage Super Admins.",
                    variant: "danger"
                });
                return;
            }
            // Ensure they are not assigning sites they don't have access to
            const illegalSites = selectedSites.filter(siteId => !profile.allowedSites?.includes(siteId));
            if (illegalSites.length > 0) {
                await dialogAlert({
                    title: "Permission Error",
                    message: "You cannot assign access to sites you do not manage.",
                    variant: "warning"
                });
                return;
            }
        }

        setCreating(true);
        try {
            if (editUser) {
                // UPDATE: write to (default) + only the SELECTED site databases.
                // Then DELETE the user doc from any site that was REMOVED to prevent
                // stale re-inflation of allowedSites on subsequent getUsers() calls.
                const userData = {
                    displayName: newUserDisplayName,
                    email: newUserEmail,
                    phoneNumber: newUserPhone,
                    role: newUserRole,
                    allowedSites: selectedSites,
                    updatedAt: new Date().toISOString(),
                };

                // Always write to central (default) db
                await setDoc(doc(db, 'users', editUser.id), userData, { merge: true });

                // Write to each site db the user now has access to
                await Promise.all(
                    SITES.map(async (site) => {
                        const siteDb = getDb(site.id);
                        const userDocRef = doc(siteDb, 'users', editUser.id);
                        if (selectedSites.includes(site.id)) {
                            // User should have access — upsert with full data
                            try {
                                await setDoc(userDocRef, userData, { merge: true });
                            } catch (err) {
                                console.warn(`Could not sync user to site '${site.id}':`, err);
                            }
                        } else {
                            // User no longer has access — remove the document so
                            // getUsers() won't re-inflate their allowedSites from presence
                            try {
                                // FIRST UPDATE to ensure allowedSites is correctly synced just in case delete fails
                                await setDoc(userDocRef, userData, { merge: true });
                                const { deleteDoc } = await import("firebase/firestore");
                                await deleteDoc(userDocRef);
                            } catch (err) {
                                // Doc may not exist in this db — ignore
                            }
                        }
                    })
                );

                // Log action to audit logs collection
                const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
                await addDoc(collection(db, 'audit_logs'), {
                    timestamp: serverTimestamp(),
                    userId: currentUser?.uid || "unknown",
                    userEmail: currentUser?.email || "unknown",
                    action: "admin_user_update",
                    details: {
                        targetUserUid: editUser.id,
                        targetUserEmail: newUserEmail,
                        role: newUserRole,
                        allowedSites: selectedSites
                    },
                    realRole: "admin",
                    activeRole: "admin"
                });

                await dialogAlert({
                    title: "Success",
                    message: "User updated successfully across all tenant databases",
                    variant: "success"
                });
            } else {
                // CREATE new
                const randomPassword = newUserTempPassword || generatePassword();
                const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
                const secondaryAuth = getAuth(secondaryApp);
                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, randomPassword);
                const newUid = userCredential.user.uid;
                
                if (newUserTempPassword) {
                    const functions = getFunctions();
                    const setTempPasswordFn = httpsCallable(functions, "setTemporaryPassword");
                    await setTempPasswordFn({ targetUid: newUid, password: newUserTempPassword });
                } else {
                    await sendPasswordResetEmail(secondaryAuth, newUserEmail, {
                        url: window.location.origin + '/signin',
                    });
                }
                
                await signOut(secondaryAuth);
                await deleteApp(secondaryApp);

                const newUserData = {
                    displayName: newUserDisplayName,
                    email: newUserEmail,
                    phoneNumber: newUserPhone,
                    role: newUserRole,
                    allowedSites: selectedSites,
                    createdAt: new Date().toISOString(),
                    pending: false
                };
                const dbsToUpdate = [
                    { id: '(default)', instance: db },
                    ...SITES.map(site => ({ id: site.id, instance: getDb(site.id) }))
                ];
                await Promise.all(
                    dbsToUpdate.map(async (dbObj) => {
                        try {
                            await setDoc(doc(dbObj.instance, 'users', newUid), newUserData);
                        } catch (err) {
                            console.warn(`Could not sync new user to database '${dbObj.id}':`, err);
                        }
                    })
                );

                // Log action to audit logs collection
                const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
                await addDoc(collection(db, 'audit_logs'), {
                    timestamp: serverTimestamp(),
                    userId: currentUser?.uid || "unknown",
                    userEmail: currentUser?.email || "unknown",
                    action: "admin_user_create",
                    details: {
                        targetUserUid: newUid,
                        targetUserEmail: newUserEmail,
                        role: newUserRole,
                        allowedSites: selectedSites
                    },
                    realRole: "admin",
                    activeRole: "admin"
                });

                await dialogAlert({
                    title: "User Created",
                    message: newUserTempPassword 
                        ? `User created successfully! The temporary password has been set. Please share it with the user.`
                        : `User created successfully! A password reset email has been sent to ${newUserEmail} so they can set their own password.`,
                    variant: "success"
                });
            }

            setIsModalOpen(false);
            loadUsers();
        } catch (e: any) {
            console.error(e);
            if (e.code === 'auth/email-already-in-use') {
                await dialogAlert({
                    title: "Registration Error",
                    message: "This email is already registered.",
                    variant: "danger"
                });
            } else {
                await dialogAlert({
                    title: "Operation Failed",
                    message: "Operation failed: " + e.message,
                    variant: "danger"
                });
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        const isConfirmed = await confirm({
            title: "Delete User",
            message: `Are you sure you want to delete user ${email}? This will revoke their access permanently.`,
            variant: "danger",
            confirmLabel: "Delete User"
        });

        if (isConfirmed) {
            setLoading(true);
            try {
                const functions = getFunctions();
                const deleteUserFn = httpsCallable(functions, "deleteUserFromAuth");
                await deleteUserFn({ targetUid: userId });

                // Also log action locally for audit logs
                const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
                await addDoc(collection(db, 'audit_logs'), {
                    timestamp: serverTimestamp(),
                    userId: currentUser?.uid || "unknown",
                    userEmail: currentUser?.email || "unknown",
                    action: "admin_user_delete",
                    details: {
                        targetUserUid: userId,
                        targetUserEmail: email
                    },
                    realRole: "admin",
                    activeRole: "admin"
                });

                loadUsers();
                await dialogAlert({
                    title: "User Deleted",
                    message: "The user has been successfully removed from authentication, and their Firestore profile has been soft-deleted to preserve history.",
                    variant: "success"
                });
            } catch (error: any) {
                console.error("Error deleting user:", error);
                await dialogAlert({
                    title: "Delete Error",
                    message: error.message || "Failed to delete user. Please try again.",
                    variant: "danger"
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleUserStatus = async (user: User) => {
        const isInactive = user.accountStatus === 'inactive';
        const action = isInactive ? 'activate' : 'deactivate';

        const isConfirmed = await confirm({
            title: isInactive ? 'Activate User' : 'Deactivate User',
            message: isInactive
                ? `Re-activate ${user.email}? They will regain full access immediately.`
                : `Deactivate ${user.email}? They will be signed out and blocked from logging in.`,
            variant: isInactive ? 'info' : 'warning',
            confirmLabel: isInactive ? 'Activate' : 'Deactivate'
        });
        if (!isConfirmed) return;

        try {
            const fns = getFunctions();
            const toggleFn = httpsCallable(fns, 'toggleUserStatus');
            await toggleFn({ targetUid: user.id, disable: !isInactive, reason: 'Admin action' });
            await loadUsers();
            await dialogAlert({
                title: isInactive ? 'User Activated' : 'User Deactivated',
                message: isInactive
                    ? `${user.email} has been reactivated successfully.`
                    : `${user.email} has been deactivated. They can no longer log in.`,
                variant: 'success'
            });
        } catch (error: any) {
            await dialogAlert({
                title: `Failed to ${action} user`,
                message: error.message || `Could not ${action} the user. Please try again.`,
                variant: 'danger'
            });
        }
    };

    const handleSavePermissions = async () => {
        setSavingPermissions(true);
        try {
            await savePermissionsConfig(tempPermissions);
            await dialogAlert({
                title: "Permissions Saved",
                message: "Roles and permissions updated successfully.",
                variant: "success"
            });
            setIsPermissionsOpen(false);
        } catch (error: any) {
            console.error("Failed to save permissions:", error);
            await dialogAlert({
                title: "Failed to Save",
                message: "Could not save permissions: " + error.message,
                variant: "danger"
            });
        } finally {
            setSavingPermissions(false);
        }
    };

    return (
        <>
            <PageMeta
                title="User Management | Digital Maples Labs CMS"
                description="Manage users and roles"
            />
            {/* Impersonation Banner - Always visible if impersonating */}
            {isImpersonating && (
                <div className="fixed top-0 left-0 right-0 z-[60] bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangleIcon className="text-yellow-300" size={20} />
                        <div>
                            <p className="font-bold text-sm">Viewing as {profile?.email}</p>
                            <p className="text-xs opacity-90">You are seeing the portal exactly as this user sees it.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white text-blue-700 hover:bg-blue-50 border-none"
                            onClick={() => window.location.href = '/'}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-red-500 text-white hover:bg-red-600 border-none"
                            onClick={() => {
                                stopImpersonation();
                                setTimeout(() => window.location.reload(), 100);
                            }}
                        >
                            Exit View
                        </Button>
                    </div>
                </div>
            )}

            {/* Initial Pop-up Modal for Impersonation (Optional Confirmation) */}
            {showImpersonationModal && isImpersonating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-sm mx-4 transform transition-all scale-100">
                        <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <EyeIcon size={24} />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-gray-900">You are now {profile?.email}</h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Any actions you take will be attributed to this user.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => window.location.href = '/'}>
                                Go to {profile?.role === 'super_admin' ? 'Super Admin' : 'Editor'} Dashboard
                            </Button>
                            <Button variant="outline" onClick={() => setShowImpersonationModal(false)}>
                                Stay on this page
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        User Management
                    </h3>
                    <div className="flex gap-3">
                        {profile?.role === 'super_admin' && (
                            <Button size="sm" variant="outline" onClick={() => setIsPermissionsOpen(true)}>
                                Roles & Permissions
                            </Button>
                        )}
                        <Button size="sm" onClick={openCreateModal}>+ Add User</Button>
                    </div>
                </div>

                {/* Standardized Table Controls */}
                <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-gray-150 dark:border-gray-800 mb-6">
                    <TableControls
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        searchPlaceholder="Search users..."
                    >
                        {/* Tenant Dropdown (Super Admin Only) */}
                        {profile?.role === 'super_admin' && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Tenant:</span>
                                <select
                                    value={selectedTenant}
                                    onChange={(e) => setSelectedTenant(e.target.value)}
                                    className="bg-transparent border border-gray-200 dark:border-gray-800 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:border-primary text-gray-800 dark:text-gray-200"
                                >
                                    <option value="all">All Tenants</option>
                                    {SITES.map((site) => (
                                        <option key={site.id} value={site.id}>
                                            {site.name} ({site.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </TableControls>
                </div>

                {loading ? (
                    <div>Loading users...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                                    <th
                                        className="px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap"
                                        onClick={() => handleSort('displayName')}
                                    >
                                        Name / Email <SortIcon col="displayName" />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap"
                                        onClick={() => handleSort('role')}
                                    >
                                        Role <SortIcon col="role" />
                                    </th>
                                    <th className="px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">Status</th>
                                    <th
                                        className="px-4 py-3 text-sm font-medium text-gray-500 cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap"
                                        onClick={() => handleSort('lastModified')}
                                    >
                                        Last Modified <SortIcon col="lastModified" />
                                    </th>
                                    <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 align-top">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {user.displayName || "No Name"}
                                                    {user.role === 'super_admin' && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-normal">Super Admin</span>}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-0.5">{user.email || user.id}</span>
                                                {user.phoneNumber && <span className="text-xs text-gray-400 mt-0.5">📞 {user.phoneNumber}</span>}

                                                {/* Tenant / Allowed Sites Pills */}
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {user.role === 'super_admin' ? (
                                                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10 uppercase">
                                                            All Tenants (Global Access)
                                                        </span>
                                                    ) : user.allowedSites && user.allowedSites.length > 0 ? (
                                                        user.allowedSites.map((siteId) => (
                                                            <span key={siteId} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                                {siteId}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 font-medium">No site access assigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role column */}
                                        <td className="px-4 py-3 text-sm align-top">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                                                user.role === 'super_admin'
                                                    ? 'bg-purple-50 text-purple-700 ring-purple-700/10'
                                                    : user.role === 'tenant_admin'
                                                    ? 'bg-amber-50 text-amber-700 ring-amber-700/10'
                                                    : 'bg-gray-100 text-gray-700 ring-gray-500/10'
                                            }`}>
                                                {user.role.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        {/* Status column */}
                                        <td className="px-4 py-3 text-sm align-top">
                                            {user.accountStatus === 'inactive' ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-700/10">
                                                    ✗ Inactive
                                                </span>
                                            ) : user.tempPasswordActive ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700 ring-1 ring-inset ring-orange-700/10">
                                                    🔑 Temp Password
                                                </span>
                                            ) : user.pending ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-semibold text-yellow-700 ring-1 ring-inset ring-yellow-700/10">
                                                    ⏳ Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-700/10">
                                                    ✓ Active
                                                </span>
                                            )}
                                        </td>
                                        {/* Last Modified column */}
                                        <td className="px-4 py-3 text-sm text-gray-500 align-top whitespace-nowrap">
                                            {(() => {
                                                const raw = user.updatedAt || user.lastModified || user.createdAt;
                                                if (!raw) return <span className="text-gray-300 text-xs">—</span>;
                                                const d = new Date(raw);
                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.toLocaleDateString('en-CA')}</span>
                                                        <span className="text-[10px] text-gray-400">{d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right align-top">
                                            <div className="flex justify-end gap-1 flex-wrap">
                                                <button
                                                    title="View As"
                                                    onClick={() => handleImpersonate(user.id)}
                                                    className="p-1 hover:text-blue-600 transition-colors text-gray-500"
                                                >
                                                    <EyeIcon size={18} />
                                                </button>
                                                {hasPermission('manage_users') && (
                                                    <button
                                                        title={user.accountStatus === 'inactive' ? 'Activate User' : 'Deactivate User'}
                                                        onClick={() => handleToggleUserStatus(user)}
                                                        className={`p-1 transition-colors ${
                                                            user.accountStatus === 'inactive'
                                                                ? 'text-green-500 hover:text-green-700'
                                                                : 'text-gray-500 hover:text-orange-500'
                                                        }`}
                                                    >
                                                        {user.accountStatus === 'inactive'
                                                            ? <UserCheck size={18} />
                                                            : <UserX size={18} />}
                                                    </button>
                                                )}
                                                {hasPermission('manage_users') && (
                                                    <button
                                                        title="Send Password Reset Link"
                                                        onClick={() => handleSendResetLink(user.email)}
                                                        className="p-1 hover:text-yellow-600 transition-colors text-gray-500"
                                                    >
                                                        <KeyRoundIcon size={18} />
                                                    </button>
                                                )}
                                                {hasPermission('manage_users') && (
                                                    <button
                                                        title="Assign Temporary Password"
                                                        onClick={() => handleAssignTempPassword(user.id, user.email)}
                                                        className="p-1 hover:text-teal-600 transition-colors text-gray-500"
                                                    >
                                                        <Lock size={18} />
                                                    </button>
                                                )}
                                                {hasPermission('manage_users') && (
                                                    <button
                                                        title="Edit"
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1 hover:text-gray-900 transition-colors text-gray-500"
                                                    >
                                                        <PencilIcon size={18} />
                                                    </button>
                                                )}
                                                {hasPermission('delete_users') && (
                                                    <button
                                                        title="Delete"
                                                        onClick={() => handleDeleteUser(user.id, user.email)}
                                                        className="p-1 hover:text-red-600 transition-colors text-gray-500"
                                                    >
                                                        <XIcon size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {paginatedUsers.length === 0 && <div className="p-4 text-center text-gray-500">No users found available for your role.</div>}
                    </div>
                )}

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



                {/* Add/Edit Modal (Unchanged) */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {editUser ? 'Edit User' : 'Add New User'}
                    </h3>
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <Label>Name</Label>
                            <Input
                                type="text"
                                placeholder="Full Name"
                                value={newUserDisplayName}
                                onChange={(e) => setNewUserDisplayName(e.target.value)}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                            />
                            {!editUser && !newUserTempPassword && (
                                <p className="text-xs text-gray-500 mt-1">
                                    An email will be sent immediately prompting the user to set their password.
                                </p>
                            )}
                        </div>
                        
                        {/* Temporary Password */}
                        {!editUser && (
                            <div>
                                <Label>Temporary Password (Optional)</Label>
                                <Input
                                    type="text"
                                    placeholder="Leave blank to auto-generate and email link"
                                    value={newUserTempPassword}
                                    onChange={(e) => setNewUserTempPassword(e.target.value)}
                                />
                                {newUserTempPassword && (
                                    <p className="text-xs text-brand-600 mt-1 font-medium">
                                        No email will be sent. You must securely share this password with the user. It expires in 12 hours.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Phone Number */}
                        <div>
                            <Label>Phone Number (for MFA)</Label>
                            <Input
                                type="text"
                                placeholder="+12895550199"
                                value={newUserPhone}
                                onChange={(e) => setNewUserPhone(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Must include country code, e.g., +12895550199
                            </p>
                        </div>

                        {/* Role - Allowed options based on current user's role */}
                        {profile?.role === 'super_admin' ? (
                            <div>
                                <Label>Role</Label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as any)}
                                >
                                    <option value="editor">Editor</option>
                                    <option value="tenant_admin">Tenant Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                        ) : hasPermission('manage_users') ? (
                            <div>
                                <Label>Role</Label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value as any)}
                                >
                                    <option value="editor">Editor</option>
                                    <option value="tenant_admin">Tenant Admin</option>
                                </select>
                            </div>
                        ) : (
                            <div>
                                <Label>Role</Label>
                                <div className="text-sm border p-3 rounded-lg bg-gray-100 text-gray-600">Editor</div>
                            </div>
                        )}

                        {/* Site Access - For Editors and Tenant Admins */}
                        {newUserRole !== 'super_admin' && (
                            <div>
                                <Label>Allowed Sites</Label>
                                <div className="space-y-2 mt-2 border p-3 rounded-lg bg-gray-50">
                                    {availableSitesToAssign.map(site => (
                                        <label key={site.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedSites.includes(site.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedSites([...selectedSites, site.id]);
                                                    else setSelectedSites(selectedSites.filter(id => id !== site.id));
                                                }}
                                                className="rounded text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-gray-700">{site.name}</span>
                                        </label>
                                    ))}
                                    {availableSitesToAssign.length === 0 && (
                                        <div className="text-xs text-gray-500">No sites available to assign.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={creating}>Cancel</Button>
                            <Button onClick={handleSaveUser} disabled={(!editUser && !newUserEmail) || creating}>
                                {creating ? "Saving..." : (editUser ? "Update User" : "Create User")}
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Permissions Modal (Interactive) */}
                <Modal isOpen={isPermissionsOpen} onClose={() => setIsPermissionsOpen(false)} className="max-w-3xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Roles & Permissions</h3>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="uppercase tracking-wider border-b-2 border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Permission</th>
                                    <th scope="col" className="px-6 py-4 text-center text-blue-600">Editor</th>
                                    <th scope="col" className="px-6 py-4 text-center text-green-600">Tenant Admin</th>
                                    <th scope="col" className="px-6 py-4 text-center text-purple-600">Super Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {PERMISSION_KEYS.map((perm) => (
                                    <tr key={perm.key} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {perm.label}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={!!tempPermissions.editor?.[perm.key]}
                                                disabled={profile?.role !== 'super_admin'}
                                                onChange={(e) => {
                                                    const updated = { ...tempPermissions };
                                                    if (!updated.editor) updated.editor = {};
                                                    updated.editor[perm.key] = e.target.checked;
                                                    setTempPermissions(updated);
                                                }}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={!!tempPermissions.tenant_admin?.[perm.key]}
                                                disabled={profile?.role !== 'super_admin'}
                                                onChange={(e) => {
                                                    const updated = { ...tempPermissions };
                                                    if (!updated.tenant_admin) updated.tenant_admin = {};
                                                    updated.tenant_admin[perm.key] = e.target.checked;
                                                    setTempPermissions(updated);
                                                }}
                                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                disabled
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 opacity-50"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsPermissionsOpen(false)}>Cancel</Button>
                        {profile?.role === 'super_admin' && (
                            <Button onClick={handleSavePermissions} disabled={savingPermissions}>
                                {savingPermissions ? "Saving..." : "Save Permissions"}
                            </Button>
                        )}
                    </div>
                </Modal>
            </div>
        </>
    );
}
