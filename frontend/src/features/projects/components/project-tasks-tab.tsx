'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { TaskPriorityBadge } from '@/features/tasks/components/task-priority-badge';
import { TaskStatusBadge } from '@/features/tasks/components/task-status-badge';
import { useTasks } from '@/features/tasks/hooks/use-tasks';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ProjectTasksTabProps {
  readonly projectId: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { data, isLoading, error, refetch } = useTasks({
    projectId,
    take: 50,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  if (isLoading) {
    return <LoadingState label="Loading tasks..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const tasks = data?.items ?? [];

  if (tasks.length === 0) {
    return <EmptyState title="No tasks" description="No tasks are linked to this project yet." />;
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/tasks/${task.id}`}
              className="truncate font-medium text-foreground hover:underline"
            >
              {task.code ? `${task.code} · ${task.title}` : task.title}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
