'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/design-system';
import type { ListTasksParams } from '@/features/tasks/api/task.types';
import { TaskKanbanColumn } from '@/features/tasks/kanban/components/task-kanban-column';
import {
  KANBAN_COLUMNS,
  type KanbanColumnStatus,
  type KanbanTaskCard,
} from '@/features/tasks/kanban/kanban.constants';
import { useUpdateTaskStatusOptimistic } from '@/features/tasks/kanban/hooks/use-update-task-status-optimistic';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface TaskKanbanBoardProps {
  readonly tasks: readonly KanbanTaskCard[];
  readonly listParams: ListTasksParams;
  readonly onOpenTask: (taskId: string) => void;
}

export function TaskKanbanBoard({ tasks, listParams, onOpenTask }: TaskKanbanBoardProps) {
  const { showToast } = useToast();
  const { mutateAsync: updateStatus } = useUpdateTaskStatusOptimistic(listParams);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<KanbanColumnStatus, KanbanTaskCard[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };

    for (const task of tasks) {
      if (
        task.status === 'TODO' ||
        task.status === 'IN_PROGRESS' ||
        task.status === 'IN_REVIEW' ||
        task.status === 'DONE'
      ) {
        grouped[task.status].push(task);
      }
    }

    return grouped;
  }, [tasks]);

  const handleDropTask = async (taskId: string, status: KanbanColumnStatus): Promise<void> => {
    const task = tasks.find((item) => item.id === taskId);
    if (task === undefined || task.status === status) {
      return;
    }

    setDraggingTaskId(taskId);

    try {
      await updateStatus({ taskId, status });
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    } finally {
      setDraggingTaskId(null);
    }
  };

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-2"
      onDragEnd={() => {
        setDraggingTaskId(null);
      }}
    >
      {KANBAN_COLUMNS.map((column) => (
        <TaskKanbanColumn
          key={column.id}
          column={column}
          tasks={tasksByColumn[column.status]}
          draggingTaskId={draggingTaskId}
          onDropTask={(taskId, nextStatus) => {
            void handleDropTask(taskId, nextStatus);
          }}
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  );
}
