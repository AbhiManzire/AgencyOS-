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

export interface CreateWorkflowValidationInput {
  readonly name: string;
  readonly status?: WorkflowStatus;
  readonly triggers: readonly { readonly type: WorkflowTriggerType }[];
  readonly actions: readonly { readonly type: WorkflowActionType }[];
  readonly conditions?: readonly {
    readonly nodeType?: WorkflowConditionNodeType;
    readonly operator?: WorkflowConditionOperator | null;
    readonly field?: string | null;
  }[];
}

export interface UpdateWorkflowValidationInput {
  readonly name?: string;
  readonly status?: WorkflowStatus;
  readonly triggers?: readonly { readonly type: WorkflowTriggerType }[];
  readonly actions?: readonly { readonly type: WorkflowActionType }[];
  readonly conditions?: readonly {
    readonly nodeType?: WorkflowConditionNodeType;
    readonly operator?: WorkflowConditionOperator | null;
    readonly field?: string | null;
  }[];
}

export type { WorkflowActionDelayType, WorkflowConditionLogic, WorkflowConditionOperator, Prisma };
