import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/button/Button';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  setPageSize,
  nextPage,
  prevPage
}: TablePaginationProps) {
  // If there are no items, don't show pagination
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1 mt-2 border-t border-gray-100 dark:border-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className="font-medium text-gray-900 dark:text-white">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> to{' '}
        <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
        <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="text-sm border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="p-1 min-w-[32px]"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[4rem] text-center">
            {currentPage} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 min-w-[32px]"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
