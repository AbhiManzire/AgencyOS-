'use client';

import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  useToast,
} from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import {
  useCreateTaskChecklistItem,
  useDeleteTaskChecklistItem,
  useTaskChecklist,
  useUpdateTaskChecklistItem,
} from '@/features/tasks/checklist/hooks/use-task-checklist';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { cn } from '@/lib/utils';

interface TaskChecklistPanelProps {
  readonly taskId: string;
  readonly readOnly?: boolean;
}

export function TaskChecklistPanel({ taskId, readOnly = false }: TaskChecklistPanelProps) {
  const { showToast } = useToast();
  const { data: items = [], isLoading, error, refetch } = useTaskChecklist(taskId);
  const { mutateAsync: createItem, isPending: isCreating } = useCreateTaskChecklistItem(taskId);
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateTaskChecklistItem(taskId);
  const { mutateAsync: deleteItem, isPending: isDeleting } = useDeleteTaskChecklistItem(taskId);
  const [title, setTitle] = useState('');

  const handleAdd = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      return;
    }

    try {
      await createItem({ title: trimmed, sortOrder: items.length });
      setTitle('');
      showToast('Checklist item added');
    } catch (createError) {
      showToast(extractApiErrorMessage(createError), 'error');
    }
  };

  const handleToggle = async (itemId: string, isCompleted: boolean): Promise<void> => {
    try {
      await updateItem({ itemId, payload: { isCompleted: !isCompleted } });
    } catch (toggleError) {
      showToast(extractApiErrorMessage(toggleError), 'error');
    }
  };

  const handleDelete = async (itemId: string): Promise<void> => {
    try {
      await deleteItem(itemId);
      showToast('Checklist item removed');
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading checklist..." />;
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

  const completedCount = items.filter((item) => item.isCompleted).length;
  const isBusy = isCreating || isUpdating || isDeleting;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Checklist</CardTitle>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{items.length} done
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title="No checklist items"
            description="Break this task into smaller steps."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  disabled={readOnly || isBusy}
                  onChange={() => {
                    void handleToggle(item.id, item.isCompleted);
                  }}
                  className="size-4"
                  aria-label={`Mark ${item.title} ${item.isCompleted ? 'incomplete' : 'complete'}`}
                />
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.isCompleted && 'text-muted-foreground line-through',
                  )}
                >
                  {item.title}
                </span>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isBusy}
                    onClick={() => {
                      void handleDelete(item.id);
                    }}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {!readOnly ? (
          <form className="flex gap-2" onSubmit={(event) => void handleAdd(event)}>
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
              }}
              placeholder="Add checklist item"
              disabled={isBusy}
            />
            <Button type="submit" disabled={isBusy || title.trim().length === 0} className="gap-2">
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
