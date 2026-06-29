import type { TimeEntryRecord } from '@/features/time-entries/api/time-entry.types';
import type { TimeEntryListItem } from '@/features/time-entries/types';

export function toTimeEntryListItem(record: TimeEntryRecord): TimeEntryListItem {
  return {
    id: record.id,
    taskId: record.taskId,
    userId: record.userId,
    userName: record.userDisplayName ?? record.userEmail ?? record.userId,
    startTime: record.startTime,
    endTime: record.endTime ?? record.startTime,
    durationMinutes: record.durationMinutes ?? 0,
    billable: record.billable,
    notes: record.notes,
  };
}
