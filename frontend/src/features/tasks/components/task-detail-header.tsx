'use client';

import { Archive, Pencil, RotateCcw } from 'lucide-react';
import { Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { TaskRecord } from '@/features/tasks/api/task.types';
import { TaskPriorityBadge } from '@/features/tasks/components/task-priority-badge';
import { TaskStatusBadge } from '@/features/tasks/components/task-status-badge';
import { TaskTypeBadge } from '@/features/tasks/components/task-type-badge';
import { formatTaskAssignee } from '@/features/tasks/utils/task-display';
import { isTaskArchived } from '@/features/tasks/utils/list-tasks-query';
import { Can } from '@/lib/rbac';

interface TaskDetailHeaderProps {
  readonly task: TaskRecord;
  readonly isArchiving?: boolean;
  readonly isRestoring?: boolean;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
}

export function TaskDetailHeader({
  task,
  isArchiving = false,
  isRestoring = false,
  onEdit,
  onArchive,
  onRestore,
}: TaskDetailHeaderProps) {
  const assigneeLabel = formatTaskAssignee(
    task.assigneeDisplayName,
    task.assigneeEmail,
    task.assigneeUserId,
  );
  const archived = isTaskArchived(task);
  const title = task.code ? `${task.code} · ${task.title}` : task.title;

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
          <TaskTypeBadge type={task.type} />
        </div>

        <div>
          <Caption className="block uppercase tracking-wide">Assignee</Caption>
          <Body className="text-muted-foreground">{assigneeLabel}</Body>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can permission="tasks.update" mode="disable">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={archived}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </Can>
        {archived ? (
          <Can permission="tasks.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isRestoring}
              onClick={onRestore}
            >
              <RotateCcw className="size-4" />
              Restore
            </Button>
          </Can>
        ) : (
          <Can permission="tasks.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-danger"
              disabled={isArchiving}
              onClick={onArchive}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          </Can>
        )}
      </div>
    </div>
  );
}
