export const DEAL_TAG_REPOSITORY = Symbol('DEAL_TAG_REPOSITORY');

export interface DealTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: Date;
}

export interface DealTagScope {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
}

export interface EnsureDealTagData {
  readonly id: string;
  readonly name: string;
  readonly colorToken?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface DealTagRepository {
  listByDeal(scope: DealTagScope): Promise<readonly DealTagRecord[]>;
  findTagByName(
    scope: Pick<DealTagScope, 'tenantId' | 'workspaceId'>,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    colorToken: string | null;
    description: string | null;
  } | null>;
  createTag(
    scope: Pick<DealTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureDealTagData,
  ): Promise<{ id: string; name: string; colorToken: string | null; description: string | null }>;
  isAssigned(scope: DealTagScope, tagId: string): Promise<boolean>;
  assign(scope: DealTagScope, tagId: string, assignedAt: Date): Promise<DealTagRecord>;
  unassign(scope: DealTagScope, tagId: string): Promise<boolean>;
}
