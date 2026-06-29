import { FileText, Mail, MailX } from 'lucide-react';
import type { ActivityRecord } from '@/features/activity/api/activity.types';
import type { ActivityTimelineEntry } from '@/features/activity/types';

const ACTIVITY_ICON_BY_TYPE: Record<string, ActivityTimelineEntry['icon']> = {
  'invoice.pdf.generated': FileText,
  'invoice.email.sent': Mail,
  'invoice.email.failed': MailX,
};

export function activityRecordToTimelineEntry(record: ActivityRecord): ActivityTimelineEntry {
  return {
    id: record.id,
    icon: ACTIVITY_ICON_BY_TYPE[record.type] ?? FileText,
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
