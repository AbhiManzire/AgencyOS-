'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { LeadSortField, SortDirection } from '@/features/sales/leads/types';
import {
  LEAD_PRIORITY_LABELS,
  LEAD_SOURCE_LABELS,
} from '@/features/sales/leads/utils/lead-display';

export interface LeadOwnerFilterOption {
  readonly id: string;
  readonly label: string;
}

interface LeadListToolbarProps {
  search: string;
  statusFilter: string;
  sourceFilter: string;
  priorityFilter: string;
  assignedFilter: string;
  sortField: LeadSortField;
  sortDirection: SortDirection;
  owners: readonly LeadOwnerFilterOption[];
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSourceFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: string) => void;
  onAssignedFilterChange: (value: string) => void;
  onSortFieldChange: (value: LeadSortField) => void;
  onSortDirectionToggle: () => void;
  onRefresh: () => void;
}

export function LeadListToolbar({
  search,
  statusFilter,
  sourceFilter,
  priorityFilter,
  assignedFilter,
  sortField,
  sortDirection,
  owners,
  isRefreshing,
  onSearchChange,
  onStatusFilterChange,
  onSourceFilterChange,
  onPriorityFilterChange,
  onAssignedFilterChange,
  onSortFieldChange,
  onSortDirectionToggle,
  onRefresh,
}: LeadListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search leads..."
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          aria-label="Search leads"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          label="Status filter"
          value={statusFilter}
          onChange={(event) => {
            onStatusFilterChange(event.target.value);
          }}
          className="min-w-[140px]"
        >
          <option value="all">All statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="DISQUALIFIED">Disqualified</option>
          <option value="CONVERTED">Converted</option>
          <option value="archived">Archived</option>
        </NativeSelect>

        <NativeSelect
          label="Source filter"
          value={sourceFilter}
          onChange={(event) => {
            onSourceFilterChange(event.target.value);
          }}
          className="min-w-[140px]"
        >
          <option value="all">All sources</option>
          {(Object.keys(LEAD_SOURCE_LABELS) as (keyof typeof LEAD_SOURCE_LABELS)[]).map((key) => (
            <option key={key} value={key}>
              {LEAD_SOURCE_LABELS[key]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Priority filter"
          value={priorityFilter}
          onChange={(event) => {
            onPriorityFilterChange(event.target.value);
          }}
          className="min-w-[130px]"
        >
          <option value="all">All priorities</option>
          {(Object.keys(LEAD_PRIORITY_LABELS) as (keyof typeof LEAD_PRIORITY_LABELS)[]).map(
            (key) => (
              <option key={key} value={key}>
                {LEAD_PRIORITY_LABELS[key]}
              </option>
            ),
          )}
        </NativeSelect>

        <NativeSelect
          label="Assignee filter"
          value={assignedFilter}
          onChange={(event) => {
            onAssignedFilterChange(event.target.value);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All assignees</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Sort by"
          value={sortField}
          onChange={(event) => {
            onSortFieldChange(event.target.value as LeadSortField);
          }}
          className="min-w-[140px]"
        >
          <option value="updatedAt">Updated</option>
          <option value="createdAt">Created</option>
          <option value="company">Company</option>
          <option value="leadScore">Score</option>
          <option value="priority">Priority</option>
        </NativeSelect>

        <Button
          variant="outline"
          size="icon"
          onClick={onSortDirectionToggle}
          aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          {sortDirection === 'asc' ? (
            <ArrowUp className="size-4" />
          ) : (
            <ArrowDown className="size-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh lead list"
        >
          <RefreshCw className={isRefreshing ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      </div>
    </div>
  );
}

export function SortIndicator({ direction }: { direction: SortDirection | null }) {
  if (direction === 'asc') {
    return <ArrowUp className="ml-1 inline size-3.5" aria-hidden="true" />;
  }

  if (direction === 'desc') {
    return <ArrowDown className="ml-1 inline size-3.5" aria-hidden="true" />;
  }

  return <ArrowUpDown className="ml-1 inline size-3.5 opacity-40" aria-hidden="true" />;
}
