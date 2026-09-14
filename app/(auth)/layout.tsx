"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, mfaVerified } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user) {
      if (pathname === '/reset-password' || pathname === '/change-password') return;
      if (!mfaVerified && (pathname === '/mfa-enroll' || pathname === '/mfa-verify')) return;
      
      if (pathname !== '/' && !pathname.startsWith('/cms')) {
         router.replace("/");
      }
    }
  }, [user, loading, router, pathname, mfaVerified]);

  if (loading) return null;
  
  if (user) {
     if (pathname === '/reset-password' || pathname === '/change-password') {
        // Allowed
     } else if (!mfaVerified && (pathname === '/mfa-enroll' || pathname === '/mfa-verify')) {
        // Allowed
     } else {
        return null; // Will redirect
     }
  }

  return <>{children}</>;
}
