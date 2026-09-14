"use client";

import dynamic from "next/dynamic";
import React from "react";

const DashboardContent = dynamic(() => import("./DashboardContent"), { 
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>
});

export default function DashboardPage() {
  return <DashboardContent />;
}
