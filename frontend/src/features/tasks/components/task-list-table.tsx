'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PRIORITY_LABELS,
  TaskPriorityBadge,
} from '@/features/tasks/components/task-priority-badge';
import { TaskRowActions } from '@/features/tasks/components/task-row-actions';
import { TaskStatusBadge } from '@/features/tasks/components/task-status-badge';
import { TaskTypeBadge } from '@/features/tasks/components/task-type-badge';
import type { TaskListItem } from '@/features/tasks/types';

function formatDate(isoDate: string | null): string {
  if (isoDate === null) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate));
}

interface TaskListTableProps {
  tasks: readonly TaskListItem[];
  readOnly?: boolean;
  onEditTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onRestoreTask: (taskId: string) => void;
}

export function TaskListTable({
  tasks,
  readOnly = false,
  onEditTask,
  onArchiveTask,
  onRestoreTask,
}: TaskListTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="max-h-[min(70vh,640px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="hidden xl:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Due Date</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {task.code ? `${task.code} · ${task.title}` : task.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {task.projectName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                  {task.projectName}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <TaskTypeBadge type={task.type} />
                </TableCell>
                <TableCell className="hidden max-w-[160px] truncate md:table-cell">
                  {task.assigneeName}
                </TableCell>
                <TableCell>
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(task.dueDate)}</TableCell>
                <TableCell className="text-right">
                  <TaskRowActions
                    taskId={task.id}
                    taskTitle={task.title}
                    isArchived={task.isArchived}
                    disabled={readOnly}
                    onEdit={() => {
                      onEditTask(task.id);
                    }}
                    onArchive={() => {
                      onArchiveTask(task.id);
                    }}
                    onRestore={() => {
                      onRestoreTask(task.id);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Compact card list for narrow viewports. */
export function TaskListMobileCards({
  tasks,
  readOnly = false,
  onEditTask,
  onArchiveTask,
  onRestoreTask,
}: {
  tasks: readonly TaskListItem[];
  readOnly?: boolean;
  onEditTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onRestoreTask: (taskId: string) => void;
}) {
  return (
    <div className="space-y-3 md:hidden">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-medium text-foreground">
                  {task.code ? `${task.code} · ${task.title}` : task.title}
                </p>
                <p className="text-sm text-muted-foreground">{task.projectName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={task.status} />
                <span className="text-xs text-muted-foreground">
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Assignee: {task.assigneeName}</p>
              <p className="text-sm text-muted-foreground">Due: {formatDate(task.dueDate)}</p>
            </div>
            <TaskRowActions
              taskId={task.id}
              taskTitle={task.title}
              isArchived={task.isArchived}
              disabled={readOnly}
              onEdit={() => {
                onEditTask(task.id);
              }}
              onArchive={() => {
                onArchiveTask(task.id);
              }}
              onRestore={() => {
                onRestoreTask(task.id);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
