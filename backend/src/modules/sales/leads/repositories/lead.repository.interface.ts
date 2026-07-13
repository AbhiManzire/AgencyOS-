import type { LeadPriority, LeadSource, LeadStatus, Prisma } from '@prisma/client';

export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');

/** Tenant and workspace scope required on every lead repository operation. */
export interface LeadScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type LeadTransactionClient = Prisma.TransactionClient;

export type LeadListSortField = 'updatedAt' | 'createdAt' | 'company' | 'leadScore' | 'priority';

export interface LeadRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly code: string | null;
  readonly company: string;
  readonly contactPerson: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly whatsapp: string | null;
  readonly website: string | null;
  readonly industry: string | null;
  readonly country: string | null;
  readonly source: LeadSource;
  readonly campaignId: string | null;
  readonly intakeProvider: string | null;
  readonly externalId: string | null;
  readonly assignedToUserId: string | null;
  readonly assignedToDisplayName: string | null;
  readonly assignedToEmail: string | null;
  readonly status: LeadStatus;
  readonly leadScore: number | null;
  readonly priority: LeadPriority;
  readonly expectedDealSize: number | null;
  readonly notes: string | null;
  readonly need: string | null;
  readonly authority: string | null;
  readonly budgetNotes: string | null;
  readonly timeline: string | null;
  readonly painPoints: string | null;
  readonly decisionMaker: string | null;
  readonly competitor: string | null;
  readonly qualificationNotes: string | null;
  readonly convertedClientId: string | null;
  readonly convertedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateLeadData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly code?: string | null;
  readonly company: string;
  readonly contactPerson?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly whatsapp?: string | null;
  readonly website?: string | null;
  readonly industry?: string | null;
  readonly country?: string | null;
  readonly source?: LeadSource;
  readonly campaignId?: string | null;
  readonly intakeProvider?: string | null;
  readonly externalId?: string | null;
  readonly assignedToUserId?: string | null;
  readonly status?: LeadStatus;
  readonly leadScore?: number | null;
  readonly priority?: LeadPriority;
  readonly expectedDealSize?: number | null;
  readonly notes?: string | null;
  readonly need?: string | null;
  readonly authority?: string | null;
  readonly budgetNotes?: string | null;
  readonly timeline?: string | null;
  readonly painPoints?: string | null;
  readonly decisionMaker?: string | null;
  readonly competitor?: string | null;
  readonly qualificationNotes?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateLeadData {
  readonly code?: string | null;
  readonly company?: string;
  readonly contactPerson?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly whatsapp?: string | null;
  readonly website?: string | null;
  readonly industry?: string | null;
  readonly country?: string | null;
  readonly source?: LeadSource;
  readonly campaignId?: string | null;
  readonly assignedToUserId?: string | null;
  readonly status?: LeadStatus;
  readonly leadScore?: number | null;
  readonly priority?: LeadPriority;
  readonly expectedDealSize?: number | null;
  readonly notes?: string | null;
  readonly need?: string | null;
  readonly authority?: string | null;
  readonly budgetNotes?: string | null;
  readonly timeline?: string | null;
  readonly painPoints?: string | null;
  readonly decisionMaker?: string | null;
  readonly competitor?: string | null;
  readonly qualificationNotes?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ArchiveLeadData {
  readonly status: LeadStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface RestoreLeadData {
  readonly status: LeadStatus;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ConvertLeadData {
  readonly status: LeadStatus;
  readonly convertedClientId: string;
  readonly convertedAt: Date;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindLeadByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListLeadsParams {
  readonly scope: LeadScope;
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly status?: LeadStatus;
  readonly source?: LeadSource;
  readonly assignedToUserId?: string;
  readonly campaignId?: string;
  readonly priority?: LeadPriority;
  readonly industry?: string;
  readonly country?: string;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly sortBy?: LeadListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListLeadsResult {
  readonly items: readonly LeadRecord[];
  readonly total: number;
}

export interface LeadRepository {
  create(data: CreateLeadData, tx?: LeadTransactionClient): Promise<LeadRecord>;
  update(
    scope: LeadScope,
    id: string,
    data: UpdateLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null>;
  archive(
    scope: LeadScope,
    id: string,
    data: ArchiveLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null>;
  restore(
    scope: LeadScope,
    id: string,
    data: RestoreLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null>;
  convert(
    scope: LeadScope,
    id: string,
    data: ConvertLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null>;
  findById(scope: LeadScope, id: string, options?: FindLeadByIdOptions): Promise<LeadRecord | null>;
  findByIds(scope: LeadScope, ids: readonly string[]): Promise<readonly LeadRecord[]>;
  findByEmails(scope: LeadScope, emails: readonly string[]): Promise<readonly LeadRecord[]>;
  list(params: ListLeadsParams): Promise<ListLeadsResult>;
}
