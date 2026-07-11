'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { STATUS_LABELS } from '@/features/tasks/components/task-status-badge';
import { PRIORITY_LABELS } from '@/features/tasks/components/task-priority-badge';
import type {
  SortDirection,
  TaskListArchivedFilter,
  TaskListDueFilter,
  TaskListPriorityFilter,
  TaskListStatusFilter,
  TaskSortField,
} from '@/features/tasks/types';

export interface FilterOption {
  readonly id: string;
  readonly label: string;
}

interface TaskListToolbarProps {
  search: string;
  statusFilter: TaskListStatusFilter;
  priorityFilter: TaskListPriorityFilter;
  projectFilter: string;
  assigneeFilter: string;
  reporterFilter: string;
  archivedFilter: TaskListArchivedFilter;
  dueFilter: TaskListDueFilter;
  sortField: TaskSortField;
  sortDirection: SortDirection;
  projectOptions: readonly FilterOption[];
  assigneeOptions: readonly FilterOption[];
  reporterOptions: readonly FilterOption[];
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: TaskListStatusFilter) => void;
  onPriorityFilterChange: (value: TaskListPriorityFilter) => void;
  onProjectFilterChange: (value: string) => void;
  onAssigneeFilterChange: (value: string) => void;
  onReporterFilterChange: (value: string) => void;
  onArchivedFilterChange: (value: TaskListArchivedFilter) => void;
  onDueFilterChange: (value: TaskListDueFilter) => void;
  onSortFieldChange: (value: TaskSortField) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onRefresh: () => void;
}

const STATUS_FILTER_OPTIONS: readonly TaskListStatusFilter[] = [
  'all',
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
];

export function TaskListToolbar({
  search,
  statusFilter,
  priorityFilter,
  projectFilter,
  assigneeFilter,
  reporterFilter,
  archivedFilter,
  dueFilter,
  sortField,
  sortDirection,
  projectOptions,
  assigneeOptions,
  reporterOptions,
  isRefreshing,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onProjectFilterChange,
  onAssigneeFilterChange,
  onReporterFilterChange,
  onArchivedFilterChange,
  onDueFilterChange,
  onSortFieldChange,
  onSortDirectionChange,
  onRefresh,
}: TaskListToolbarProps) {
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
            placeholder="Search tasks..."
            value={search}
            onChange={(event) => {
              onSearchChange(event.target.value);
            }}
            aria-label="Search tasks"
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh task list"
          className="shrink-0 self-end lg:self-auto"
        >
          <RefreshCw className={isRefreshing ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          label="Project filter"
          value={projectFilter}
          onChange={(event) => {
            onProjectFilterChange(event.target.value);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All projects</option>
          {projectOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Status filter"
          value={statusFilter}
          onChange={(event) => {
            onStatusFilterChange(event.target.value as TaskListStatusFilter);
          }}
          className="min-w-[160px]"
        >
          {STATUS_FILTER_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === 'all' ? 'All statuses' : STATUS_LABELS[status]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Priority filter"
          value={priorityFilter}
          onChange={(event) => {
            onPriorityFilterChange(event.target.value as TaskListPriorityFilter);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All priorities</option>
          {(Object.keys(PRIORITY_LABELS) as (keyof typeof PRIORITY_LABELS)[]).map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Assignee filter"
          value={assigneeFilter}
          onChange={(event) => {
            onAssigneeFilterChange(event.target.value);
          }}
          className="min-w-[180px]"
        >
          <option value="all">All assignees</option>
          {assigneeOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Reporter filter"
          value={reporterFilter}
          onChange={(event) => {
            onReporterFilterChange(event.target.value);
          }}
          className="min-w-[180px]"
        >
          <option value="all">All reporters</option>
          {reporterOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Archived filter"
          value={archivedFilter}
          onChange={(event) => {
            onArchivedFilterChange(event.target.value as TaskListArchivedFilter);
          }}
          className="min-w-[140px]"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </NativeSelect>

        <NativeSelect
          label="Due date filter"
          value={dueFilter}
          onChange={(event) => {
            onDueFilterChange(event.target.value as TaskListDueFilter);
          }}
          className="min-w-[160px]"
        >
          <option value="all">Any due date</option>
          <option value="overdue">Overdue</option>
          <option value="dueToday">Due today</option>
          <option value="dueThisWeek">Due this week</option>
        </NativeSelect>

        <NativeSelect
          label="Sort by"
          value={sortField}
          onChange={(event) => {
            onSortFieldChange(event.target.value as TaskSortField);
          }}
          className="min-w-[140px]"
        >
          <option value="updatedAt">Updated</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="title">Title</option>
          <option value="createdAt">Created</option>
        </NativeSelect>

        <NativeSelect
          label="Sort direction"
          value={sortDirection}
          onChange={(event) => {
            onSortDirectionChange(event.target.value as SortDirection);
          }}
          className="min-w-[120px]"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </NativeSelect>
      </div>
    </div>
  );
}
