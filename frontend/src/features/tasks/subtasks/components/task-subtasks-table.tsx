'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TaskPriorityBadge } from '@/features/tasks/components/task-priority-badge';
import { TaskStatusBadge } from '@/features/tasks/components/task-status-badge';
import { SubtaskRowActions } from '@/features/tasks/subtasks/components/subtask-row-actions';
import type { SubtaskListItem } from '@/features/tasks/subtasks/types';
import { formatTaskDate } from '@/features/tasks/utils/task-display';

interface TaskSubtasksTableProps {
  readonly subtasks: readonly SubtaskListItem[];
  readonly readOnly?: boolean;
  readonly onEditSubtask: (subtaskId: string) => void;
  readonly onDeleteSubtask: (subtaskId: string) => void;
}

export function TaskSubtasksTable({
  subtasks,
  readOnly = false,
  onEditSubtask,
  onDeleteSubtask,
}: TaskSubtasksTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Priority</TableHead>
              <TableHead className="hidden lg:table-cell">Due Date</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subtasks.map((subtask) => (
              <TableRow key={subtask.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{subtask.title}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {subtask.assigneeName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                  {subtask.assigneeName}
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={subtask.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <TaskPriorityBadge priority={subtask.priority} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatTaskDate(subtask.dueDate)}
                </TableCell>
                <TableCell className="text-right">
                  <SubtaskRowActions
                    subtaskTitle={subtask.title}
                    disabled={readOnly}
                    onEdit={() => {
                      onEditSubtask(subtask.id);
                    }}
                    onDelete={() => {
                      onDeleteSubtask(subtask.id);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
