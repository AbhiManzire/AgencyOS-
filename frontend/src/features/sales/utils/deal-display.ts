import type { DealPriority, DealStage } from '@/features/sales/types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

const STAGE_LABELS: Record<DealStage, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  DISCOVERY: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
  ARCHIVED: 'Archived',
};

const STAGE_PROBABILITY: Record<DealStage, number> = {
  NEW: 10,
  CONTACTED: 15,
  QUALIFIED: 25,
  DISCOVERY: 35,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  WON: 100,
  LOST: 0,
  ARCHIVED: 0,
};

export const DEAL_PRIORITY_LABELS: Record<DealPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

/** Returns a display label for a deal pipeline stage. */
export function formatDealStage(stage: DealStage): string {
  return STAGE_LABELS[stage];
}

/** Returns win probability for a deal — prefers stored value, else stage default. */
export function formatDealProbability(stage: DealStage, probability?: number | null): string {
  if (probability !== null && probability !== undefined) {
    return `${String(probability)}%`;
  }
  return `${String(STAGE_PROBABILITY[stage])}%`;
}

/** Computes deal age in days from created date. */
export function formatDealAge(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (days === 0) {
    return 'Today';
  }

  if (days === 1) {
    return '1 day';
  }

  return `${String(days)} days`;
}

/** Formats deal currency value for display. */
export function formatDealValue(value: number, currency = 'USD'): string {
  return formatMoney(value, currency, 0);
}

/** Formats an ISO date string for deal display. */
export function formatDealDate(value: string | null | undefined): string {
  return formatShortDate(value);
}

/** Resolves owner display label from deal record fields. */
export function formatDealOwner(
  displayName: string | null | undefined,
  email: string | null | undefined,
  userId: string | null | undefined,
): string {
  if (displayName !== null && displayName !== undefined && displayName.trim().length > 0) {
    return displayName.trim();
  }

  if (email !== null && email !== undefined && email.trim().length > 0) {
    return email.trim();
  }

  if (userId !== null && userId !== undefined && userId.trim().length > 0) {
    return userId;
  }

  return 'Unassigned';
}

/** Sums deal values for a set of cards. */
export function sumDealValues(deals: readonly { readonly value: number }[]): number {
  return deals.reduce((total, deal) => total + deal.value, 0);
}
