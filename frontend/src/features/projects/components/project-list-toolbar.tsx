'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type {
  ProjectListStatusFilter,
  ProjectPriority,
  ProjectSortField,
  SortDirection,
} from '@/features/projects/types';

interface FilterOption {
  readonly id: string;
  readonly label: string;
}

interface ProjectListToolbarProps {
  search: string;
  statusFilter: ProjectListStatusFilter;
  ownerFilter: string;
  clientFilter: string;
  departmentFilter: string;
  priorityFilter: ProjectPriority | 'all';
  ownerOptions: readonly FilterOption[];
  clientOptions: readonly FilterOption[];
  departmentOptions: readonly FilterOption[];
  sortField: ProjectSortField;
  sortDirection: SortDirection;
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ProjectListStatusFilter) => void;
  onOwnerFilterChange: (value: string) => void;
  onClientFilterChange: (value: string) => void;
  onDepartmentFilterChange: (value: string) => void;
  onPriorityFilterChange: (value: ProjectPriority | 'all') => void;
  onSortFieldChange: (value: ProjectSortField) => void;
  onSortDirectionToggle: () => void;
  onRefresh: () => void;
}

export function ProjectListToolbar({
  search,
  statusFilter,
  ownerFilter,
  clientFilter,
  departmentFilter,
  priorityFilter,
  ownerOptions,
  clientOptions,
  departmentOptions,
  sortField,
  sortDirection,
  isRefreshing,
  onSearchChange,
  onStatusFilterChange,
  onOwnerFilterChange,
  onClientFilterChange,
  onDepartmentFilterChange,
  onPriorityFilterChange,
  onSortFieldChange,
  onSortDirectionToggle,
  onRefresh,
}: ProjectListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value);
            }}
            aria-label="Search projects"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            label="Sort by"
            value={sortField}
            onChange={(event) => {
              onSortFieldChange(event.target.value as ProjectSortField);
            }}
            className="min-w-[160px]"
          >
            <option value="name">Project Name</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="targetEndDate">Target End Date</option>
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Created</option>
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
            aria-label="Refresh project list"
          >
            <RefreshCw className={isRefreshing ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          label="Status filter"
          value={statusFilter}
          onChange={(event) => {
            onStatusFilterChange(event.target.value as ProjectListStatusFilter);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="INVOICE_READY">Invoice Ready</option>
          <option value="CANCELLED">Cancelled</option>
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
          {ownerOptions.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Client filter"
          value={clientFilter}
          onChange={(event) => {
            onClientFilterChange(event.target.value);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All clients</option>
          {clientOptions.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Department filter"
          value={departmentFilter}
          onChange={(event) => {
            onDepartmentFilterChange(event.target.value);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All departments</option>
          {departmentOptions.map((department) => (
            <option key={department.id} value={department.id}>
              {department.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Priority filter"
          value={priorityFilter}
          onChange={(event) => {
            onPriorityFilterChange(event.target.value as ProjectPriority | 'all');
          }}
          className="min-w-[160px]"
        >
          <option value="all">All priorities</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </NativeSelect>
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
