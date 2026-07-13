export type WorkflowStatus = 'ACTIVE' | 'INACTIVE';

export type WorkflowTriggerType =
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'LEAD_ASSIGNED'
  | 'LEAD_QUALIFIED'
  | 'LEAD_CONVERTED'
  | 'DEAL_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'CLIENT_CREATED'
  | 'PROJECT_CREATED'
  | 'INVOICE_CREATED'
  | 'INVOICE_PAID'
  | 'PAYMENT_RECEIVED'
  | 'TASK_COMPLETED'
  | 'REMINDER_DUE'
  | 'REMINDER_OVERDUE'
  | 'DOCUMENT_UPLOADED'
  | 'USER_CREATED'
  | 'CUSTOM_EVENT';

export type WorkflowActionType =
  | 'ASSIGN_OWNER'
  | 'CHANGE_STATUS'
  | 'UPDATE_STATUS'
  | 'CREATE_TASK'
  | 'CREATE_REMINDER'
  | 'CREATE_ACTIVITY'
  | 'CREATE_NOTIFICATION'
  | 'SEND_NOTIFICATION'
  | 'SEND_EMAIL'
  | 'SEND_WHATSAPP'
  | 'CREATE_PROJECT'
  | 'CREATE_INVOICE'
  | 'ADD_TAGS'
  | 'UPDATE_FIELD'
  | 'CALL_WEBHOOK'
  | 'RUN_INTERNAL_ACTION';

export type WorkflowConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'BETWEEN'
  | 'EMPTY'
  | 'NOT_EMPTY'
  | 'IS_SET'
  | 'IS_NOT_SET';

export type WorkflowConditionLogic = 'AND' | 'OR';

export type WorkflowConditionNodeType = 'CONDITION' | 'GROUP';

export type WorkflowActionDelayType =
  'IMMEDIATE' | 'MINUTES' | 'HOURS' | 'DAYS' | 'SPECIFIC_DATE' | 'RECURRING';

export type WorkflowExecutionStatus =
  'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'RETRYING' | 'CANCELLED' | 'SKIPPED';

export type WorkflowExecutionLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface WorkflowListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: WorkflowStatus;
  readonly isEnabled: boolean;
  readonly version: number | null;
  readonly triggerTypes: readonly WorkflowTriggerType[];
  readonly actionTypes: readonly WorkflowActionType[];
  readonly updatedAt: string;
}

export interface WorkflowConditionFormNode {
  readonly key: string;
  readonly nodeType: WorkflowConditionNodeType;
  readonly logic: WorkflowConditionLogic;
  readonly field: string;
  readonly operator: WorkflowConditionOperator;
  readonly value: string;
  readonly children: readonly WorkflowConditionFormNode[];
}

export interface WorkflowActionFormItem {
  readonly key: string;
  readonly type: WorkflowActionType;
  readonly ownerUserId: string;
  readonly status: string;
  readonly title: string;
  readonly url: string;
  readonly field: string;
  readonly value: string;
  readonly tags: string;
  readonly actionKey: string;
  readonly configJson: string;
  readonly delayType: WorkflowActionDelayType;
  readonly delayValue: string;
}

export interface WorkflowFormValues {
  readonly name: string;
  readonly description: string;
  readonly status: WorkflowStatus;
  readonly isEnabled: boolean;
  readonly triggers: readonly WorkflowTriggerType[];
  readonly conditions: readonly WorkflowConditionFormNode[];
  readonly rootLogic: WorkflowConditionLogic;
  readonly actions: readonly WorkflowActionFormItem[];
}

export interface WorkflowFormErrors {
  name?: string;
  triggers?: string;
  actions?: string;
  conditions?: string;
  form?: string;
}

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  LEAD_CREATED: 'Lead Created',
  LEAD_UPDATED: 'Lead Updated',
  LEAD_ASSIGNED: 'Lead Assigned',
  LEAD_QUALIFIED: 'Lead Qualified',
  LEAD_CONVERTED: 'Lead Converted',
  DEAL_CREATED: 'Deal Created',
  DEAL_STAGE_CHANGED: 'Deal Stage Changed',
  DEAL_WON: 'Deal Won',
  DEAL_LOST: 'Deal Lost',
  CLIENT_CREATED: 'Client Created',
  PROJECT_CREATED: 'Project Created',
  INVOICE_CREATED: 'Invoice Created',
  INVOICE_PAID: 'Invoice Paid',
  PAYMENT_RECEIVED: 'Payment Received',
  TASK_COMPLETED: 'Task Completed',
  REMINDER_DUE: 'Reminder Due',
  REMINDER_OVERDUE: 'Reminder Overdue',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  USER_CREATED: 'User Created',
  CUSTOM_EVENT: 'Custom Event',
};

export const WORKFLOW_ACTION_LABELS: Record<WorkflowActionType, string> = {
  ASSIGN_OWNER: 'Assign Owner',
  CHANGE_STATUS: 'Change Status',
  UPDATE_STATUS: 'Update Status',
  CREATE_TASK: 'Create Task',
  CREATE_REMINDER: 'Create Reminder',
  CREATE_ACTIVITY: 'Create Activity',
  CREATE_NOTIFICATION: 'Create Notification',
  SEND_NOTIFICATION: 'Send Notification',
  SEND_EMAIL: 'Send Email',
  SEND_WHATSAPP: 'Send WhatsApp',
  CREATE_PROJECT: 'Create Project',
  CREATE_INVOICE: 'Create Invoice',
  ADD_TAGS: 'Add Tags',
  UPDATE_FIELD: 'Update Field',
  CALL_WEBHOOK: 'Call Webhook',
  RUN_INTERNAL_ACTION: 'Run Internal Action',
};

export const WORKFLOW_CONDITION_OPERATOR_LABELS: Record<WorkflowConditionOperator, string> = {
  EQUALS: 'Equals',
  NOT_EQUALS: 'Not equals',
  CONTAINS: 'Contains',
  STARTS_WITH: 'Starts with',
  ENDS_WITH: 'Ends with',
  GREATER_THAN: 'Greater than',
  LESS_THAN: 'Less than',
  BETWEEN: 'Between',
  EMPTY: 'Empty',
  NOT_EMPTY: 'Not empty',
  IS_SET: 'Is set',
  IS_NOT_SET: 'Is not set',
};

export const WORKFLOW_CONDITION_LOGIC_LABELS: Record<WorkflowConditionLogic, string> = {
  AND: 'AND',
  OR: 'OR',
};

export const WORKFLOW_ACTION_DELAY_LABELS: Record<WorkflowActionDelayType, string> = {
  IMMEDIATE: 'Immediate',
  MINUTES: 'Minutes',
  HOURS: 'Hours',
  DAYS: 'Days',
  SPECIFIC_DATE: 'Specific date',
  RECURRING: 'Recurring',
};

export const WORKFLOW_EXECUTION_STATUS_LABELS: Record<WorkflowExecutionStatus, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  RETRYING: 'Retrying',
  CANCELLED: 'Cancelled',
  SKIPPED: 'Skipped',
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

export const WORKFLOW_CONDITION_OPERATOR_OPTIONS = Object.entries(
  WORKFLOW_CONDITION_OPERATOR_LABELS,
).map(([value, label]) => ({
  value: value as WorkflowConditionOperator,
  label,
}));

export const WORKFLOW_ACTION_DELAY_OPTIONS = Object.entries(WORKFLOW_ACTION_DELAY_LABELS).map(
  ([value, label]) => ({
    value: value as WorkflowActionDelayType,
    label,
  }),
);

export const OPERATORS_WITHOUT_VALUE: ReadonlySet<WorkflowConditionOperator> = new Set([
  'EMPTY',
  'NOT_EMPTY',
  'IS_SET',
  'IS_NOT_SET',
]);
