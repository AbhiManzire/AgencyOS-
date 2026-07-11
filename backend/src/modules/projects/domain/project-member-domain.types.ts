import type { ProjectMemberRole, ProjectMemberStatus } from '@prisma/client';

export const PROJECT_MEMBER_ROLES: readonly ProjectMemberRole[] = [
  'MANAGER',
  'DEVELOPER',
  'DESIGNER',
  'QA',
  'VIEWER',
];
export const PROJECT_MEMBER_STATUSES: readonly ProjectMemberStatus[] = ['ACTIVE', 'INACTIVE'];

export interface CreateProjectMemberValidationInput {
  readonly userId: string;
  readonly role?: ProjectMemberRole;
  readonly allocationPercent?: number | null;
  readonly status?: ProjectMemberStatus;
}

export interface UpdateProjectMemberValidationInput {
  readonly role?: ProjectMemberRole;
  readonly allocationPercent?: number | null;
  readonly status?: ProjectMemberStatus;
}
