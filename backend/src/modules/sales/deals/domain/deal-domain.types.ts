import type { DealStage } from '@prisma/client';

export interface CreateDealValidationInput {
  readonly title: string;
  readonly value: number;
  readonly stage?: DealStage;
}

export interface UpdateDealValidationInput {
  readonly title?: string;
  readonly value?: number;
  readonly stage?: DealStage;
}
