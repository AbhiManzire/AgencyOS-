import type { Prisma, SalesTaskPriority, SalesTaskStatus, SalesTaskType } from '@prisma/client';
import type {
  ListSalesTasksResult,
  SalesTaskRecord,
  SalesTaskScope,
} from '../repositories/sales-task.repository.interface';

export interface SalesTaskApplicationContext {
  readonly actorUserId: string;
}

export interface CreateSalesTaskCommand {
  readonly type: SalesTaskType;
  readonly title: string;
  readonly description?: string | null;
  readonly ownerUserId: string;
  readonly dueDate: string;
  readonly dueTime?: string | null;
  readonly priority?: SalesTaskPriority;
  readonly leadId?: string | null;
  readonly dealId?: string | null;
  readonly clientId?: string | null;
  readonly metadata?: Record<string, unknown> | null;
}

export interface UpdateSalesTaskCommand {
  readonly type?: SalesTaskType;
  readonly title?: string;
  readonly description?: string | null;
  readonly ownerUserId?: string;
  readonly dueDate?: string;
  readonly dueTime?: string | null;
  readonly priority?: SalesTaskPriority;
  readonly leadId?: string | null;
  readonly dealId?: string | null;
  readonly clientId?: string | null;
  readonly status?: SalesTaskStatus;
  readonly metadata?: Record<string, unknown> | null;
}

export interface ListSalesTasksQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly ownerUserId?: string;
  readonly status?: SalesTaskStatus;
  readonly type?: SalesTaskType;
  readonly from?: string;
  readonly to?: string;
  readonly leadId?: string;
  readonly dealId?: string;
  readonly clientId?: string;
}

export interface RescheduleSalesTaskCommand {
  readonly dueDate: string;
  readonly dueTime?: string | null;
}

export interface ReassignSalesTaskCommand {
  readonly ownerUserId: string;
}

export type { ListSalesTasksResult, Prisma, SalesTaskRecord, SalesTaskScope };
