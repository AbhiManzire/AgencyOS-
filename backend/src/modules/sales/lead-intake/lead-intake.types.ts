import type { LeadSource } from '@prisma/client';

export const LEAD_INTAKE_PROVIDERS = Symbol('LEAD_INTAKE_PROVIDERS');

export interface NormalizedLeadIntake {
  readonly company: string;
  readonly contactPerson?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly whatsapp?: string;
  readonly website?: string;
  readonly industry?: string;
  readonly country?: string;
  readonly notes?: string;
  readonly externalId?: string;
  readonly campaignCode?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface LeadIntakeProvider {
  readonly key: string;
  readonly label: string;
  readonly defaultSource: LeadSource;
  normalize(payload: unknown): NormalizedLeadIntake;
}

export interface LeadIntakeProviderSummary {
  readonly key: string;
  readonly label: string;
  readonly defaultSource: LeadSource;
}
