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
import type { WorkflowRecord, WorkflowScope } from '../repositories/workflow.repository.interface';

export type { WorkflowRecord, WorkflowScope };

export interface WorkflowApplicationContext {
  readonly actorUserId: string;
}

export interface CreateWorkflowTriggerCommand {
  readonly type: WorkflowTriggerType;
  readonly config?: Prisma.InputJsonValue;
  readonly sortOrder?: number;
}

export interface CreateWorkflowActionCommand {
  readonly type: WorkflowActionType;
  readonly config?: Prisma.InputJsonValue;
  readonly sortOrder?: number;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
  readonly delayType?: WorkflowActionDelayType;
  readonly delayValue?: number | null;
  readonly delayUntil?: Date | null;
}

export interface CreateWorkflowConditionCommand {
  readonly key?: string;
  readonly parentKey?: string | null;
  readonly parentId?: string | null;
  readonly nodeType?: WorkflowConditionNodeType;
  readonly logic?: WorkflowConditionLogic;
  readonly field?: string | null;
  readonly operator?: WorkflowConditionOperator | null;
  readonly value?: Prisma.InputJsonValue | null;
  readonly sortOrder?: number;
}

export interface CreateWorkflowCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly status?: WorkflowStatus;
  readonly isEnabled?: boolean;
  readonly triggers: readonly CreateWorkflowTriggerCommand[];
  readonly actions: readonly CreateWorkflowActionCommand[];
  readonly conditions?: readonly CreateWorkflowConditionCommand[];
}

export interface UpdateWorkflowCommand {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: WorkflowStatus;
  readonly isEnabled?: boolean;
  readonly triggers?: readonly CreateWorkflowTriggerCommand[];
  readonly actions?: readonly CreateWorkflowActionCommand[];
  readonly conditions?: readonly CreateWorkflowConditionCommand[];
}

export interface ListWorkflowsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: WorkflowStatus;
}

export interface ListWorkflowsResult {
  readonly items: readonly WorkflowRecord[];
  readonly total: number;
}

export interface ExecuteWorkflowCommand {
  readonly payload?: Record<string, unknown>;
}
