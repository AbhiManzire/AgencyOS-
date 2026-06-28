'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { ClientSortField, SortDirection } from '@/features/clients/types';

interface ClientListToolbarProps {
  search: string;
  statusFilter: string;
  ownerFilter: string;
  sortField: ClientSortField;
  sortDirection: SortDirection;
  owners: readonly string[];
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onOwnerFilterChange: (value: string) => void;
  onSortFieldChange: (value: ClientSortField) => void;
  onSortDirectionToggle: () => void;
  onRefresh: () => void;
}

export function ClientListToolbar({
  search,
  statusFilter,
  ownerFilter,
  sortField,
  sortDirection,
  owners,
  isRefreshing,
  onSearchChange,
  onStatusFilterChange,
  onOwnerFilterChange,
  onSortFieldChange,
  onSortDirectionToggle,
  onRefresh,
}: ClientListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          aria-label="Search clients"
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
          <option value="all">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PROSPECT">Prospect</option>
          <option value="archived">Archived</option>
        </NativeSelect>

        <NativeSelect
          label="Owner filter"
          value={ownerFilter}
          onChange={(event) => {
            onOwnerFilterChange(event.target.value);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All owners</option>
          {owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Sort by"
          value={sortField}
          onChange={(event) => {
            onSortFieldChange(event.target.value as ClientSortField);
          }}
          className="min-w-[160px]"
        >
          <option value="displayName">Client Name</option>
          <option value="company">Company</option>
          <option value="status">Status</option>
          <option value="owner">Owner</option>
          <option value="email">Email</option>
          <option value="createdAt">Created Date</option>
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
          aria-label="Refresh client list"
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
