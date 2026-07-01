import type { ActivityRecord } from '@/features/activity/api/activity.types';
import type { ActivityTimelineEntry } from '@/features/activity/types';

export function activityRecordToTimelineEntry(record: ActivityRecord): ActivityTimelineEntry {
  return {
    id: record.id,
    activityType: record.type,
    timestamp: record.createdAt,
    actor: {
      id: record.userId ?? undefined,
      name: 'System',
      initials: 'SY',
    },
    title: record.title,
    description: record.description ?? undefined,
  };
}
