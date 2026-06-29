import type { DealStage } from '@/features/sales/types';

const STAGE_LABELS: Record<DealStage, string> = {
  NEW: 'New',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
};

const STAGE_PROBABILITY: Record<DealStage, number> = {
  NEW: 10,
  QUALIFIED: 25,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  WON: 100,
  LOST: 0,
};

/** Returns a display label for a deal pipeline stage. */
export function formatDealStage(stage: DealStage): string {
  return STAGE_LABELS[stage];
}

/** Returns default win probability for a deal stage. */
export function formatDealProbability(stage: DealStage): string {
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Formats an ISO date string for deal display. */
export function formatDealDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
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
