import type { WorkflowActionType, WorkflowStatus, WorkflowTriggerType } from '@prisma/client';
import { WORKFLOW_DOMAIN_ERROR_CODES, WorkflowDomainError } from './workflow-domain.errors';
import type { CreateWorkflowValidationInput } from './workflow-domain.types';

const VALID_TRIGGER_TYPES = new Set<WorkflowTriggerType>([
  'CLIENT_CREATED',
  'DEAL_WON',
  'PROJECT_CREATED',
  'TASK_COMPLETED',
  'INVOICE_PAID',
]);

const VALID_ACTION_TYPES = new Set<WorkflowActionType>([
  'CREATE_TASK',
  'SEND_EMAIL',
  'SEND_NOTIFICATION',
  'UPDATE_STATUS',
  'CREATE_ACTIVITY',
]);

const VALID_STATUSES = new Set<WorkflowStatus>(['ACTIVE', 'INACTIVE']);

export class WorkflowDomainService {
  validateCreate(input: CreateWorkflowValidationInput): void {
    this.assertNameRequired(input.name);

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }

    if (input.triggers.length === 0) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.TRIGGER_REQUIRED,
        'At least one trigger is required.',
      );
    }

    if (input.actions.length === 0) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.ACTION_REQUIRED,
        'At least one action is required.',
      );
    }

    for (const trigger of input.triggers) {
      this.assertTriggerTypeValid(trigger.type);
    }

    for (const action of input.actions) {
      this.assertActionTypeValid(action.type);
    }
  }

  assertWorkflowIsActive(workflow: { deletedAt: Date | null }): void {
    if (workflow.deletedAt !== null) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.WORKFLOW_ARCHIVED,
        'Workflow is archived and cannot be modified.',
      );
    }
  }

  normalizeName(name: string): string {
    return name.trim();
  }

  normalizeOptionalDescription(description: string | null | undefined): string | null {
    if (description === undefined || description === null) {
      return null;
    }

    const trimmed = description.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private assertNameRequired(name: string): void {
    if (name.trim().length === 0) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.NAME_REQUIRED,
        'Workflow name is required.',
      );
    }
  }

  private assertStatusValid(status: WorkflowStatus): void {
    if (!VALID_STATUSES.has(status)) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Workflow status is invalid.',
      );
    }
  }

  private assertTriggerTypeValid(type: WorkflowTriggerType): void {
    if (!VALID_TRIGGER_TYPES.has(type)) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.INVALID_TRIGGER_TYPE,
        'Workflow trigger type is invalid.',
      );
    }
  }

  private assertActionTypeValid(type: WorkflowActionType): void {
    if (!VALID_ACTION_TYPES.has(type)) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.INVALID_ACTION_TYPE,
        'Workflow action type is invalid.',
      );
    }
  }
}
