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

function computeBoardOrder(
  columnTasks: readonly KanbanTaskCard[],
  targetIndex: number,
  movingTaskId: string,
): number {
  const withoutMoving = columnTasks.filter((task) => task.id !== movingTaskId);
  const clampedIndex = Math.max(0, Math.min(targetIndex, withoutMoving.length));

  if (withoutMoving.length === 0) {
    return 1000;
  }

  if (clampedIndex === 0) {
    return withoutMoving[0].boardOrder - 1000;
  }

  if (clampedIndex >= withoutMoving.length) {
    return withoutMoving[withoutMoving.length - 1].boardOrder + 1000;
  }

  const before = withoutMoving[clampedIndex - 1].boardOrder;
  const after = withoutMoving[clampedIndex].boardOrder;
  if (after - before > 1) {
    return Math.floor((before + after) / 2);
  }

  return before + 1;
}

export function TaskKanbanBoard({ tasks, listParams, onOpenTask }: TaskKanbanBoardProps) {
  const { showToast } = useToast();
  const { mutateAsync: updateBoard } = useUpdateTaskStatusOptimistic(listParams);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<KanbanColumnStatus, KanbanTaskCard[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      BLOCKED: [],
      COMPLETED: [],
    };

    for (const task of tasks) {
      if (
        task.status === 'BACKLOG' ||
        task.status === 'TODO' ||
        task.status === 'IN_PROGRESS' ||
        task.status === 'REVIEW' ||
        task.status === 'BLOCKED' ||
        task.status === 'COMPLETED'
      ) {
        grouped[task.status].push(task);
      }
    }

    for (const status of Object.keys(grouped) as KanbanColumnStatus[]) {
      grouped[status].sort((left, right) => left.boardOrder - right.boardOrder);
    }

    return grouped;
  }, [tasks]);

  const handleDropTask = async (
    taskId: string,
    status: KanbanColumnStatus,
    targetIndex: number,
  ): Promise<void> => {
    const task = tasks.find((item) => item.id === taskId);
    if (task === undefined) {
      return;
    }

    const boardOrder = computeBoardOrder(tasksByColumn[status], targetIndex, taskId);
    if (task.status === status && task.boardOrder === boardOrder) {
      return;
    }

    setDraggingTaskId(taskId);

    try {
      await updateBoard({ taskId, status, boardOrder });
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
          onDropTask={(taskId, nextStatus, targetIndex) => {
            void handleDropTask(taskId, nextStatus, targetIndex);
          }}
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  );
}
