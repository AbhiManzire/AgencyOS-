import type { Prisma } from '@prisma/client';
import type { WorkflowActionType, WorkflowStatus, WorkflowTriggerType } from '@prisma/client';
import type { WorkflowRecord, WorkflowScope } from '../repositories/workflow.repository.interface';

export type { WorkflowRecord, WorkflowScope };

export interface WorkflowApplicationContext {
  readonly actorUserId: string;
}

export interface CreateWorkflowTriggerCommand {
  readonly type: WorkflowTriggerType;
  readonly sortOrder?: number;
}

export interface CreateWorkflowActionCommand {
  readonly type: WorkflowActionType;
  readonly config?: Prisma.InputJsonValue;
  readonly sortOrder?: number;
}

export interface CreateWorkflowCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly status?: WorkflowStatus;
  readonly triggers: readonly CreateWorkflowTriggerCommand[];
  readonly actions: readonly CreateWorkflowActionCommand[];
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
