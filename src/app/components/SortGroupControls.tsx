import React from 'react';
import { ArrowUpDown, ListFilter, Check } from 'lucide-react';
import { IconButton } from './IconButton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

interface Props {
  groupByOptions: { label: string; value: string }[];
  sortByOptions: { label: string; value: string }[];
  currentGroup: string;
  currentSort: string;
  onGroupChange: (val: string) => void;
  onSortChange: (val: string) => void;
}

export function SortGroupControls({
  groupByOptions,
  sortByOptions,
  currentGroup,
  currentSort,
  onGroupChange,
  onSortChange
}: Props) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span>
            <IconButton title="Group by">
              <ListFilter size={14} />
            </IconButton>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a1c1e] border-[rgba(255,255,255,0.1)] min-w-[160px]">
          {groupByOptions.map(opt => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onGroupChange(opt.value)}
              className="flex items-center justify-between text-[12px] text-[#d0d6e0] hover:text-[#f7f8f8] cursor-pointer"
            >
              <span>{opt.label}</span>
              {currentGroup === opt.value && <Check size={12} className="text-[#10b981]" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span>
            <IconButton title="Sort by">
              <ArrowUpDown size={14} />
            </IconButton>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1a1c1e] border-[rgba(255,255,255,0.1)] min-w-[180px]">
          {sortByOptions.map(opt => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className="flex items-center justify-between text-[12px] text-[#d0d6e0] hover:text-[#f7f8f8] cursor-pointer"
            >
              <span>{opt.label}</span>
              {currentSort === opt.value && <Check size={12} className="text-[#10b981]" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
