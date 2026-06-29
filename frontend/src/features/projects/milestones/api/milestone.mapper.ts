import type { ProjectMilestoneRecord } from '@/features/projects/milestones/api/milestone.types';
import type { ProjectMilestoneListItem } from '@/features/projects/milestones/types';

/** Maps an API project milestone record to the list row shape. */
export function projectMilestoneRecordToListItem(
  record: ProjectMilestoneRecord,
): ProjectMilestoneListItem {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    description: record.description,
    status: record.status,
    startDate: record.startDate,
    dueDate: record.dueDate,
    progressPercent: record.progressPercent,
    ownerUserId: record.ownerUserId,
    ownerDisplayName: record.ownerDisplayName ?? record.ownerEmail ?? '—',
    ownerEmail: record.ownerEmail ?? '—',
  };
}
