export const LEAD_TAG_REPOSITORY = Symbol('LEAD_TAG_REPOSITORY');

export interface LeadTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: Date;
}

export interface LeadTagScope {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly leadId: string;
}

export interface EnsureLeadTagData {
  readonly id: string;
  readonly name: string;
  readonly colorToken?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface LeadTagRepository {
  listByLead(scope: LeadTagScope): Promise<readonly LeadTagRecord[]>;
  findTagByName(
    scope: Pick<LeadTagScope, 'tenantId' | 'workspaceId'>,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    colorToken: string | null;
    description: string | null;
  } | null>;
  createTag(
    scope: Pick<LeadTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureLeadTagData,
  ): Promise<{ id: string; name: string; colorToken: string | null; description: string | null }>;
  isAssigned(scope: LeadTagScope, tagId: string): Promise<boolean>;
  assign(scope: LeadTagScope, tagId: string, assignedAt: Date): Promise<LeadTagRecord>;
  unassign(scope: LeadTagScope, tagId: string): Promise<boolean>;
}
