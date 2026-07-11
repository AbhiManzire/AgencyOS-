import type { TaskRecord } from '@/features/tasks/api/task.types';
import {
  KANBAN_BOARD_STATUSES,
  type KanbanColumnStatus,
  type KanbanTaskCard,
} from '@/features/tasks/kanban/kanban.constants';

interface MapKanbanTaskOptions {
  readonly projectNamesById?: ReadonlyMap<string, string>;
}

/** Maps a task API record to a kanban card. */
export function mapTaskRecordToKanbanCard(
  record: TaskRecord,
  options: MapKanbanTaskOptions = {},
): KanbanTaskCard {
  const projectName = options.projectNamesById?.get(record.projectId) ?? '—';
  const assigneeName =
    record.assigneeDisplayName ??
    record.assigneeEmail ??
    (record.assigneeUserId !== null ? '—' : 'Unassigned');

  return {
    id: record.id,
    title: record.title,
    projectId: record.projectId,
    projectName,
    assigneeUserId: record.assigneeUserId,
    assigneeName,
    priority: record.priority,
    status: record.status,
    dueDate: record.dueDate,
    subtaskCount: record.subtaskCount,
    boardOrder: record.boardOrder,
  };
}

function isKanbanColumnStatus(status: string): status is KanbanColumnStatus {
  return (KANBAN_BOARD_STATUSES as readonly string[]).includes(status);
}

/** Returns true when a task belongs on the kanban board. */
export function isKanbanBoardTask(record: TaskRecord): boolean {
  return isKanbanColumnStatus(record.status);
}
