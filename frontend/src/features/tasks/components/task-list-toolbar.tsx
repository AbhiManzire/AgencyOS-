'use client';

import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { TaskListPriorityFilter, TaskListStatusFilter } from '@/features/tasks/types';

export interface AssigneeFilterOption {
  readonly id: string;
  readonly label: string;
}

interface TaskListToolbarProps {
  search: string;
  statusFilter: TaskListStatusFilter;
  priorityFilter: TaskListPriorityFilter;
  assigneeFilter: string;
  assigneeOptions: readonly AssigneeFilterOption[];
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: TaskListStatusFilter) => void;
  onPriorityFilterChange: (value: TaskListPriorityFilter) => void;
  onAssigneeFilterChange: (value: string) => void;
  onRefresh: () => void;
}

export function TaskListToolbar({
  search,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  assigneeOptions,
  isRefreshing,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onAssigneeFilterChange,
  onRefresh,
}: TaskListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
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

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          label="Status filter"
          value={statusFilter}
          onChange={(event) => {
            onStatusFilterChange(event.target.value as TaskListStatusFilter);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
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
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
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
          <option value="unassigned">Unassigned</option>
          {assigneeOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh task list"
        >
          <RefreshCw className={isRefreshing ? 'size-4 animate-spin' : 'size-4'} />
        </Button>
      </div>
    </div>
  );
}
