'use client';

import { useState, type DragEvent } from 'react';
import { Caption } from '@/design-system/typography';
import { TaskKanbanCard } from '@/features/tasks/kanban/components/task-kanban-card';
import type {
  KanbanColumnDefinition,
  KanbanTaskCard,
} from '@/features/tasks/kanban/kanban.constants';
import { KANBAN_TASK_DRAG_TYPE } from '@/features/tasks/kanban/kanban.constants';
import { cn } from '@/lib/utils';

interface TaskKanbanColumnProps {
  readonly column: KanbanColumnDefinition;
  readonly tasks: readonly KanbanTaskCard[];
  readonly draggingTaskId: string | null;
  readonly onDropTask: (taskId: string, status: KanbanColumnDefinition['status']) => void;
  readonly onOpenTask: (taskId: string) => void;
}

export function TaskKanbanColumn({
  column,
  tasks,
  draggingTaskId,
  onDropTask,
  onOpenTask,
}: TaskKanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOver(false);

    const taskId = event.dataTransfer.getData(KANBAN_TASK_DRAG_TYPE);
    if (taskId.length === 0) {
      return;
    }

    onDropTask(taskId, column.status);
  };

  return (
    <section
      className={cn(
        'flex min-h-[320px] w-[280px] shrink-0 flex-col rounded-lg border border-border bg-muted/20',
        isDragOver && 'border-primary bg-primary/5',
      )}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="flex items-center justify-between border-b border-border px-3 py-3">
        <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
        <Caption className="tabular-nums">{tasks.length}</Caption>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <Caption className="py-6 text-center text-muted-foreground">No tasks</Caption>
        ) : (
          tasks.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              isDragging={draggingTaskId === task.id}
              onOpen={() => {
                onOpenTask(task.id);
              }}
            />
          ))
        )}
      </div>
    </section>
  );
}
