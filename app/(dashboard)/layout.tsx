"use client";

import dynamic from "next/dynamic";

const ClientWrapper = dynamic(() => import("./ClientWrapper"), { 
    ssr: false, 
    loading: () => <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading Dashboard...</div> 
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClientWrapper>{children}</ClientWrapper>;
}
