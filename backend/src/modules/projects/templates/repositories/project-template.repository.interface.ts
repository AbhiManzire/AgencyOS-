import type {
  ClientDocumentFolder,
  Prisma,
  ProjectServiceType,
  TaskPriority,
} from '@prisma/client';

export interface ProjectTemplateScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type ProjectTemplateTransactionClient = Prisma.TransactionClient;

export interface ProjectTemplateMilestoneRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly offsetDays: number;
  readonly sortOrder: number;
}

export interface ProjectTemplateTaskRecord {
  readonly id: string;
  readonly templateMilestoneId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly priority: TaskPriority;
  readonly estimatedHours: number | null;
  readonly offsetDays: number;
  readonly sortOrder: number;
  readonly checklistJson: unknown;
}

export interface ProjectTemplateDeliverableRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly sortOrder: number;
}

export interface ProjectTemplateRequiredDocumentRecord {
  readonly id: string;
  readonly title: string;
  readonly folder: ClientDocumentFolder | null;
  readonly sortOrder: number;
}

export interface ProjectTemplateRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string | null;
  readonly serviceType: ProjectServiceType;
  readonly defaultDurationDays: number | null;
  readonly defaultEstimatedHours: number | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
  readonly milestones: readonly ProjectTemplateMilestoneRecord[];
  readonly tasks: readonly ProjectTemplateTaskRecord[];
  readonly deliverables: readonly ProjectTemplateDeliverableRecord[];
  readonly requiredDocuments: readonly ProjectTemplateRequiredDocumentRecord[];
}

export interface NestedTemplateMilestoneInput {
  readonly name: string;
  readonly description?: string | null;
  readonly offsetDays?: number;
  readonly sortOrder?: number;
  readonly tempKey?: string;
}

export interface NestedTemplateTaskInput {
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

export interface NestedTemplateDeliverableInput {
  readonly title: string;
  readonly description?: string | null;
  readonly sortOrder?: number;
}

export interface NestedTemplateRequiredDocumentInput {
  readonly title: string;
  readonly folder?: ClientDocumentFolder | null;
  readonly sortOrder?: number;
}

export interface CreateProjectTemplateData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly serviceType: ProjectServiceType;
  readonly defaultDurationDays?: number | null;
  readonly defaultEstimatedHours?: number | null;
  readonly isActive?: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
  readonly milestones?: readonly NestedTemplateMilestoneInput[];
  readonly tasks?: readonly NestedTemplateTaskInput[];
  readonly deliverables?: readonly NestedTemplateDeliverableInput[];
  readonly requiredDocuments?: readonly NestedTemplateRequiredDocumentInput[];
}

export interface UpdateProjectTemplateData {
  readonly name?: string;
  readonly description?: string | null;
  readonly serviceType?: ProjectServiceType;
  readonly defaultDurationDays?: number | null;
  readonly defaultEstimatedHours?: number | null;
  readonly isActive?: boolean;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
  readonly milestones?: readonly NestedTemplateMilestoneInput[];
  readonly tasks?: readonly NestedTemplateTaskInput[];
  readonly deliverables?: readonly NestedTemplateDeliverableInput[];
  readonly requiredDocuments?: readonly NestedTemplateRequiredDocumentInput[];
  readonly replaceChildren?: boolean;
}

export interface ProjectTemplateRepository {
  create(
    data: CreateProjectTemplateData,
    tx?: ProjectTemplateTransactionClient,
  ): Promise<ProjectTemplateRecord>;
  update(
    scope: ProjectTemplateScope,
    id: string,
    data: UpdateProjectTemplateData,
    tx?: ProjectTemplateTransactionClient,
  ): Promise<ProjectTemplateRecord | null>;
  softDelete(
    scope: ProjectTemplateScope,
    id: string,
    deletedAt: Date,
    deletedByUserId: string | null,
  ): Promise<ProjectTemplateRecord | null>;
  findById(
    scope: ProjectTemplateScope,
    id: string,
    options?: { includeDeleted?: boolean },
  ): Promise<ProjectTemplateRecord | null>;
  findByName(scope: ProjectTemplateScope, name: string): Promise<ProjectTemplateRecord | null>;
  list(scope: ProjectTemplateScope): Promise<readonly ProjectTemplateRecord[]>;
  countActive(scope: ProjectTemplateScope): Promise<number>;
}

export const PROJECT_TEMPLATE_REPOSITORY = Symbol('PROJECT_TEMPLATE_REPOSITORY');
