import type { Prisma } from '@prisma/client';
import type {
  WorkflowActionDelayType,
  WorkflowActionType,
  WorkflowConditionLogic,
  WorkflowConditionNodeType,
  WorkflowConditionOperator,
  WorkflowStatus,
  WorkflowTriggerType,
} from '@prisma/client';

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
  readonly config: Prisma.JsonValue;
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
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly delayType: WorkflowActionDelayType;
  readonly delayValue: number | null;
  readonly delayUntil: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
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
  readonly value: Prisma.JsonValue | null;
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
  readonly version: number;
  readonly isEnabled: boolean;
  readonly triggers: readonly WorkflowTriggerRecord[];
  readonly actions: readonly WorkflowActionRecord[];
  readonly conditions: readonly WorkflowConditionRecord[];
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
  readonly config?: Prisma.InputJsonValue;
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
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
  readonly delayType?: WorkflowActionDelayType;
  readonly delayValue?: number | null;
  readonly delayUntil?: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateWorkflowConditionData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly parentId?: string | null;
  readonly clientParentKey?: string | null;
  readonly clientKey?: string;
  readonly nodeType?: WorkflowConditionNodeType;
  readonly logic?: WorkflowConditionLogic;
  readonly field?: string | null;
  readonly operator?: WorkflowConditionOperator | null;
  readonly value?: Prisma.InputJsonValue | null;
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
  readonly isEnabled?: boolean;
  readonly triggers: readonly CreateWorkflowTriggerData[];
  readonly actions: readonly CreateWorkflowActionData[];
  readonly conditions?: readonly CreateWorkflowConditionData[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateWorkflowData {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: WorkflowStatus;
  readonly isEnabled?: boolean;
  readonly version?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
  readonly triggers?: readonly CreateWorkflowTriggerData[];
  readonly actions?: readonly CreateWorkflowActionData[];
  readonly conditions?: readonly CreateWorkflowConditionData[];
}

export interface SoftDeleteWorkflowData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId: string | null;
  readonly status: WorkflowStatus;
  readonly isEnabled: boolean;
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
  update(
    scope: WorkflowScope,
    id: string,
    data: UpdateWorkflowData,
  ): Promise<WorkflowRecord | null>;
  softDelete(
    scope: WorkflowScope,
    id: string,
    data: SoftDeleteWorkflowData,
  ): Promise<WorkflowRecord | null>;
}
