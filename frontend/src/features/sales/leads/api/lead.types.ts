import type {
  CreateLeadStatus,
  LeadPriority,
  LeadSortField,
  LeadSource,
  LeadStatus,
  RestoreLeadStatus,
  SortDirection,
} from '@/features/sales/leads/types';

/** Lead row returned by GET /leads — mirrors backend LeadRecord. */
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
  readonly source: LeadSource | null;
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
  readonly convertedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListLeadsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly status?: Exclude<LeadStatus, 'ARCHIVED'>;
  readonly source?: LeadSource;
  readonly assignedToUserId?: string;
  readonly priority?: LeadPriority;
  readonly industry?: string;
  readonly country?: string;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly sortBy?: LeadSortField;
  readonly sortOrder?: SortDirection;
}

export interface ListLeadsResult {
  readonly items: readonly LeadRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateLeadPayload {
  readonly company: string;
  readonly code?: string;
  readonly contactPerson?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly whatsapp?: string;
  readonly website?: string;
  readonly industry?: string;
  readonly country?: string;
  readonly source?: LeadSource;
  readonly assignedToUserId?: string;
  readonly status?: CreateLeadStatus;
  readonly leadScore?: number | null;
  readonly priority?: LeadPriority;
  readonly expectedDealSize?: number | null;
  readonly notes?: string;
  readonly need?: string;
  readonly authority?: string;
  readonly budgetNotes?: string;
  readonly timeline?: string;
  readonly painPoints?: string;
  readonly decisionMaker?: string;
  readonly competitor?: string;
  readonly qualificationNotes?: string;
}

export interface UpdateLeadPayload {
  readonly company?: string;
  readonly code?: string | null;
  readonly contactPerson?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly whatsapp?: string | null;
  readonly website?: string | null;
  readonly industry?: string | null;
  readonly country?: string | null;
  readonly source?: LeadSource | null;
  readonly assignedToUserId?: string | null;
  readonly status?: Exclude<LeadStatus, 'ARCHIVED' | 'CONVERTED'>;
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

export interface RestoreLeadPayload {
  readonly targetStatus?: RestoreLeadStatus;
}
