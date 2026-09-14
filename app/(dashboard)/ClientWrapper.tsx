"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import Backdrop from "@/layout/Backdrop";
import AppSidebar from "@/layout/AppSidebar";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangleIcon } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { FirestoreService } from "@/services/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import SupportChatWidget from "@/components/common/SupportChatWidget";

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isImpersonating, profile, stopImpersonation } = useAuth();
  const [sysConfig, setSysConfig] = useState<{ cmsName?: string, cmsVersion?: string }>({
    cmsName: 'Digital Maples Labs CMS',
    cmsVersion: '1.3.0'
  });

  useEffect(() => {
    const fetchSysConfig = async () => {
      try {
        const data = await FirestoreService.getSettings('system_global', 'config');
        if (data) {
          setSysConfig(data);
        }
      } catch (err) {
        console.error('Error fetching global config:', err);
      }
    };
    fetchSysConfig();
  }, []);

  return (
    <div className="min-h-screen xl:flex flex-col">
      {isImpersonating && (
        <div className="sticky top-0 z-[60] bg-blue-600 text-white px-4 py-3 shadow-lg flex items-center justify-between">
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

      <div className="xl:flex flex-1">
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
            } ${isMobileOpen ? "ml-0" : ""}`}
        >
          <AppHeader />
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            {children}
          </div>
          <footer className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {sysConfig.cmsName} {sysConfig.cmsVersion}
          </footer>
        </div>
      </div>
      <SupportChatWidget />
    </div>
  );
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
