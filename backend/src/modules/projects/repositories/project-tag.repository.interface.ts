export const PROJECT_TAG_REPOSITORY = Symbol('PROJECT_TAG_REPOSITORY');

export interface ProjectTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: Date;
}

export interface ProjectTagScope {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
}

export interface EnsureTagData {
  readonly id: string;
  readonly name: string;
  readonly colorToken?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface ProjectTagRepository {
  listByProject(scope: ProjectTagScope): Promise<readonly ProjectTagRecord[]>;
  findTagByName(
    scope: Pick<ProjectTagScope, 'tenantId' | 'workspaceId'>,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    colorToken: string | null;
    description: string | null;
  } | null>;
  createTag(
    scope: Pick<ProjectTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureTagData,
  ): Promise<{ id: string; name: string; colorToken: string | null; description: string | null }>;
  isAssigned(scope: ProjectTagScope, tagId: string): Promise<boolean>;
  assign(scope: ProjectTagScope, tagId: string, assignedAt: Date): Promise<ProjectTagRecord>;
  unassign(scope: ProjectTagScope, tagId: string): Promise<boolean>;
}
