import type { SubtaskRecord } from '@/features/tasks/subtasks/api/subtask.types';
import type { SubtaskListItem } from '@/features/tasks/subtasks/types';
import { formatTaskAssignee } from '@/features/tasks/utils/task-display';

/** Maps a subtask API record to a list row item. */
export function subtaskRecordToListItem(record: SubtaskRecord): SubtaskListItem {
  return {
    id: record.id,
    title: record.title,
    assigneeUserId: record.assigneeUserId,
    assigneeName: formatTaskAssignee(
      record.assigneeDisplayName,
      record.assigneeEmail,
      record.assigneeUserId,
    ),
    priority: record.priority,
    status: record.status,
    dueDate: record.dueDate,
  };
}
