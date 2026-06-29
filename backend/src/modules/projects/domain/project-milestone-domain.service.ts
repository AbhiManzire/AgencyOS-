import type { ProjectMilestoneStatus } from '@prisma/client';
import {
  PROJECT_MILESTONE_DOMAIN_ERROR_CODES,
  ProjectMilestoneDomainError,
} from './project-milestone-domain.errors';
import {
  PROJECT_MILESTONE_STATUSES,
  type CreateProjectMilestoneValidationInput,
  type UpdateProjectMilestoneValidationInput,
} from './project-milestone-domain.types';

export class ProjectMilestoneDomainService {
  validateCreate(input: CreateProjectMilestoneValidationInput): void {
    this.assertNameRequired(input.name);
    this.assertValidStatus(input.status ?? 'PLANNED');
    this.assertDateRange(input.startDate, input.dueDate);
  }

  validateUpdate(input: UpdateProjectMilestoneValidationInput): void {
    if (input.name !== undefined) {
      this.assertNameRequired(input.name);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
    }

    if (input.startDate !== undefined || input.dueDate !== undefined) {
      this.assertDateRange(input.startDate ?? null, input.dueDate ?? null);
    }
  }

  private assertNameRequired(name: string): void {
    if (name.trim().length === 0) {
      throw new ProjectMilestoneDomainError(
        PROJECT_MILESTONE_DOMAIN_ERROR_CODES.NAME_REQUIRED,
        'Milestone name is required.',
      );
    }
  }

  private assertValidStatus(status: ProjectMilestoneStatus): void {
    if (!PROJECT_MILESTONE_STATUSES.includes(status)) {
      throw new ProjectMilestoneDomainError(
        PROJECT_MILESTONE_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Milestone status is invalid.',
      );
    }
  }

  private assertDateRange(
    startDate: Date | null | undefined,
    dueDate: Date | null | undefined,
  ): void {
    if (
      startDate === null ||
      startDate === undefined ||
      dueDate === null ||
      dueDate === undefined
    ) {
      return;
    }

    if (dueDate.getTime() < startDate.getTime()) {
      throw new ProjectMilestoneDomainError(
        PROJECT_MILESTONE_DOMAIN_ERROR_CODES.INVALID_DATE_RANGE,
        'Due date must be on or after the start date.',
      );
    }
  }
}
