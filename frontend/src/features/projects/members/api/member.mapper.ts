import type { ProjectMemberRecord } from '@/features/projects/members/api/member.types';
import type { ProjectMemberListItem } from '@/features/projects/members/types';

/** Maps an API project member record to the list row shape. */
export function projectMemberRecordToListItem(record: ProjectMemberRecord): ProjectMemberListItem {
  return {
    id: record.id,
    projectId: record.projectId,
    userId: record.userId,
    userDisplayName: record.userDisplayName ?? record.userEmail ?? record.userId,
    userEmail: record.userEmail ?? '—',
    role: record.role,
    departmentName: record.departmentName ?? '—',
    assignedOn: record.startDate ?? record.createdAt,
    allocationPercent: record.allocationPercent,
    status: record.status,
  };
}
