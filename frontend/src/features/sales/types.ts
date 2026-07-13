export type DealStage =
  | 'QUALIFICATION'
  | 'DISCOVERY'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'VERBAL_COMMIT'
  | 'WON'
  | 'LOST'
  | 'ARCHIVED';

export type DealStatus = 'OPEN' | 'WON' | 'LOST' | 'ARCHIVED';

export type DealForecastCategory = 'PIPELINE' | 'BEST_CASE' | 'COMMIT' | 'CLOSED' | 'OMITTED';

export type DealForecastPeriod = 'week' | 'month' | 'quarter' | 'year';

export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/** Open pipeline stages that support forward and backward moves. */
export const DEAL_OPEN_STAGES: readonly DealStage[] = [
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'VERBAL_COMMIT',
] as const;
