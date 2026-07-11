import type { DealRecord } from '@/features/sales/api/deal.types';
import type { PipelineDealCard } from '@/features/sales/pipeline/pipeline.constants';
import { formatDealOwner } from '@/features/sales/utils/deal-display';

export function mapDealRecordToPipelineCard(record: DealRecord): PipelineDealCard {
  return {
    id: record.id,
    title: record.title,
    clientId: record.clientId,
    clientName: record.clientName,
    contactName: record.contactName ?? '—',
    value: record.value,
    currency: record.currency,
    expectedCloseDate: record.expectedCloseDate,
    ownerUserId: record.ownerUserId,
    ownerName: formatDealOwner(record.ownerDisplayName, record.ownerEmail, record.ownerUserId),
    stage: record.stage,
    probability: record.probability,
    priority: record.priority,
  };
}
