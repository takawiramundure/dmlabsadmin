import { useState, useMemo } from 'react';

export interface UseDataTableProps<T> {
  data: T[];
  searchKeys?: (keyof T)[];
  initialSortKey?: keyof T;
  initialSortDirection?: 'asc' | 'desc';
  initialPageSize?: number;
}

export function useDataTable<T>({
  data,
  searchKeys = [],
  initialSortKey,
  initialSortDirection = 'asc',
  initialPageSize = 10,
}: UseDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | undefined>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // 1. Search Filtering
  const searchedData = useMemo(() => {
    if (!searchQuery.trim() || searchKeys.length === 0) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key];
        if (typeof val === 'string') {
          return val.toLowerCase().includes(query);
        }
        if (typeof val === 'number') {
          return val.toString().includes(query);
        }
        if (Array.isArray(val)) {
          return val.some(v => typeof v === 'string' && v.toLowerCase().includes(query));
        }
        return false;
      });
    });
  }, [data, searchQuery, searchKeys]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return searchedData;

    return [...searchedData].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Handle strings
      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      // Handle numbers or dates
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchedData, sortKey, sortDirection]);

  // 3. Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ensure current page is valid after data changes
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  // Handlers
  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => goToPage(validCurrentPage + 1);
  const prevPage = () => goToPage(validCurrentPage - 1);

  return {
    // Data
    currentData: paginatedData,
    totalItems,
    
    // Pagination
    currentPage: validCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    
    // Sort
    sortKey,
    sortDirection,
    handleSort,
    
    // Search
    searchQuery,
    setSearchQuery,
  };
}
