"use client";

import { useMemo } from "react";
import dynamic from 'next/dynamic';
const CountryMap = dynamic(() => import("./CountryMap"), { ssr: false }); // Hiding map for now or keeping static

interface DemographicCardProps {
  data?: any;
}

export default function DemographicCard({ data }: DemographicCardProps) {

  const countries = useMemo(() => {
    if (!data?.rows) return [];

    const totalUsers = data.rows.reduce((acc: number, row: any) => acc + parseInt(row.metricValues[0].value, 10), 0);

    return data.rows.map((row: any) => {
      const name = row.dimensionValues[0].value; // Country name
      const count = parseInt(row.metricValues[0].value, 10);
      const percentage = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
      return { name, count, percentage };
    });
  }, [data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Active users by country (Top 5)
          </p>
        </div>
      </div>

      {/* <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div className="mapOne map-btn -mx-4 -my-6 h-[212px] w-full">
          <CountryMap />
        </div>
      </div> */}

      <div className="space-y-5">
        {countries.length > 0 ? (
          countries.map((country: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Placeholder Logic for Flag or just initial if no svg */}
                {/* <div className="items-center w-full rounded-full max-w-8">
                        <img src={`./images/country/${country.name.toLowerCase()}.svg`} alt={country.name} />
                    </div> */}
                <div>
                  <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {country.name}
                  </p>
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {country.count.toLocaleString()} Users
                  </span>
                </div>
              </div>

              <div className="flex w-full max-w-[140px] items-center gap-3">
                <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                  <div
                    className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                    style={{ width: `${country.percentage}%` }}
                  ></div>
                </div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {country.percentage}%
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">No demographic data available</div>
        )}
      </div>
    </div>
  );
}
