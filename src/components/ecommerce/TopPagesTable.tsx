"use client";

import { useMemo } from "react";
import { useDataTable } from "@/hooks/useDataTable";
import TablePagination from "@/components/ui/table/TablePagination";
import TableControls from "@/components/ui/table/TableControls";

interface TopPagesTableProps {
    data?: any;
}

export default function TopPagesTable({ data }: TopPagesTableProps) {
    const pages = useMemo(() => {
        if (!data?.rows) return [];

        return data.rows.map((row: any) => {
            const path = row.dimensionValues[0].value;
            const title = row.dimensionValues[1].value;
            const views = parseInt(row.metricValues[0].value, 10);
            const activeUsers = parseInt(row.metricValues[1].value, 10);

            return { path, title, views, activeUsers };
        });
    }, [data]);

    const {
        currentData: paginatedPages,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
        setPageSize,
        nextPage,
        prevPage,
        searchQuery,
        setSearchQuery,
    } = useDataTable<any>({
        data: pages,
        searchKeys: ['title', 'path'],
        initialPageSize: 10
    });

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Top Pages
                    </h3>
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                        Most visited content by screen views
                    </p>
                </div>
            </div>
            
            <div className="mb-4">
                <TableControls
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchPlaceholder="Search pages..."
                />
            </div>

            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="border-b border-gray-100 dark:border-white/[0.05] text-left">
                        <tr>
                            <th className="min-w-[200px] px-2 py-3 font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                                Page Title
                            </th>
                            <th className="px-2 py-3 font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                                Views
                            </th>
                            <th className="px-2 py-3 font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                                Active Users
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {paginatedPages.length > 0 ? (
                            paginatedPages.map((page: any, index: number) => (
                                <tr key={index}>
                                    <td className="px-2 py-4">
                                        <div className="max-w-[300px]">
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                                                {page.title}
                                            </p>
                                            <span className="text-gray-500 text-theme-xs dark:text-gray-400 truncate block">
                                                {page.path}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {page.views.toLocaleString()}
                                    </td>
                                    <td className="px-2 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                                        {page.activeUsers.toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-2 py-4 text-center text-gray-500">
                                    No page data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                    nextPage={nextPage}
                    prevPage={prevPage}
                />
            </div>
        </div>
    );
}
