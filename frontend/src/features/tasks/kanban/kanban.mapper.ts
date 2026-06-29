import type { TaskRecord } from '@/features/tasks/api/task.types';
import type { KanbanTaskCard } from '@/features/tasks/kanban/kanban.constants';

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
  };
}

/** Returns true when a task belongs on the kanban board. */
export function isKanbanBoardTask(record: TaskRecord): boolean {
  return (
    record.status === 'TODO' ||
    record.status === 'IN_PROGRESS' ||
    record.status === 'IN_REVIEW' ||
    record.status === 'DONE'
  );
}
