'use client';

import Link from 'next/link';
import { useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { Body, Caption } from '@/design-system/typography';
import { TaskStatusBadge } from '@/features/tasks/components/task-status-badge';
import {
  useCreateTaskDependency,
  useDeleteTaskDependency,
  useTaskDependencies,
} from '@/features/tasks/hooks/use-task-dependencies';
import { useTasks } from '@/features/tasks/hooks/use-tasks';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface TaskDependenciesPanelProps {
  readonly taskId: string;
  readonly projectId: string;
  readonly readOnly?: boolean;
}

export function TaskDependenciesPanel({
  taskId,
  projectId,
  readOnly = false,
}: TaskDependenciesPanelProps) {
  const { showToast } = useToast();
  const [dependsOnTaskId, setDependsOnTaskId] = useState('');
  const { data: dependencies = [], isLoading, error, refetch } = useTaskDependencies(taskId);
  const { data: projectTasks } = useTasks({ projectId, take: 100 });
  const { mutateAsync: createDependency, isPending: isCreating } = useCreateTaskDependency(taskId);
  const { mutateAsync: removeDependency, isPending: isRemoving } = useDeleteTaskDependency(taskId);

  const blockedByIds = useMemo(
    () => new Set(dependencies.map((dependency) => dependency.dependsOnTaskId)),
    [dependencies],
  );

  const candidateTasks = useMemo(() => {
    if (!projectTasks) {
      return [];
    }

    return projectTasks.items
      .filter((task) => task.id !== taskId && !blockedByIds.has(task.id) && task.deletedAt === null)
      .map((task) => ({
        id: task.id,
        label: task.code ? `${task.code} — ${task.title}` : task.title,
      }))
      .sort((left, right) =>
        left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
      );
  }, [blockedByIds, projectTasks, taskId]);

  const handleAdd = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (dependsOnTaskId.length === 0) {
      return;
    }

    try {
      await createDependency({ dependsOnTaskId });
      setDependsOnTaskId('');
      showToast('Dependency added');
    } catch (createError) {
      showToast(extractApiErrorMessage(createError), 'error');
    }
  };

  const handleRemove = async (dependencyId: string): Promise<void> => {
    try {
      await removeDependency(dependencyId);
      showToast('Dependency removed');
    } catch (removeError) {
      showToast(extractApiErrorMessage(removeError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading dependencies..." />;
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

  return (
    <div className="space-y-4">
      {dependencies.length === 0 ? (
        <EmptyState
          title="No blockers"
          description="This task is not blocked by any other tasks."
        />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {dependencies.map((dependency) => (
            <li key={dependency.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/tasks/${dependency.dependsOnTaskId}`}
                  className="truncate font-medium text-foreground hover:underline"
                >
                  {dependency.dependsOnTitle}
                </Link>
                <div className="flex items-center gap-2">
                  <Caption>Blocked by</Caption>
                  <TaskStatusBadge status={dependency.dependsOnStatus} />
                </div>
              </div>
              {readOnly ? null : (
                <Can permission="tasks.update" mode="hide">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRemoving}
                    onClick={() => {
                      void handleRemove(dependency.id);
                    }}
                  >
                    Remove
                  </Button>
                </Can>
              )}
            </li>
          ))}
        </ul>
      )}

      {readOnly ? null : (
        <Can permission="tasks.update" mode="hide">
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => void handleAdd(event)}
          >
            <div className="min-w-[16rem] flex-1 space-y-1">
              <Caption className="block">Add blocked-by task</Caption>
              <NativeSelect
                label="Depends on task"
                value={dependsOnTaskId}
                disabled={isCreating || candidateTasks.length === 0}
                onChange={(event) => {
                  setDependsOnTaskId(event.target.value);
                }}
              >
                <option value="">
                  {candidateTasks.length === 0 ? 'No eligible tasks' : 'Select a task'}
                </option>
                {candidateTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={isCreating || dependsOnTaskId.length === 0}
            >
              Add
            </Button>
          </form>
          {candidateTasks.length === 0 ? (
            <Body className="text-muted-foreground">
              No other active tasks in this project are available to add.
            </Body>
          ) : null}
        </Can>
      )}
    </div>
  );
}
