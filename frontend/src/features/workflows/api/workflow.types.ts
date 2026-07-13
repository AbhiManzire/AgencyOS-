import type {
  WorkflowActionDelayType,
  WorkflowActionType,
  WorkflowConditionLogic,
  WorkflowConditionNodeType,
  WorkflowConditionOperator,
  WorkflowStatus,
  WorkflowTriggerType,
} from '../types';

export interface WorkflowTriggerRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly type: WorkflowTriggerType;
  readonly config?: Record<string, unknown> | null;
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
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
  readonly delayType?: WorkflowActionDelayType;
  readonly delayValue?: number | null;
  readonly delayUntil?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkflowConditionRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly parentId: string | null;
  readonly nodeType: WorkflowConditionNodeType;
  readonly logic: WorkflowConditionLogic;
  readonly field: string | null;
  readonly operator: WorkflowConditionOperator | null;
  readonly value: unknown;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly children?: readonly WorkflowConditionRecord[];
}

export interface WorkflowRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: WorkflowStatus;
  readonly version?: number;
  readonly isEnabled?: boolean;
  readonly triggers: readonly WorkflowTriggerRecord[];
  readonly actions: readonly WorkflowActionRecord[];
  readonly conditions?: readonly WorkflowConditionRecord[];
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
  readonly config?: Record<string, unknown>;
  readonly sortOrder?: number;
}

export interface CreateWorkflowActionPayload {
  readonly type: WorkflowActionType;
  readonly config?: Record<string, unknown>;
  readonly sortOrder?: number;
  readonly delayType?: WorkflowActionDelayType;
  readonly delayValue?: number | null;
  readonly delayUntil?: string | null;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
}

export interface CreateWorkflowConditionPayload {
  readonly nodeType: WorkflowConditionNodeType;
  readonly logic?: WorkflowConditionLogic;
  readonly field?: string | null;
  readonly operator?: WorkflowConditionOperator | null;
  readonly value?: unknown;
  readonly sortOrder?: number;
  readonly children?: readonly CreateWorkflowConditionPayload[];
}

export interface CreateWorkflowPayload {
  readonly name: string;
  readonly description?: string | null;
  readonly status?: WorkflowStatus;
  readonly isEnabled?: boolean;
  readonly triggers: readonly CreateWorkflowTriggerPayload[];
  readonly actions: readonly CreateWorkflowActionPayload[];
  readonly conditions?: readonly CreateWorkflowConditionPayload[];
}

export type UpdateWorkflowPayload = CreateWorkflowPayload;

export interface ExecuteWorkflowPayload {
  readonly payload?: Record<string, unknown>;
  readonly triggerType?: string;
  readonly triggerPayload?: Record<string, unknown>;
}
