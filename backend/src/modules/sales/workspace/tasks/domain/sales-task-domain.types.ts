import type { SalesTaskPriority, SalesTaskStatus, SalesTaskType } from '@prisma/client';

export const DUE_TIME_PATTERN = /^\d{2}:\d{2}$/;
export const DEFAULT_DUE_TIME = '09:00';

export interface CreateSalesTaskValidationInput {
  readonly title: string;
  readonly type: SalesTaskType;
  readonly ownerUserId: string;
  readonly dueDate: string;
  readonly dueTime?: string | null;
  readonly priority?: SalesTaskPriority;
  readonly status?: SalesTaskStatus;
}

export interface UpdateSalesTaskValidationInput {
  readonly title?: string;
  readonly type?: SalesTaskType;
  readonly ownerUserId?: string;
  readonly dueDate?: string;
  readonly dueTime?: string | null;
  readonly priority?: SalesTaskPriority;
  readonly status?: SalesTaskStatus;
}

export interface RescheduleSalesTaskValidationInput {
  readonly dueDate: string;
  readonly dueTime?: string | null;
}
