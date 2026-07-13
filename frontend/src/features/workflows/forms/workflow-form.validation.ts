import type {
  CreateWorkflowActionPayload,
  CreateWorkflowConditionPayload,
  CreateWorkflowPayload,
  UpdateWorkflowPayload,
  WorkflowActionRecord,
  WorkflowConditionRecord,
  WorkflowRecord,
} from '@/features/workflows/api/workflow.types';
import type {
  WorkflowActionDelayType,
  WorkflowActionFormItem,
  WorkflowActionType,
  WorkflowConditionFormNode,
  WorkflowConditionLogic,
  WorkflowConditionOperator,
  WorkflowFormErrors,
  WorkflowFormValues,
  WorkflowTriggerType,
} from '@/features/workflows/types';
import { OPERATORS_WITHOUT_VALUE } from '@/features/workflows/types';

let conditionKeyCounter = 0;
let actionKeyCounter = 0;

function nextConditionKey(): string {
  conditionKeyCounter += 1;
  return `condition-${String(conditionKeyCounter)}`;
}

function nextActionKey(): string {
  actionKeyCounter += 1;
  return `action-${String(actionKeyCounter)}`;
}

export function createEmptyConditionNode(
  nodeType: WorkflowConditionFormNode['nodeType'] = 'CONDITION',
): WorkflowConditionFormNode {
  return {
    key: nextConditionKey(),
    nodeType,
    logic: 'AND',
    field: '',
    operator: 'EQUALS',
    value: '',
    children: nodeType === 'GROUP' ? [] : [],
  };
}

export function createEmptyActionItem(
  type: WorkflowActionType = 'CREATE_TASK',
): WorkflowActionFormItem {
  return {
    key: nextActionKey(),
    type,
    ownerUserId: '',
    status: '',
    title: '',
    url: '',
    field: '',
    value: '',
    tags: '',
    actionKey: '',
    configJson: '',
    delayType: 'IMMEDIATE',
    delayValue: '',
  };
}

export function createDefaultWorkflowFormValues(): WorkflowFormValues {
  return {
    name: '',
    description: '',
    status: 'ACTIVE',
    isEnabled: true,
    triggers: [],
    conditions: [],
    rootLogic: 'AND',
    actions: [createEmptyActionItem()],
  };
}

export const DEFAULT_WORKFLOW_FORM_VALUES: WorkflowFormValues = createDefaultWorkflowFormValues();

export function areWorkflowFormValuesEqual(
  left: WorkflowFormValues,
  right: WorkflowFormValues,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
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
    errors.actions = 'Add at least one action';
  } else {
    for (const action of values.actions) {
      if (action.configJson.trim().length > 0) {
        try {
          JSON.parse(action.configJson);
        } catch {
          errors.actions = 'Action config JSON is invalid';
          break;
        }
      }
    }
  }

  for (const node of flattenConditionNodes(values.conditions)) {
    if (node.nodeType === 'CONDITION' && node.field.trim().length === 0) {
      errors.conditions = 'Condition fields are required';
      break;
    }
  }

  return errors;
}

function flattenConditionNodes(
  nodes: readonly WorkflowConditionFormNode[],
): WorkflowConditionFormNode[] {
  const result: WorkflowConditionFormNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...flattenConditionNodes(node.children));
    }
  }
  return result;
}

function parseConditionValue(operator: WorkflowConditionOperator, raw: string): unknown {
  if (OPERATORS_WITHOUT_VALUE.has(operator)) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (operator === 'BETWEEN') {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return parsed;
    } catch {
      const parts = trimmed.split(',').map((part) => part.trim());
      if (parts.length === 2) {
        return parts;
      }
    }
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function buildActionConfig(action: WorkflowActionFormItem): Record<string, unknown> {
  let config: Record<string, unknown> = {};

  if (action.configJson.trim().length > 0) {
    const parsed: unknown = JSON.parse(action.configJson);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      config = { ...(parsed as Record<string, unknown>) };
    }
  }

  if (action.ownerUserId.trim().length > 0) {
    config.ownerUserId = action.ownerUserId.trim();
  }
  if (action.status.trim().length > 0) {
    config.status = action.status.trim();
  }
  if (action.title.trim().length > 0) {
    config.title = action.title.trim();
  }
  if (action.url.trim().length > 0) {
    config.url = action.url.trim();
  }
  if (action.field.trim().length > 0) {
    config.field = action.field.trim();
  }
  if (action.value.trim().length > 0) {
    config.value = action.value.trim();
  }
  if (action.tags.trim().length > 0) {
    config.tags = action.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  if (action.actionKey.trim().length > 0) {
    config.actionKey = action.actionKey.trim();
  }

  return config;
}

function toConditionPayload(
  node: WorkflowConditionFormNode,
  sortOrder: number,
): CreateWorkflowConditionPayload {
  if (node.nodeType === 'GROUP') {
    return {
      nodeType: 'GROUP',
      logic: node.logic,
      sortOrder,
      children: node.children.map((child, index) => toConditionPayload(child, index)),
    };
  }

  return {
    nodeType: 'CONDITION',
    logic: node.logic,
    field: node.field.trim(),
    operator: node.operator,
    value: parseConditionValue(node.operator, node.value),
    sortOrder,
  };
}

function toActionPayload(
  action: WorkflowActionFormItem,
  sortOrder: number,
): CreateWorkflowActionPayload {
  const delayType: WorkflowActionDelayType = action.delayType;
  const delayValueRaw = action.delayValue.trim();
  let delayValue: number | null = null;
  let delayUntil: string | null = null;

  if (delayType === 'SPECIFIC_DATE' && delayValueRaw.length > 0) {
    delayUntil = new Date(delayValueRaw).toISOString();
  } else if (delayValueRaw.length > 0 && delayType !== 'IMMEDIATE') {
    const parsed = Number(delayValueRaw);
    delayValue = Number.isFinite(parsed) ? parsed : null;
  }

  return {
    type: action.type,
    config: buildActionConfig(action),
    sortOrder,
    delayType,
    delayValue,
    delayUntil,
  };
}

function wrapConditions(values: WorkflowFormValues): readonly CreateWorkflowConditionPayload[] {
  if (values.conditions.length === 0) {
    return [];
  }

  if (values.conditions.length === 1 && values.conditions[0]?.nodeType === 'GROUP') {
    return [toConditionPayload(values.conditions[0], 0)];
  }

  return [
    {
      nodeType: 'GROUP',
      logic: values.rootLogic,
      sortOrder: 0,
      children: values.conditions.map((node, index) => toConditionPayload(node, index)),
    },
  ];
}

export function toCreateWorkflowPayload(values: WorkflowFormValues): CreateWorkflowPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    status: values.isEnabled ? 'ACTIVE' : 'INACTIVE',
    isEnabled: values.isEnabled,
    triggers: values.triggers.map((type, index) => ({
      type,
      sortOrder: index,
    })),
    actions: values.actions.map((action, index) => toActionPayload(action, index)),
    conditions: wrapConditions(values),
  };
}

export function toUpdateWorkflowPayload(values: WorkflowFormValues): UpdateWorkflowPayload {
  return toCreateWorkflowPayload(values);
}

export function toggleTriggerSelection(
  current: readonly WorkflowTriggerType[],
  type: WorkflowTriggerType,
): WorkflowTriggerType[] {
  return current.includes(type) ? current.filter((item) => item !== type) : [...current, type];
}

function configString(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function knownConfigKeys(): ReadonlySet<string> {
  return new Set(['ownerUserId', 'status', 'title', 'url', 'field', 'value', 'tags', 'actionKey']);
}

function actionRecordToFormItem(action: WorkflowActionRecord): WorkflowActionFormItem {
  const config = action.config;

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (!knownConfigKeys().has(key)) {
      extra[key] = value;
    }
  }

  const tagsValue = config.tags;
  const tags = Array.isArray(tagsValue)
    ? tagsValue.map(String).join(', ')
    : typeof tagsValue === 'string'
      ? tagsValue
      : '';

  let delayValue = '';
  if (action.delayType === 'SPECIFIC_DATE' && action.delayUntil) {
    delayValue = action.delayUntil.slice(0, 16);
  } else if (action.delayValue != null) {
    delayValue = String(action.delayValue);
  }

  return {
    key: nextActionKey(),
    type: action.type,
    ownerUserId: configString(config, 'ownerUserId'),
    status: configString(config, 'status'),
    title: configString(config, 'title'),
    url: configString(config, 'url'),
    field: configString(config, 'field'),
    value: configString(config, 'value'),
    tags,
    actionKey: configString(config, 'actionKey'),
    configJson: Object.keys(extra).length > 0 ? JSON.stringify(extra, null, 2) : '',
    delayType: action.delayType ?? 'IMMEDIATE',
    delayValue,
  };
}

function conditionValueToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function conditionRecordToFormNode(record: WorkflowConditionRecord): WorkflowConditionFormNode {
  return {
    key: nextConditionKey(),
    nodeType: record.nodeType,
    logic: record.logic,
    field: record.field ?? '',
    operator: record.operator ?? 'EQUALS',
    value: conditionValueToString(record.value),
    children: (record.children ?? []).map(conditionRecordToFormNode),
  };
}

function buildConditionTreeFromFlat(
  records: readonly WorkflowConditionRecord[],
): WorkflowConditionFormNode[] {
  const byParent = new Map<string | null, WorkflowConditionRecord[]>();
  for (const record of records) {
    const parentKey = record.parentId;
    const existing = byParent.get(parentKey) ?? [];
    existing.push(record);
    byParent.set(parentKey, existing);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function build(parentId: string | null): WorkflowConditionFormNode[] {
    return (byParent.get(parentId) ?? []).map((record) => ({
      key: nextConditionKey(),
      nodeType: record.nodeType,
      logic: record.logic,
      field: record.field ?? '',
      operator: record.operator ?? 'EQUALS',
      value: conditionValueToString(record.value),
      children: build(record.id),
    }));
  }

  return build(null);
}

export function workflowRecordToFormValues(record: WorkflowRecord): WorkflowFormValues {
  const rawConditions = record.conditions ?? [];
  const hasNestedChildren = rawConditions.some(
    (condition) => (condition.children?.length ?? 0) > 0,
  );

  let conditions: WorkflowConditionFormNode[];
  let rootLogic: WorkflowConditionLogic = 'AND';

  if (rawConditions.length === 0) {
    conditions = [];
  } else if (hasNestedChildren) {
    conditions = rawConditions.map(conditionRecordToFormNode);
  } else if (rawConditions.every((condition) => condition.parentId != null || condition.id)) {
    conditions = buildConditionTreeFromFlat(rawConditions);
  } else {
    conditions = rawConditions.map(conditionRecordToFormNode);
  }

  if (
    conditions.length === 1 &&
    conditions[0]?.nodeType === 'GROUP' &&
    conditions[0].children.length > 0
  ) {
    rootLogic = conditions[0].logic;
    conditions = [...conditions[0].children];
  }

  return {
    name: record.name,
    description: record.description ?? '',
    status: record.status,
    isEnabled: record.isEnabled ?? record.status === 'ACTIVE',
    triggers: record.triggers.map((trigger) => trigger.type),
    conditions,
    rootLogic,
    actions:
      record.actions.length > 0
        ? record.actions.map(actionRecordToFormItem)
        : [createEmptyActionItem()],
  };
}

export function updateConditionNode(
  nodes: readonly WorkflowConditionFormNode[],
  key: string,
  updater: (node: WorkflowConditionFormNode) => WorkflowConditionFormNode,
): WorkflowConditionFormNode[] {
  return nodes.map((node) => {
    if (node.key === key) {
      return updater(node);
    }
    if (node.children.length === 0) {
      return node;
    }
    return {
      ...node,
      children: updateConditionNode(node.children, key, updater),
    };
  });
}

export function removeConditionNode(
  nodes: readonly WorkflowConditionFormNode[],
  key: string,
): WorkflowConditionFormNode[] {
  return nodes
    .filter((node) => node.key !== key)
    .map((node) => ({
      ...node,
      children: removeConditionNode(node.children, key),
    }));
}

export function addChildConditionNode(
  nodes: readonly WorkflowConditionFormNode[],
  parentKey: string,
  child: WorkflowConditionFormNode,
): WorkflowConditionFormNode[] {
  return nodes.map((node) => {
    if (node.key === parentKey) {
      return {
        ...node,
        nodeType: 'GROUP',
        children: [...node.children, child],
      };
    }
    if (node.children.length === 0) {
      return node;
    }
    return {
      ...node,
      children: addChildConditionNode(node.children, parentKey, child),
    };
  });
}
