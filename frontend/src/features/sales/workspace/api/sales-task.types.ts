export type SalesTaskType =
  'CALL' | 'MEETING' | 'EMAIL' | 'WHATSAPP' | 'PROPOSAL' | 'DOCUMENTATION' | 'INTERNAL' | 'CUSTOM';

export type SalesTaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export type SalesTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/** Sales task row returned by /sales-tasks — mirrors backend SalesTaskRecord (ISO dates). */
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
  readonly dueDate: string;
  readonly dueTime: string | null;
  readonly dueAt: string;
  readonly priority: SalesTaskPriority;
  readonly leadId: string | null;
  readonly dealId: string | null;
  readonly clientId: string | null;
  readonly status: SalesTaskStatus;
  readonly completedAt: string | null;
  readonly cancelledAt: string | null;
  readonly activityId: string | null;
  readonly metadata: unknown;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListSalesTasksParams {
  readonly skip?: number;
  readonly take?: number;
  readonly ownerUserId?: string;
  readonly status?: SalesTaskStatus;
  readonly type?: SalesTaskType;
  readonly leadId?: string;
  readonly dealId?: string;
  readonly clientId?: string;
  readonly dueFrom?: string;
  readonly dueTo?: string;
}

export interface ListSalesTasksResult {
  readonly items: readonly SalesTaskRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateSalesTaskPayload {
  readonly type: SalesTaskType;
  readonly title: string;
  readonly description?: string;
  readonly ownerUserId: string;
  readonly dueDate: string;
  readonly dueTime?: string | null;
  readonly priority?: SalesTaskPriority;
  readonly leadId?: string | null;
  readonly dealId?: string | null;
  readonly clientId?: string | null;
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateSalesTaskPayload {
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
  readonly metadata?: Record<string, unknown>;
}

export interface RescheduleSalesTaskPayload {
  readonly dueDate: string;
  readonly dueTime?: string | null;
}

export interface ReassignSalesTaskPayload {
  readonly ownerUserId: string;
}
