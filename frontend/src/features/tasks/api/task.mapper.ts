import type { TaskRecord } from '@/features/tasks/api/task.types';
import type { TaskListItem } from '@/features/tasks/types';

interface MapTaskRecordOptions {
  readonly projectNamesById?: ReadonlyMap<string, string>;
  readonly milestoneNamesById?: ReadonlyMap<string, string>;
}

/** Maps an API task record to the Task List row shape. */
export function mapTaskRecordToListItem(
  record: TaskRecord,
  options: MapTaskRecordOptions = {},
): TaskListItem {
  const projectName = options.projectNamesById?.get(record.projectId) ?? '—';
  const milestoneName =
    record.milestoneId === null
      ? '—'
      : (options.milestoneNamesById?.get(record.milestoneId) ?? '—');

  const assigneeName =
    record.assigneeDisplayName ??
    record.assigneeEmail ??
    (record.assigneeUserId !== null ? '—' : 'Unassigned');

  const reporterName =
    record.reporterDisplayName ??
    record.reporterEmail ??
    (record.reporterUserId !== null ? '—' : '—');

  return {
    id: record.id,
    code: record.code,
    title: record.title,
    type: record.type,
    projectId: record.projectId,
    projectName,
    milestoneId: record.milestoneId,
    milestoneName,
    assigneeUserId: record.assigneeUserId,
    assigneeName,
    reporterUserId: record.reporterUserId,
    reporterName,
    priority: record.priority,
    status: record.status,
    dueDate: record.dueDate,
    isArchived: record.deletedAt !== null,
  };
}
