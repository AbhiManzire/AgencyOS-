import type {
  WorkflowActionType,
  WorkflowConditionNodeType,
  WorkflowConditionOperator,
  WorkflowStatus,
  WorkflowTriggerType,
} from '@prisma/client';
import { WORKFLOW_DOMAIN_ERROR_CODES, WorkflowDomainError } from './workflow-domain.errors';
import type {
  CreateWorkflowValidationInput,
  UpdateWorkflowValidationInput,
} from './workflow-domain.types';

const VALID_TRIGGER_TYPES = new Set<WorkflowTriggerType>([
  'LEAD_CREATED',
  'LEAD_UPDATED',
  'LEAD_ASSIGNED',
  'LEAD_QUALIFIED',
  'LEAD_CONVERTED',
  'DEAL_CREATED',
  'DEAL_STAGE_CHANGED',
  'DEAL_WON',
  'DEAL_LOST',
  'CLIENT_CREATED',
  'PROJECT_CREATED',
  'INVOICE_CREATED',
  'INVOICE_PAID',
  'PAYMENT_RECEIVED',
  'TASK_COMPLETED',
  'REMINDER_DUE',
  'REMINDER_OVERDUE',
  'DOCUMENT_UPLOADED',
  'USER_CREATED',
  'CUSTOM_EVENT',
]);

const VALID_ACTION_TYPES = new Set<WorkflowActionType>([
  'ASSIGN_OWNER',
  'CHANGE_STATUS',
  'UPDATE_STATUS',
  'CREATE_TASK',
  'CREATE_REMINDER',
  'CREATE_ACTIVITY',
  'CREATE_NOTIFICATION',
  'SEND_NOTIFICATION',
  'SEND_EMAIL',
  'SEND_WHATSAPP',
  'CREATE_PROJECT',
  'CREATE_INVOICE',
  'ADD_TAGS',
  'UPDATE_FIELD',
  'CALL_WEBHOOK',
  'RUN_INTERNAL_ACTION',
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

    if (input.conditions !== undefined) {
      this.assertConditionsValid(input.conditions);
    }
  }

  validateUpdate(input: UpdateWorkflowValidationInput): void {
    if (input.name !== undefined) {
      this.assertNameRequired(input.name);
    }

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }

    if (input.triggers !== undefined) {
      if (input.triggers.length === 0) {
        throw new WorkflowDomainError(
          WORKFLOW_DOMAIN_ERROR_CODES.TRIGGER_REQUIRED,
          'At least one trigger is required.',
        );
      }
      for (const trigger of input.triggers) {
        this.assertTriggerTypeValid(trigger.type);
      }
    }

    if (input.actions !== undefined) {
      if (input.actions.length === 0) {
        throw new WorkflowDomainError(
          WORKFLOW_DOMAIN_ERROR_CODES.ACTION_REQUIRED,
          'At least one action is required.',
        );
      }
      for (const action of input.actions) {
        this.assertActionTypeValid(action.type);
      }
    }

    if (input.conditions !== undefined) {
      this.assertConditionsValid(input.conditions);
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

  private assertConditionsValid(
    conditions: readonly {
      readonly nodeType?: WorkflowConditionNodeType;
      readonly operator?: WorkflowConditionOperator | null;
      readonly field?: string | null;
    }[],
  ): void {
    for (const condition of conditions) {
      const nodeType = condition.nodeType ?? 'CONDITION';
      if (nodeType === 'CONDITION') {
        if (
          condition.field === undefined ||
          condition.field === null ||
          condition.field.trim() === ''
        ) {
          throw new WorkflowDomainError(
            WORKFLOW_DOMAIN_ERROR_CODES.INVALID_CONDITION,
            'Condition nodes require a field.',
          );
        }
        if (condition.operator === undefined || condition.operator === null) {
          throw new WorkflowDomainError(
            WORKFLOW_DOMAIN_ERROR_CODES.INVALID_CONDITION,
            'Condition nodes require an operator.',
          );
        }
      }
    }
  }
}
