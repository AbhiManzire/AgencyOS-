import type { ApprovalStatus } from '@prisma/client';

export interface CreateExpenseValidationInput {
  readonly category: string;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
}

export interface UpdateExpenseValidationInput {
  readonly category?: string;
  readonly amount?: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
}

export interface ApproveExpenseValidationInput {
  readonly approvalStatus: ApprovalStatus;
}
