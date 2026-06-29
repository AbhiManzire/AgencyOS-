'use client';

import { ListTodo, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteSubtaskDialog } from '@/features/tasks/subtasks/components/delete-subtask-dialog';
import {
  SubtaskFormDrawer,
  toCreateSubtaskPayload,
  toUpdateSubtaskPayload,
} from '@/features/tasks/subtasks/components/subtask-form-drawer';
import { TaskSubtasksTable } from '@/features/tasks/subtasks/components/task-subtasks-table';
import { useCreateSubtask } from '@/features/tasks/subtasks/hooks/use-create-subtask';
import { useDeleteSubtask } from '@/features/tasks/subtasks/hooks/use-delete-subtask';
import { useTaskSubtasks } from '@/features/tasks/subtasks/hooks/use-task-subtasks';
import { useUpdateSubtask } from '@/features/tasks/subtasks/hooks/use-update-subtask';
import type { SubtaskFormValues } from '@/features/tasks/subtasks/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface TaskSubtasksTabProps {
  readonly taskId: string;
  readonly projectId: string;
  readonly readOnly?: boolean;
}

export function TaskSubtasksTab({ taskId, projectId, readOnly = false }: TaskSubtasksTabProps) {
  const { showToast } = useToast();
  const { data: subtasks = [], isLoading, error, refetch } = useTaskSubtasks(taskId);
  const { mutateAsync: createSubtask, isPending: isCreating } = useCreateSubtask(taskId);
  const { mutateAsync: updateSubtask, isPending: isUpdating } = useUpdateSubtask(taskId);
  const { mutateAsync: deleteSubtask, isPending: isDeleting } = useDeleteSubtask(taskId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  const [deleteSubtaskId, setDeleteSubtaskId] = useState<string | null>(null);

  const activeSubtask = useMemo(
    () => subtasks.find((subtask) => subtask.id === activeSubtaskId),
    [activeSubtaskId, subtasks],
  );

  const deleteSubtaskTitle = useMemo(() => {
    const subtask = subtasks.find((item) => item.id === deleteSubtaskId);
    return subtask?.title ?? 'this subtask';
  }, [deleteSubtaskId, subtasks]);

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveSubtaskId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (subtaskId: string): void => {
    setDrawerMode('edit');
    setActiveSubtaskId(subtaskId);
    setDrawerOpen(true);
  };

  const handleSave = async (values: SubtaskFormValues, mode: 'create' | 'edit'): Promise<void> => {
    if (mode === 'edit' && activeSubtaskId !== null) {
      await updateSubtask({
        subtaskId: activeSubtaskId,
        payload: toUpdateSubtaskPayload(values),
      });
      return;
    }

    await createSubtask(toCreateSubtaskPayload(values));
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteSubtaskId === null) {
      return;
    }

    try {
      await deleteSubtask(deleteSubtaskId);
      showToast('Subtask deleted successfully');
      setDeleteSubtaskId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading subtasks..." />;
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Subtasks</h2>
          <p className="text-sm text-muted-foreground">Break this task into smaller work items.</p>
        </div>
        {!readOnly ? (
          <Button type="button" className="gap-2" onClick={openCreateDrawer}>
            <Plus className="size-4" />
            Add Subtask
          </Button>
        ) : null}
      </div>

      {subtasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No subtasks yet"
          description="Add the first subtask to track smaller pieces of work."
          action={
            readOnly ? undefined : (
              <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                <Plus className="size-4" />
                Add Subtask
              </Button>
            )
          }
        />
      ) : (
        <TaskSubtasksTable
          subtasks={subtasks}
          readOnly={readOnly}
          onEditSubtask={openEditDrawer}
          onDeleteSubtask={setDeleteSubtaskId}
        />
      )}

      <SubtaskFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        projectId={projectId}
        subtask={activeSubtask}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteSubtaskDialog
        open={deleteSubtaskId !== null}
        subtaskTitle={deleteSubtaskTitle}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteSubtaskId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
