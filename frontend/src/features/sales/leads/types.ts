export type LeadStatus =
  'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED' | 'CONVERTED' | 'ARCHIVED';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadSource =
  'WEBSITE' | 'REFERRAL' | 'COLD_OUTREACH' | 'SOCIAL' | 'EVENT' | 'PARTNER' | 'OTHER';

export type LeadSortField = 'updatedAt' | 'createdAt' | 'company' | 'leadScore' | 'priority';

export type SortDirection = 'asc' | 'desc';

export type LeadListStatusFilter = 'all' | Exclude<LeadStatus, 'ARCHIVED'> | 'archived';

export type CreateLeadStatus = Extract<LeadStatus, 'NEW' | 'CONTACTED' | 'QUALIFIED'>;

export type EditableLeadStatus = Extract<
  LeadStatus,
  'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED'
>;

export type RestoreLeadStatus = Extract<
  LeadStatus,
  'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED'
>;

export interface LeadListItem {
  readonly id: string;
  readonly company: string;
  readonly code: string | null;
  readonly contactPerson: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly status: LeadStatus;
  readonly priority: LeadPriority;
  readonly source: LeadSource | null;
  readonly assignedTo: string;
  readonly leadScore: number | null;
  readonly expectedDealSize: number | null;
  readonly createdAt: string;
  readonly isArchived: boolean;
  readonly isConverted: boolean;
}
