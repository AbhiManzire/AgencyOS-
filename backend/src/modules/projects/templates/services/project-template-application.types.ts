import type { ClientDocumentFolder, ProjectServiceType, TaskPriority } from '@prisma/client';
import type { ProjectTemplateRecord } from '../repositories/project-template.repository.interface';

export interface ProjectTemplateApplicationContext {
  readonly actorUserId: string;
}

export interface NestedMilestoneCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly offsetDays?: number;
  readonly sortOrder?: number;
  readonly tempKey?: string;
}

export interface NestedTaskCommand {
  readonly title: string;
  readonly description?: string | null;
  readonly priority?: TaskPriority;
  readonly estimatedHours?: number | null;
  readonly offsetDays?: number;
  readonly sortOrder?: number;
  readonly checklistJson?: unknown;
  readonly milestoneTempKey?: string | null;
  readonly milestoneSortOrder?: number | null;
}

export interface NestedDeliverableCommand {
  readonly title: string;
  readonly description?: string | null;
  readonly sortOrder?: number;
}

export interface NestedRequiredDocumentCommand {
  readonly title: string;
  readonly folder?: ClientDocumentFolder | null;
  readonly sortOrder?: number;
}

export interface CreateProjectTemplateCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly serviceType: ProjectServiceType;
  readonly defaultDurationDays?: number | null;
  readonly defaultEstimatedHours?: number | null;
  readonly isActive?: boolean;
  readonly milestones?: readonly NestedMilestoneCommand[];
  readonly tasks?: readonly NestedTaskCommand[];
  readonly deliverables?: readonly NestedDeliverableCommand[];
  readonly requiredDocuments?: readonly NestedRequiredDocumentCommand[];
}

export interface UpdateProjectTemplateCommand {
  readonly name?: string;
  readonly description?: string | null;
  readonly serviceType?: ProjectServiceType;
  readonly defaultDurationDays?: number | null;
  readonly defaultEstimatedHours?: number | null;
  readonly isActive?: boolean;
  readonly milestones?: readonly NestedMilestoneCommand[];
  readonly tasks?: readonly NestedTaskCommand[];
  readonly deliverables?: readonly NestedDeliverableCommand[];
  readonly requiredDocuments?: readonly NestedRequiredDocumentCommand[];
}

export type { ProjectTemplateRecord };
