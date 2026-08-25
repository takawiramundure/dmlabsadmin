"use client";

import {
  BoxIconLine,
  GroupIcon,
} from "@/icons";
// import Badge from "../ui/badge/Badge";

interface EcommerceMetricsProps {
  data?: any;
  engagement?: any;
}

export default function EcommerceMetrics({ data, engagement }: EcommerceMetricsProps) {
  // Parse GA4 data rows: [activeUsers, sessions, screenPageViews]
  // data.rows[0].metricValues[0].value

  const activeUsers = data?.rows?.[0]?.metricValues?.[0]?.value || '0';
  const sessions = data?.rows?.[0]?.metricValues?.[1]?.value || '0';
  const views = data?.rows?.[0]?.metricValues?.[2]?.value || '0';

  // Parse Engagement: [averageSessionDuration, engagementRate]
  // Duration is in seconds
  const avgDurationSeconds = parseFloat(engagement?.rows?.[0]?.metricValues?.[0]?.value || '0');
  const avgDurationMinutes = (avgDurationSeconds / 60).toFixed(1);
  const engagementRate = (parseFloat(engagement?.rows?.[0]?.metricValues?.[1]?.value || '0') * 100).toFixed(1);


  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-5 dark:text-white/90" />
        </div>

        <div className="mt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Active Users
          </span>
          <h4 className="mt-1 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {parseInt(activeUsers).toLocaleString()}
          </h4>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-5 dark:text-white/90" />
        </div>
        <div className="mt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Sessions
          </span>
          <h4 className="mt-1 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {parseInt(sessions).toLocaleString()}
          </h4>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-5 dark:text-white/90" />
        </div>
        <div className="mt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page Views
          </span>
          <h4 className="mt-1 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {parseInt(views).toLocaleString()}
          </h4>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
          <svg className="text-gray-800 size-5 dark:text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="mt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Avg. Session
          </span>
          <h4 className="mt-1 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {avgDurationMinutes}m
          </h4>
          {/* <div className="text-xs text-gray-400">Rate: {engagementRate}%</div> */}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
