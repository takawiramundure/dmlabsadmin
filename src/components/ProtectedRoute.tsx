"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: ('super_admin' | 'tenant_admin' | 'editor')[];
    requiredPermission?: string;
    children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, requiredPermission, children }: ProtectedRouteProps) {
    const { user, profile, loading, mfaVerified, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/signin');
            } else if (!mfaVerified) {
                if (profile && profile.mfaSetupComplete) {
                    router.replace('/mfa-verify');
                } else if (profile) {
                    router.replace('/mfa-enroll');
                }
            } else if (profile && profile.tempPasswordActive) {
                let expired = false;
                if (profile.tempPasswordExpiresAt) {
                    const expiryMs = typeof profile.tempPasswordExpiresAt.toMillis === 'function'
                        ? profile.tempPasswordExpiresAt.toMillis()
                        : new Date(profile.tempPasswordExpiresAt).getTime();
                    expired = Date.now() > expiryMs;
                }
                if (expired) {
                    const { signOut } = require("firebase/auth");
                    const { auth } = require("@/firebaseConfig");
                    signOut(auth).then(() => {
                        router.replace('/signin?expired=true');
                    });
                } else {
                    router.replace('/change-password');
                }
            } else if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
                router.replace('/unauthorized');
            } else if (requiredPermission && !hasPermission(requiredPermission)) {
                router.replace('/unauthorized');
            }
        }
    }, [user, profile, loading, allowedRoles, requiredPermission, router, mfaVerified, hasPermission]);

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (!user) return null;

    if (!mfaVerified) return null;

    if (profile && profile.tempPasswordActive) {
        return null;
    }

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return null;
    }

    return <>{children}</>;
}
