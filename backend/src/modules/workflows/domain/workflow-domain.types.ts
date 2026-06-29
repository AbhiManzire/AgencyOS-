import type { WorkflowActionType, WorkflowStatus, WorkflowTriggerType } from '@prisma/client';

export interface CreateWorkflowValidationInput {
  readonly name: string;
  readonly status?: WorkflowStatus;
  readonly triggers: readonly { readonly type: WorkflowTriggerType }[];
  readonly actions: readonly { readonly type: WorkflowActionType }[];
}
