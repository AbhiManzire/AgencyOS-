import type { Prisma } from '@prisma/client';
import type { WorkflowActionType, WorkflowStatus, WorkflowTriggerType } from '@prisma/client';

export const WORKFLOW_REPOSITORY = Symbol('WORKFLOW_REPOSITORY');

export interface WorkflowScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface WorkflowTriggerRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly type: WorkflowTriggerType;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkflowActionRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly type: WorkflowActionType;
  readonly config: Prisma.JsonValue;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkflowRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: WorkflowStatus;
  readonly triggers: readonly WorkflowTriggerRecord[];
  readonly actions: readonly WorkflowActionRecord[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateWorkflowTriggerData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly type: WorkflowTriggerType;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateWorkflowActionData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly type: WorkflowActionType;
  readonly config?: Prisma.InputJsonValue;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateWorkflowData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly status?: WorkflowStatus;
  readonly triggers: readonly CreateWorkflowTriggerData[];
  readonly actions: readonly CreateWorkflowActionData[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface ListWorkflowsParams {
  readonly scope: WorkflowScope;
  readonly skip?: number;
  readonly take?: number;
  readonly status?: WorkflowStatus;
}

export interface ListWorkflowsResult {
  readonly items: readonly WorkflowRecord[];
  readonly total: number;
}

export interface WorkflowRepository {
  create(data: CreateWorkflowData): Promise<WorkflowRecord>;
  findById(scope: WorkflowScope, id: string): Promise<WorkflowRecord | null>;
  list(params: ListWorkflowsParams): Promise<ListWorkflowsResult>;
}
