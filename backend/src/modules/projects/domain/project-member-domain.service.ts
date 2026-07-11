import type { ProjectMemberRole, ProjectMemberStatus } from '@prisma/client';
import {
  PROJECT_MEMBER_DOMAIN_ERROR_CODES,
  ProjectMemberDomainError,
} from './project-member-domain.errors';
import {
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUSES,
  type CreateProjectMemberValidationInput,
  type UpdateProjectMemberValidationInput,
} from './project-member-domain.types';

export class ProjectMemberDomainService {
  validateCreate(input: CreateProjectMemberValidationInput): void {
    this.assertUserIdRequired(input.userId);
    this.assertValidRole(input.role ?? 'DEVELOPER');
    this.assertValidStatus(input.status ?? 'ACTIVE');
    this.assertAllocation(input.allocationPercent);
  }

  validateUpdate(input: UpdateProjectMemberValidationInput): void {
    if (input.role !== undefined) {
      this.assertValidRole(input.role);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
    }

    if (input.allocationPercent !== undefined) {
      this.assertAllocation(input.allocationPercent);
    }
  }

  private assertUserIdRequired(userId: string): void {
    if (userId.trim().length === 0) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.USER_ID_REQUIRED,
        'Workspace user is required.',
      );
    }
  }

  private assertValidRole(role: ProjectMemberRole): void {
    if (!PROJECT_MEMBER_ROLES.includes(role)) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.INVALID_ROLE,
        'Project member role is invalid.',
      );
    }
  }

  private assertValidStatus(status: ProjectMemberStatus): void {
    if (!PROJECT_MEMBER_STATUSES.includes(status)) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Project member status is invalid.',
      );
    }
  }

  private assertAllocation(allocationPercent: number | null | undefined): void {
    if (allocationPercent === undefined || allocationPercent === null) {
      return;
    }

    if (!Number.isInteger(allocationPercent) || allocationPercent < 0 || allocationPercent > 100) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.INVALID_ALLOCATION,
        'Allocation must be an integer between 0 and 100.',
      );
    }
  }
}
