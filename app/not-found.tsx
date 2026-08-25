"use client";

import dynamic from "next/dynamic";

const NotFoundContent = dynamic(() => Promise.resolve(() => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page Not Found</p>
      <a href="/" className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
        Return Home
      </a>
    </div>
  </div>
)), { ssr: false });

export default function NotFound() {
  return <NotFoundContent />;
}
