'use client';

import { Pencil } from 'lucide-react';
import { Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { TaskRecord } from '@/features/tasks/api/task.types';
import { TaskPriorityBadge } from '@/features/tasks/components/task-priority-badge';
import { TaskStatusBadge } from '@/features/tasks/components/task-status-badge';
import { formatTaskAssignee } from '@/features/tasks/utils/task-display';
import { Can } from '@/lib/rbac';

interface TaskDetailHeaderProps {
  readonly task: TaskRecord;
  readonly onEdit: () => void;
}

export function TaskDetailHeader({ task, onEdit }: TaskDetailHeaderProps) {
  const assigneeLabel = formatTaskAssignee(
    task.assigneeDisplayName,
    task.assigneeEmail,
    task.assigneeUserId,
  );

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {task.title}
          </h1>
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>

        <div>
          <Caption className="block uppercase tracking-wide">Assignee</Caption>
          <Body className="text-muted-foreground">{assigneeLabel}</Body>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can permission="tasks.update" mode="disable">
          <Button type="button" variant="outline" className="gap-2" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
        </Can>
      </div>
    </div>
  );
}
