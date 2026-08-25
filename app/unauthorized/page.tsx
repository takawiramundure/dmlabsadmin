"use client";

import dynamic from "next/dynamic";
import { AlertTriangleIcon } from "lucide-react";

const UnauthorizedContent = dynamic(() => Promise.resolve(() => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangleIcon className="w-10 h-10 text-red-600 dark:text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Access Denied</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        You don't have permission to access this page. Please contact an administrator if you believe this is a mistake.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/" className="px-6 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors shadow-sm">
          Return to Dashboard
        </a>
      </div>
    </div>
  </div>
)), { ssr: false });

export default function Unauthorized() {
  return <UnauthorizedContent />;
}
