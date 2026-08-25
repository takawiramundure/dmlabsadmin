"use client";

import dynamic from "next/dynamic";
import React from "react";

const AnalyticsPageContent = dynamic(() => import("./AnalyticsPageContent"), { 
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-500">Loading Analytics...</div>
});

export default function AnalyticsPage() {
  return <AnalyticsPageContent />;
}
