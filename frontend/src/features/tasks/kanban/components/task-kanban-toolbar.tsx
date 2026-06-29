'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { AssigneeFilterOption } from '@/features/tasks/components/task-list-toolbar';

interface ProjectFilterOption {
  readonly id: string;
  readonly name: string;
}

interface TaskKanbanToolbarProps {
  readonly search: string;
  readonly projectFilter: string;
  readonly assigneeFilter: string;
  readonly projectOptions: readonly ProjectFilterOption[];
  readonly assigneeOptions: readonly AssigneeFilterOption[];
  readonly onSearchChange: (value: string) => void;
  readonly onProjectFilterChange: (value: string) => void;
  readonly onAssigneeFilterChange: (value: string) => void;
}

export function TaskKanbanToolbar({
  search,
  projectFilter,
  assigneeFilter,
  projectOptions,
  assigneeOptions,
  onSearchChange,
  onProjectFilterChange,
  onAssigneeFilterChange,
}: TaskKanbanToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center">
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
          label="Project filter"
          value={projectFilter}
          onChange={(event) => {
            onProjectFilterChange(event.target.value);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All projects</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          label="Assignee filter"
          value={assigneeFilter}
          onChange={(event) => {
            onAssigneeFilterChange(event.target.value);
          }}
          className="min-w-[160px]"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {assigneeOptions.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.label}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
