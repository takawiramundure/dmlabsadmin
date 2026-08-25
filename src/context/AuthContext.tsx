"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from "@/firebaseConfig";

export interface UserProfile {
    email: string;
    displayName?: string;
    photoURL?: string;
    role: 'super_admin' | 'tenant_admin' | 'editor';
    allowedSites?: string[];
    uid: string;
    phoneNumber?: string;
    mfaSetupComplete?: boolean;
    tempPasswordActive?: boolean;
    tempPasswordExpiresAt?: any;
}

interface AuthContextType {
    user: User | null;     // The Firebase Auth User
    profile: UserProfile | null; // The effective profile (real or impersonated)
    isImpersonating: boolean;
    loading: boolean;
    mfaVerified: boolean;
    verifyMfaSession: () => void;
    impersonate: (userId: string) => Promise<void>;
    stopImpersonation: () => void;
    hasPermission: (permission: string) => boolean;
    permissionsConfig: Record<string, Record<string, boolean>>;
    savePermissionsConfig: (config: Record<string, Record<string, boolean>>) => Promise<void>;
    logAction: (action: string, details: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isImpersonating: false,
    loading: true,
    mfaVerified: false,
    verifyMfaSession: () => {},
    impersonate: async () => { },
    stopImpersonation: () => { },
    hasPermission: () => false,
    permissionsConfig: {},
    savePermissionsConfig: async () => {},
    logAction: async () => {}
});

import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, getDb } from "@/firebaseConfig";
import { SITES } from "@/config/sites";

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
    editor: {
        view_content: true,
        edit_content: true,
        manage_media: true,
        site_settings: true,
        page_seo: true,
        manage_users: false,
        delete_users: false,
        system_settings: false,
        view_leads: true,
        manage_forms: false,
        impersonate_users: false,
    },
    tenant_admin: {
        view_content: true,
        edit_content: true,
        manage_media: true,
        site_settings: true,
        page_seo: true,
        manage_users: true,
        delete_users: true,
        system_settings: false,
        view_leads: true,
        manage_forms: true,
        impersonate_users: false,
    }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [realProfile, setRealProfile] = useState<UserProfile | null>(null);
    const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [mfaVerified, setMfaVerified] = useState(false);
    const [permissionsConfig, setPermissionsConfig] = useState<Record<string, Record<string, boolean>>>(DEFAULT_PERMISSIONS);

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const docRef = doc(db, 'settings', 'permissions');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPermissionsConfig(docSnap.data() as Record<string, Record<string, boolean>>);
                }
            } catch (e) {
                console.error("Failed to load permissions config:", e);
            }
        };
        loadPermissions();
    }, []);

    const savePermissionsConfig = async (newConfig: Record<string, Record<string, boolean>>) => {
        try {
            await setDoc(doc(db, 'settings', 'permissions'), newConfig);
            setPermissionsConfig(newConfig);
        } catch (e) {
            console.error("Failed to save permissions config:", e);
            throw e;
        }
    };

    const hasPermission = (permission: string): boolean => {
        const activeProfile = impersonatedProfile || realProfile;
        if (!activeProfile) return false;
        if (activeProfile.role === 'super_admin') return true;
        const role = activeProfile.role || 'editor';
        return !!permissionsConfig[role]?.[permission];
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setMfaVerified(sessionStorage.getItem('dmlabs_session_mfa_verified') === 'true');
        }
    }, []);

    const verifyMfaSession = () => {
        setMfaVerified(true);
        sessionStorage.setItem('dmlabs_session_mfa_verified', 'true');
    };

    const logAction = async (action: string, details: any) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'audit_logs'), {
                timestamp: serverTimestamp(),
                userId: user.uid,
                userEmail: user.email,
                realRole: realProfile?.role,
                action,
                details,
                activeRole: impersonatedProfile?.role || realProfile?.role
            });
        } catch (e) {
            console.error("Failed to log action", e);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                setUser(currentUser);
                if (currentUser) {
                    // 1. Sync user to Firestore
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    let currentProfile: UserProfile | null = null;

                    const isSuperAdminEmail = currentUser.email?.toLowerCase() === 'support@digitalmaples.ca';
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        currentProfile = {
                            ...data,
                            role: isSuperAdminEmail ? 'super_admin' : (data.role || 'editor'),
                            allowedSites: isSuperAdminEmail ? ['nspc', 'bweic', 'kmfw', 'elwg', 'noel', 'dmlabs', 'phcg', 'aitasol', 'havens'] : (data.allowedSites || []),
                            uid: currentUser.uid
                        } as UserProfile;
                    } else {
                        currentProfile = {
                            email: currentUser.email!,
                            displayName: currentUser.displayName || '',
                            role: (isSuperAdminEmail ? 'super_admin' : 'editor') as const,
                            allowedSites: isSuperAdminEmail ? ['nspc', 'bweic', 'kmfw', 'elwg', 'noel', 'dmlabs', 'phcg', 'aitasol', 'havens'] : [],
                            uid: currentUser.uid
                        };
                    }

                    if (isSuperAdminEmail) {
                        // For super admin, we should preserve their setup MFA settings (phoneNumber and mfaSetupComplete)
                        // If they have it set in the current database, use it. If not, try to read it from other databases to sync it.
                        let mfaPhone = currentProfile.phoneNumber;
                        let mfaDone = currentProfile.mfaSetupComplete;
                        
                        if (!mfaPhone || !mfaDone) {
                            for (const site of SITES) {
                                try {
                                    const siteDb = getDb(site.id);
                                    const snap = await getDoc(doc(siteDb, 'users', currentUser.uid));
                                    if (snap.exists()) {
                                        const d = snap.data();
                                        if (d.phoneNumber && d.mfaSetupComplete) {
                                            mfaPhone = d.phoneNumber;
                                            mfaDone = true;
                                            break;
                                        }
                                    }
                                } catch (e) {}
                            }
                        }

                        if (mfaPhone) currentProfile.phoneNumber = mfaPhone;
                        if (mfaDone) currentProfile.mfaSetupComplete = mfaDone;

                        // Persist super_admin status across all tenant databases so it never reverts
                        await Promise.all(
                            SITES.map(async (site) => {
                                try {
                                    const siteDb = getDb(site.id);
                                    await setDoc(doc(siteDb, 'users', currentUser.uid), currentProfile, { merge: true });
                                } catch (err) {
                                    console.warn(`Could not sync super_admin to database '${site.id}':`, err);
                                }
                            })
                        );
                    } else if (!userSnap.exists()) {
                        await setDoc(userRef, currentProfile);
                    }
                    setRealProfile(currentProfile);

                    // 2. Check for persisted impersonation
                    const persistedImpersonationId = localStorage.getItem('impersonatedUserId');
                    if (persistedImpersonationId) {
                        await attemptRestoreImpersonation(persistedImpersonationId);
                    }
                } else {
                    setRealProfile(null);
                    setImpersonatedProfile(null);
                    setMfaVerified(false);
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('dmlabs_session_mfa_verified');
                        localStorage.removeItem('impersonatedUserId');
                    }
                }
            } catch (err) {
                console.error("Auth state change error:", err);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const attemptRestoreImpersonation = async (userId: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setImpersonatedProfile({ ...userSnap.data(), uid: userId } as UserProfile);
            } else {
                localStorage.removeItem('impersonatedUserId');
            }
        } catch (e) {
            console.error("Failed to restore impersonation", e);
            localStorage.removeItem('impersonatedUserId');
        }
    };

    const impersonate = async (userId: string) => {
        if (realProfile?.role !== 'super_admin') {
            console.warn("Security Alert: Non-admin attempted impersonation");
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const targetProfile = { ...userSnap.data(), uid: userId } as UserProfile;
                setImpersonatedProfile(targetProfile);
                localStorage.setItem('impersonatedUserId', userId);
                await logAction('impersonation_start', { targetUserId: userId, targetEmail: targetProfile.email });
            } else {
                alert("User not found");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to impersonate");
        } finally {
            setLoading(false);
        }
    };

    const stopImpersonation = () => {
        if (impersonatedProfile) {
            logAction('impersonation_stop', { targetUserId: impersonatedProfile.uid, targetEmail: impersonatedProfile.email });
        }
        setImpersonatedProfile(null);
        localStorage.removeItem('impersonatedUserId');
    };

    const value = React.useMemo(() => ({
        user,
        profile: impersonatedProfile || realProfile,
        isImpersonating: !!impersonatedProfile,
        loading,
        mfaVerified,
        verifyMfaSession,
        impersonate,
        stopImpersonation,
        hasPermission,
        permissionsConfig,
        savePermissionsConfig,
        logAction
    }), [user, impersonatedProfile, realProfile, loading, mfaVerified, permissionsConfig]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
