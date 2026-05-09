import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUpDown, ListFilter, ToggleRight, ToggleLeft } from 'lucide-react';
import { IconButton } from './IconButton';
import { DropdownPanel } from './ui/DropdownPanel';
import { DropdownSection } from './ui/DropdownSection';
import { DropdownItem } from './ui/DropdownItem';

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
  const [groupOpen, setGroupOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const handleGroupOutside = useCallback((e: MouseEvent) => {
    if (groupRef.current && !groupRef.current.contains(e.target as Node)) setGroupOpen(false);
  }, []);

  const handleSortOutside = useCallback((e: MouseEvent) => {
    if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
  }, []);

  useEffect(() => {
    if (groupOpen) {
      document.addEventListener('mousedown', handleGroupOutside);
      return () => document.removeEventListener('mousedown', handleGroupOutside);
    }
  }, [groupOpen, handleGroupOutside]);

  useEffect(() => {
    if (sortOpen) {
      document.addEventListener('mousedown', handleSortOutside);
      return () => document.removeEventListener('mousedown', handleSortOutside);
    }
  }, [sortOpen, handleSortOutside]);

  return (
    <>
      <div className="relative" ref={groupRef}>
        <IconButton title="Group by" onClick={() => setGroupOpen(prev => !prev)}>
          <ListFilter size={14} />
        </IconButton>

        <DropdownPanel isOpen={groupOpen} position="below" align="end">
          <DropdownSection label="GROUP">
            {groupByOptions.map(opt => (
              <DropdownItem
                key={opt.value}
                icon={<ListFilter size={16} />}
                label={opt.label}
                right={
                  currentGroup === opt.value
                    ? <ToggleRight size={16} className="text-status-success" />
                    : <ToggleLeft size={16} className="text-text-quaternary" />
                }
                onClick={() => { onGroupChange(opt.value); setGroupOpen(false); }}
              />
            ))}
          </DropdownSection>
        </DropdownPanel>
      </div>

      <div className="relative" ref={sortRef}>
        <IconButton title="Sort by" onClick={() => setSortOpen(prev => !prev)}>
          <ArrowUpDown size={14} />
        </IconButton>

        <DropdownPanel isOpen={sortOpen} position="below" align="end">
          <DropdownSection label="SORT">
            {sortByOptions.map(opt => (
              <DropdownItem
                key={opt.value}
                icon={<ArrowUpDown size={16} />}
                label={opt.label}
                right={
                  currentSort === opt.value
                    ? <ToggleRight size={16} className="text-status-success" />
                    : <ToggleLeft size={16} className="text-text-quaternary" />
                }
                onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
              />
            ))}
          </DropdownSection>
        </DropdownPanel>
      </div>
    </>
  );
}
