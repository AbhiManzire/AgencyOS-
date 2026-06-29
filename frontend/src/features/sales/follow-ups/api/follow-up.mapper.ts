import type { FollowUpRecord } from '@/features/sales/follow-ups/api/follow-up.types';
import type { FollowUpListItem } from '@/features/sales/follow-ups/types';
import { formatDealOwner } from '@/features/sales/utils/deal-display';

export function followUpRecordToListItem(record: FollowUpRecord): FollowUpListItem {
  return {
    id: record.id,
    dealId: record.dealId,
    subject: record.subject,
    type: record.type,
    scheduledAt: record.scheduledAt,
    notes: record.notes,
    reminderAt: record.reminderAt,
    ownerUserId: record.ownerUserId,
    ownerName: formatDealOwner(record.ownerDisplayName, record.ownerEmail, record.ownerUserId),
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
