import React, { ReactNode } from 'react';
import { Search } from 'lucide-react';
import Input from '@/components/form/input/InputField';

export interface TableControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode; // For extra filters like dropdowns
}

export default function TableControls({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Search...",
  children
}: TableControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      <div className="w-full sm:max-w-xs relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 w-full"
        />
      </div>
      
      {children && (
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
