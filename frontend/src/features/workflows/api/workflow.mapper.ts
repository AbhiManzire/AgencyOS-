import type { WorkflowRecord } from '@/features/workflows/api/workflow.types';
import type { WorkflowListItem } from '@/features/workflows/types';

export function workflowRecordToListItem(record: WorkflowRecord): WorkflowListItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: record.status,
    triggerTypes: record.triggers.map((trigger) => trigger.type),
    actionTypes: record.actions.map((action) => action.type),
    updatedAt: record.updatedAt,
  };
}
