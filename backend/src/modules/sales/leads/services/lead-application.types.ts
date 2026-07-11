import type { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import type {
  LeadListSortField,
  LeadRecord,
  LeadScope,
  ListLeadsResult,
} from '../repositories/lead.repository.interface';

export interface LeadApplicationContext {
  readonly actorUserId: string;
}

export interface CreateLeadCommand {
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
}

export interface UpdateLeadCommand {
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
}

export interface RestoreLeadCommand {
  readonly targetStatus?: LeadStatus;
}

export interface GetLeadOptions {
  readonly includeArchived?: boolean;
}

export interface ListLeadsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly status?: LeadStatus;
  readonly source?: LeadSource;
  readonly assignedToUserId?: string;
  readonly priority?: LeadPriority;
  readonly industry?: string;
  readonly country?: string;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly sortBy?: LeadListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export type { LeadRecord, LeadScope, ListLeadsResult };
