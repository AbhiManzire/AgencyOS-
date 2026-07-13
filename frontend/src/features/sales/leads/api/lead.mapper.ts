import type { LeadRecord } from '@/features/sales/leads/api/lead.types';
import type { LeadListItem } from '@/features/sales/leads/types';
import { formatDealOwner } from '@/features/sales/utils/deal-display';

/** Maps a lead API record to a list table row. */
export function mapLeadRecordToListItem(record: LeadRecord): LeadListItem {
  return {
    id: record.id,
    company: record.company,
    code: record.code,
    contactPerson: record.contactPerson,
    email: record.email,
    phone: record.phone,
    status: record.status,
    priority: record.priority,
    source: record.source,
    campaignId: record.campaignId,
    assignedTo: formatDealOwner(
      record.assignedToDisplayName,
      record.assignedToEmail,
      record.assignedToUserId,
    ),
    leadScore: record.leadScore,
    expectedDealSize: record.expectedDealSize,
    createdAt: record.createdAt,
    isArchived: record.deletedAt !== null || record.status === 'ARCHIVED',
    isConverted: record.status === 'CONVERTED' || record.convertedClientId !== null,
  };
}
