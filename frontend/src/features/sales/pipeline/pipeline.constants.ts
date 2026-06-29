import type { DealStage } from '@/features/sales/types';

export type PipelineColumnStage = DealStage;

export interface PipelineColumnDefinition {
  readonly id: PipelineColumnStage;
  readonly label: string;
  readonly stage: PipelineColumnStage;
}

export const PIPELINE_COLUMNS: readonly PipelineColumnDefinition[] = [
  { id: 'NEW', label: 'New', stage: 'NEW' },
  { id: 'QUALIFIED', label: 'Qualified', stage: 'QUALIFIED' },
  { id: 'PROPOSAL', label: 'Proposal', stage: 'PROPOSAL' },
  { id: 'NEGOTIATION', label: 'Negotiation', stage: 'NEGOTIATION' },
  { id: 'WON', label: 'Won', stage: 'WON' },
  { id: 'LOST', label: 'Lost', stage: 'LOST' },
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
}

export const PIPELINE_LIST_PARAMS = {
  take: 200,
  skip: 0,
} as const;

export const DEAL_DRAG_TYPE = 'application/x-agencyos-deal-id';
