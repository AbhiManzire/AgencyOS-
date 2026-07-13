import type { DealPriority, DealStage } from '@prisma/client';

export const DEAL_OPEN_STAGES: readonly DealStage[] = [
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'VERBAL_COMMIT',
];

export interface CreateDealValidationInput {
  readonly title: string;
  readonly value: number;
  readonly stage?: DealStage;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
}

export interface UpdateDealValidationInput {
  readonly title?: string;
  readonly value?: number;
  readonly stage?: DealStage;
  readonly probability?: number | null;
  readonly priority?: DealPriority;
}

export interface ConvertToInvoiceValidationInput {
  readonly projectId?: string | null;
}

export interface WinDealValidationInput {
  readonly createProject?: boolean;
  readonly createInvoice?: boolean;
  readonly convertClient?: boolean;
}

export interface LoseDealValidationInput {
  readonly lossReason: string;
}
