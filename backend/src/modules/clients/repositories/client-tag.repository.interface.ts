export const CLIENT_TAG_REPOSITORY = Symbol('CLIENT_TAG_REPOSITORY');

export interface ClientTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: Date;
}

export interface ClientTagScope {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
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

export interface ClientTagRepository {
  listByClient(scope: ClientTagScope): Promise<readonly ClientTagRecord[]>;
  findTagByName(
    scope: Pick<ClientTagScope, 'tenantId' | 'workspaceId'>,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    colorToken: string | null;
    description: string | null;
  } | null>;
  createTag(
    scope: Pick<ClientTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureTagData,
  ): Promise<{ id: string; name: string; colorToken: string | null; description: string | null }>;
  isAssigned(scope: ClientTagScope, tagId: string): Promise<boolean>;
  assign(scope: ClientTagScope, tagId: string, assignedAt: Date): Promise<ClientTagRecord>;
  unassign(scope: ClientTagScope, tagId: string): Promise<boolean>;
}
