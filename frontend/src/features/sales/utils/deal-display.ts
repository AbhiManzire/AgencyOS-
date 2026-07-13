import type { LeadSource } from '@/features/sales/leads/types';
import type {
  DealForecastCategory,
  DealPriority,
  DealStage,
  DealStatus,
} from '@/features/sales/types';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';

const STAGE_LABELS: Record<DealStage, string> = {
  QUALIFICATION: 'Qualification',
  DISCOVERY: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  VERBAL_COMMIT: 'Verbal Commit',
  WON: 'Won',
  LOST: 'Lost',
  ARCHIVED: 'Archived',
};

const STAGE_PROBABILITY: Record<DealStage, number> = {
  QUALIFICATION: 10,
  DISCOVERY: 25,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  VERBAL_COMMIT: 90,
  WON: 100,
  LOST: 0,
  ARCHIVED: 0,
};

const LEGACY_STAGE_MAP: Record<string, DealStage> = {
  NEW: 'QUALIFICATION',
  CONTACTED: 'QUALIFICATION',
  QUALIFIED: 'QUALIFICATION',
};

export const DEAL_PRIORITY_LABELS: Record<DealPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  OPEN: 'Open',
  WON: 'Won',
  LOST: 'Lost',
  ARCHIVED: 'Archived',
};

export const DEAL_FORECAST_CATEGORY_LABELS: Record<DealForecastCategory, string> = {
  PIPELINE: 'Pipeline',
  BEST_CASE: 'Best case',
  COMMIT: 'Commit',
  CLOSED: 'Closed',
  OMITTED: 'Omitted',
};

/** Normalizes legacy stage aliases to the current DealStage union. */
export function normalizeDealStage(stage: string): DealStage {
  if (stage in LEGACY_STAGE_MAP) {
    return LEGACY_STAGE_MAP[stage];
  }

  return stage as DealStage;
}

/** Returns a display label for a deal pipeline stage. */
export function formatDealStage(stage: string): string {
  const normalized = normalizeDealStage(stage);
  return STAGE_LABELS[normalized];
}

/** Returns the default win probability for a stage. */
export function getDealStageDefaultProbability(stage: DealStage): number {
  return STAGE_PROBABILITY[stage];
}

/** Returns win probability for a deal — prefers stored value, else stage default. */
export function formatDealProbability(stage: DealStage, probability?: number | null): string {
  if (probability !== null && probability !== undefined) {
    return `${String(probability)}%`;
  }
  return `${String(STAGE_PROBABILITY[stage])}%`;
}

/** Resolves numeric probability for weighted value calculations. */
export function resolveDealProbability(stage: DealStage, probability?: number | null): number {
  if (probability !== null && probability !== undefined) {
    return probability;
  }
  return STAGE_PROBABILITY[stage];
}

/** Formats weighted deal value (value × probability). */
export function formatWeightedDealValue(
  value: number,
  stage: DealStage,
  probability: number | null | undefined,
  currency = 'USD',
): string {
  const pct = resolveDealProbability(stage, probability);
  return formatMoney((value * pct) / 100, currency, 0);
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

/** Formats forecast category for display. */
export function formatDealForecastCategory(category: DealForecastCategory): string {
  return DEAL_FORECAST_CATEGORY_LABELS[category];
}

/** Formats deal status for display. */
export function formatDealStatus(status: DealStatus): string {
  return DEAL_STATUS_LABELS[status];
}

/** Formats lead/deal source using lead source labels when available. */
export function formatDealSource(source: LeadSource | null | undefined): string {
  if (source === null || source === undefined) {
    return '—';
  }

  return source
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
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
