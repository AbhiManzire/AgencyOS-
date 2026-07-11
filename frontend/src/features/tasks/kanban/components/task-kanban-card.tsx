'use client';

import { ListTodo } from 'lucide-react';
import { useRef } from 'react';
import { Caption } from '@/design-system/typography';
import { TaskPriorityBadge } from '@/features/tasks/components/task-priority-badge';
import type { KanbanTaskCard } from '@/features/tasks/kanban/kanban.constants';
import { KANBAN_TASK_DRAG_TYPE } from '@/features/tasks/kanban/kanban.constants';
import { formatTaskDate } from '@/features/tasks/utils/task-display';
import { usePermission } from '@/lib/rbac/use-permission';
import { cn } from '@/lib/utils';

interface TaskKanbanCardProps {
  readonly task: KanbanTaskCard;
  readonly isDragging?: boolean;
  readonly onOpen: () => void;
}

export function TaskKanbanCard({ task, isDragging = false, onOpen }: TaskKanbanCardProps) {
  const { allowed: canDrag } = usePermission('tasks.update');
  const didDragRef = useRef(false);

  return (
    <article
      data-kanban-card="true"
      draggable={canDrag}
      onDragStart={(event) => {
        didDragRef.current = true;
        event.dataTransfer.setData(KANBAN_TASK_DRAG_TYPE, task.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (didDragRef.current) {
          return;
        }

        onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing',
        'hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging && 'opacity-50',
      )}
    >
      <p className="mb-2 line-clamp-2 font-medium text-foreground">{task.title}</p>

      <div className="space-y-2">
        <Caption className="block truncate text-muted-foreground">{task.projectName}</Caption>
        <Caption className="block truncate text-muted-foreground">{task.assigneeName}</Caption>

        <div className="flex flex-wrap items-center gap-2">
          <TaskPriorityBadge priority={task.priority} />
          <Caption className="text-muted-foreground">Due {formatTaskDate(task.dueDate)}</Caption>
        </div>

        {task.subtaskCount > 0 ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <ListTodo className="size-3.5" aria-hidden="true" />
            <Caption>{task.subtaskCount} subtasks</Caption>
          </div>
        ) : null}
      </div>
    </article>
  );
}
