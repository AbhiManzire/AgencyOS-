import type { DealPriority, DealStage } from '@/features/sales/types';

export type PipelineColumnStage = Exclude<DealStage, 'ARCHIVED'>;

export interface PipelineColumnDefinition {
  readonly id: PipelineColumnStage;
  readonly label: string;
  readonly stage: PipelineColumnStage;
  readonly probability?: number;
  readonly colorToken?: string | null;
}

export const PIPELINE_COLUMNS: readonly PipelineColumnDefinition[] = [
  { id: 'QUALIFICATION', label: 'Qualification', stage: 'QUALIFICATION', probability: 10 },
  { id: 'DISCOVERY', label: 'Discovery', stage: 'DISCOVERY', probability: 25 },
  { id: 'PROPOSAL', label: 'Proposal', stage: 'PROPOSAL', probability: 50 },
  { id: 'NEGOTIATION', label: 'Negotiation', stage: 'NEGOTIATION', probability: 75 },
  { id: 'VERBAL_COMMIT', label: 'Verbal Commit', stage: 'VERBAL_COMMIT', probability: 90 },
  { id: 'WON', label: 'Won', stage: 'WON', probability: 100 },
  { id: 'LOST', label: 'Lost', stage: 'LOST', probability: 0 },
] as const;

export interface PipelineDealCard {
  readonly id: string;
  readonly title: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly contactName: string;
  readonly value: number;
  readonly currency: string;
  readonly expectedCloseDate: string | null;
  readonly ownerUserId: string | null;
  readonly ownerName: string;
  readonly stage: DealStage;
  readonly probability: number | null;
  readonly priority: DealPriority;
}

export const PIPELINE_LIST_PARAMS = {
  take: 200,
  skip: 0,
} as const;

export const DEAL_DRAG_TYPE = 'application/x-agencyos-deal-id';
