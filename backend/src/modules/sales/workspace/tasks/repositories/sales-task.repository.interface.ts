import type { Prisma, SalesTaskPriority, SalesTaskStatus, SalesTaskType } from '@prisma/client';

export const SALES_TASK_REPOSITORY = Symbol('SALES_TASK_REPOSITORY');

export interface SalesTaskScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface SalesTaskRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly type: SalesTaskType;
  readonly title: string;
  readonly description: string | null;
  readonly ownerUserId: string;
  readonly ownerUserDisplayName: string | null;
  readonly ownerUserEmail: string | null;
  readonly dueDate: Date;
  readonly dueTime: string | null;
  readonly dueAt: Date;
  readonly priority: SalesTaskPriority;
  readonly leadId: string | null;
  readonly dealId: string | null;
  readonly clientId: string | null;
  readonly status: SalesTaskStatus;
  readonly completedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly activityId: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateSalesTaskData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly type: SalesTaskType;
  readonly title: string;
  readonly description?: string | null;
  readonly ownerUserId: string;
  readonly dueDate: Date;
  readonly dueTime?: string | null;
  readonly dueAt: Date;
  readonly priority?: SalesTaskPriority;
  readonly leadId?: string | null;
  readonly dealId?: string | null;
  readonly clientId?: string | null;
  readonly status?: SalesTaskStatus;
  readonly metadata?: Prisma.InputJsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateSalesTaskData {
  readonly type?: SalesTaskType;
  readonly title?: string;
  readonly description?: string | null;
  readonly ownerUserId?: string;
  readonly dueDate?: Date;
  readonly dueTime?: string | null;
  readonly dueAt?: Date;
  readonly priority?: SalesTaskPriority;
  readonly leadId?: string | null;
  readonly dealId?: string | null;
  readonly clientId?: string | null;
  readonly status?: SalesTaskStatus;
  readonly completedAt?: Date | null;
  readonly cancelledAt?: Date | null;
  readonly activityId?: string | null;
  readonly metadata?: Prisma.InputJsonValue | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteSalesTaskData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ListSalesTasksParams {
  readonly scope: SalesTaskScope;
  readonly skip?: number;
  readonly take?: number;
  readonly ownerUserId?: string;
  readonly status?: SalesTaskStatus;
  readonly type?: SalesTaskType;
  readonly from?: Date;
  readonly to?: Date;
  readonly leadId?: string;
  readonly dealId?: string;
  readonly clientId?: string;
}

export interface ListSalesTasksResult {
  readonly items: readonly SalesTaskRecord[];
  readonly total: number;
}

export interface SalesTaskRepository {
  create(data: CreateSalesTaskData): Promise<SalesTaskRecord>;
  update(
    scope: SalesTaskScope,
    id: string,
    data: UpdateSalesTaskData,
  ): Promise<SalesTaskRecord | null>;
  softDelete(
    scope: SalesTaskScope,
    id: string,
    data: SoftDeleteSalesTaskData,
  ): Promise<SalesTaskRecord | null>;
  findById(scope: SalesTaskScope, id: string): Promise<SalesTaskRecord | null>;
  list(params: ListSalesTasksParams): Promise<ListSalesTasksResult>;
  findPendingOverdue(now: Date, take?: number): Promise<readonly SalesTaskRecord[]>;
  markOverdue(id: string, data: { readonly updatedAt: Date }): Promise<SalesTaskRecord | null>;
  findMeetingsDueSoon(now: Date, until: Date, take?: number): Promise<readonly SalesTaskRecord[]>;
}
