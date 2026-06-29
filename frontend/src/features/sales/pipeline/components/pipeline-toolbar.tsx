'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

export interface OwnerFilterOption {
  readonly id: string;
  readonly label: string;
}

interface PipelineToolbarProps {
  readonly search: string;
  readonly ownerFilter: string;
  readonly ownerOptions: readonly OwnerFilterOption[];
  readonly onSearchChange: (value: string) => void;
  readonly onOwnerFilterChange: (value: string) => void;
}

export function PipelineToolbar({
  search,
  ownerFilter,
  ownerOptions,
  onSearchChange,
  onOwnerFilterChange,
}: PipelineToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search deals..."
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          aria-label="Search deals"
          className="pl-9"
        />
      </div>

      <NativeSelect
        label="Owner filter"
        value={ownerFilter}
        onChange={(event) => {
          onOwnerFilterChange(event.target.value);
        }}
        className="min-w-[160px]"
      >
        <option value="all">All owners</option>
        <option value="unassigned">Unassigned</option>
        {ownerOptions.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
