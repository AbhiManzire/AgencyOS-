import type { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';

export const LEAD_CREATABLE_STATUSES: readonly LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED'];

export const LEAD_RESTORABLE_STATUSES: readonly LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
];

export interface CreateLeadValidationInput {
  readonly company: string;
  readonly leadScore?: number | null;
  readonly status?: LeadStatus;
  readonly priority?: LeadPriority;
  readonly source?: LeadSource;
  readonly expectedDealSize?: number | null;
}

export interface UpdateLeadValidationInput {
  readonly company?: string;
  readonly leadScore?: number | null;
  readonly status?: LeadStatus;
  readonly priority?: LeadPriority;
  readonly source?: LeadSource;
  readonly expectedDealSize?: number | null;
}

export interface RestoreLeadValidationInput {
  readonly targetStatus?: LeadStatus;
}
