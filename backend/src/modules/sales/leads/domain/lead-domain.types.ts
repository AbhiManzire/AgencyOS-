import type { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';

export const LEAD_CREATABLE_STATUSES: readonly LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED'];

export const LEAD_RESTORABLE_STATUSES: readonly LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
];

/** Input used to auto-calculate lead score (0–100). */
export interface LeadScoreInput {
  readonly company?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly website?: string | null;
  readonly decisionMaker?: string | null;
  readonly budgetNotes?: string | null;
  readonly timeline?: string | null;
}

export interface CreateLeadValidationInput {
  readonly company: string;
  readonly contactPerson?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly website?: string | null;
  readonly source?: LeadSource | null;
  readonly status?: LeadStatus;
  readonly priority?: LeadPriority;
  readonly expectedDealSize?: number | null;
  readonly decisionMaker?: string | null;
  readonly budgetNotes?: string | null;
  readonly timeline?: string | null;
}

export interface UpdateLeadValidationInput {
  readonly company?: string;
  readonly contactPerson?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly website?: string | null;
  readonly source?: LeadSource | null;
  readonly status?: LeadStatus;
  readonly priority?: LeadPriority;
  readonly expectedDealSize?: number | null;
  readonly decisionMaker?: string | null;
  readonly budgetNotes?: string | null;
  readonly timeline?: string | null;
}

export interface RestoreLeadValidationInput {
  readonly targetStatus?: LeadStatus;
}
