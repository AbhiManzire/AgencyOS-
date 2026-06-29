import type { WorkflowActionType, WorkflowStatus, WorkflowTriggerType } from '../types';

export interface WorkflowTriggerRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly type: WorkflowTriggerType;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowActionRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly type: WorkflowActionType;
  readonly config: Record<string, unknown>;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
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
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListWorkflowsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: WorkflowStatus;
}

export interface ListWorkflowsResult {
  readonly items: readonly WorkflowRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateWorkflowTriggerPayload {
  readonly type: WorkflowTriggerType;
  readonly sortOrder?: number;
}

export interface CreateWorkflowActionPayload {
  readonly type: WorkflowActionType;
  readonly config?: Record<string, unknown>;
  readonly sortOrder?: number;
}

export interface CreateWorkflowPayload {
  readonly name: string;
  readonly description?: string | null;
  readonly status?: WorkflowStatus;
  readonly triggers: readonly CreateWorkflowTriggerPayload[];
  readonly actions: readonly CreateWorkflowActionPayload[];
}
