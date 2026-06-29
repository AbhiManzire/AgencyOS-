import type { CreateWorkflowPayload } from '@/features/workflows/api/workflow.types';
import type {
  WorkflowActionType,
  WorkflowFormErrors,
  WorkflowFormValues,
  WorkflowTriggerType,
} from '@/features/workflows/types';

export const DEFAULT_WORKFLOW_FORM_VALUES: WorkflowFormValues = {
  name: '',
  description: '',
  status: 'ACTIVE',
  triggers: [],
  actions: [],
};

export function areWorkflowFormValuesEqual(
  left: WorkflowFormValues,
  right: WorkflowFormValues,
): boolean {
  return (
    left.name === right.name &&
    left.description === right.description &&
    left.status === right.status &&
    left.triggers.join(',') === right.triggers.join(',') &&
    left.actions.join(',') === right.actions.join(',')
  );
}

export function validateWorkflowForm(values: WorkflowFormValues): WorkflowFormErrors {
  const errors: WorkflowFormErrors = {};

  if (values.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (values.name.trim().length > 255) {
    errors.name = 'Name must be 255 characters or fewer';
  }

  if (values.triggers.length === 0) {
    errors.triggers = 'Select at least one trigger';
  }

  if (values.actions.length === 0) {
    errors.actions = 'Select at least one action';
  }

  return errors;
}

export function toCreateWorkflowPayload(values: WorkflowFormValues): CreateWorkflowPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    status: values.status,
    triggers: values.triggers.map((type, index) => ({
      type,
      sortOrder: index,
    })),
    actions: values.actions.map((type, index) => ({
      type,
      sortOrder: index,
    })),
  };
}

export function toggleTriggerSelection(
  current: readonly WorkflowTriggerType[],
  type: WorkflowTriggerType,
): WorkflowTriggerType[] {
  return current.includes(type) ? current.filter((item) => item !== type) : [...current, type];
}

export function toggleActionSelection(
  current: readonly WorkflowActionType[],
  type: WorkflowActionType,
): WorkflowActionType[] {
  return current.includes(type) ? current.filter((item) => item !== type) : [...current, type];
}
