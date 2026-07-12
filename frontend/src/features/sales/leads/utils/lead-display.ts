import type { LeadPriority, LeadSource, LeadStatus } from '@/features/sales/leads/types';
import { formatMoney } from '@/lib/format/money';
import { formatShortDate } from '@/lib/format/date';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  DISQUALIFIED: 'Disqualified',
  CONVERTED: 'Converted',
  ARCHIVED: 'Archived',
};

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  COLD_OUTREACH: 'Cold outreach',
  SOCIAL: 'Social',
  EVENT: 'Event',
  PARTNER: 'Partner',
  OTHER: 'Other',
};

export function formatLeadSource(source: LeadSource | null | undefined): string {
  if (source === null || source === undefined) {
    return '—';
  }
  return LEAD_SOURCE_LABELS[source];
}

export function formatLeadScore(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return '0 / 100';
  }
  return `${String(score)} / 100`;
}

export function formatLeadDealSize(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return formatMoney(value, currency, 0);
}

export function formatLeadDate(value: string | null | undefined): string {
  return formatShortDate(value);
}
