export type WorkflowStatus = 'ACTIVE' | 'INACTIVE';

export type WorkflowTriggerType =
  'CLIENT_CREATED' | 'DEAL_WON' | 'PROJECT_CREATED' | 'TASK_COMPLETED' | 'INVOICE_PAID';

export type WorkflowActionType =
  'CREATE_TASK' | 'SEND_EMAIL' | 'SEND_NOTIFICATION' | 'UPDATE_STATUS' | 'CREATE_ACTIVITY';

export interface WorkflowListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: WorkflowStatus;
  readonly triggerTypes: readonly WorkflowTriggerType[];
  readonly actionTypes: readonly WorkflowActionType[];
  readonly updatedAt: string;
}

export interface WorkflowFormValues {
  readonly name: string;
  readonly description: string;
  readonly status: WorkflowStatus;
  readonly triggers: readonly WorkflowTriggerType[];
  readonly actions: readonly WorkflowActionType[];
}

export interface WorkflowFormErrors {
  name?: string;
  triggers?: string;
  actions?: string;
  form?: string;
}

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  CLIENT_CREATED: 'Client Created',
  DEAL_WON: 'Deal Won',
  PROJECT_CREATED: 'Project Created',
  TASK_COMPLETED: 'Task Completed',
  INVOICE_PAID: 'Invoice Paid',
};

export const WORKFLOW_ACTION_LABELS: Record<WorkflowActionType, string> = {
  CREATE_TASK: 'Create Task',
  SEND_EMAIL: 'Send Email',
  SEND_NOTIFICATION: 'Send Notification',
  UPDATE_STATUS: 'Update Status',
  CREATE_ACTIVITY: 'Create Activity',
};

export const WORKFLOW_TRIGGER_OPTIONS = Object.entries(WORKFLOW_TRIGGER_LABELS).map(
  ([value, label]) => ({
    value: value as WorkflowTriggerType,
    label,
  }),
);

export const WORKFLOW_ACTION_OPTIONS = Object.entries(WORKFLOW_ACTION_LABELS).map(
  ([value, label]) => ({
    value: value as WorkflowActionType,
    label,
  }),
);
