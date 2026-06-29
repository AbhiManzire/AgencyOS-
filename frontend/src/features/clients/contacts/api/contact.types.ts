import type { ContactFormValues, ContactStatus } from '@/features/clients/contacts/types';

/** Contact row returned by client contacts API — mirrors backend Contact record (MVP fields). */
export interface ContactRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly clientId: string;
  readonly firstName: string;
  readonly lastName: string | null;
  readonly jobTitle: string | null;
  readonly department: string | null;
  readonly email: string | null;
  readonly mobile: string | null;
  readonly phone: string | null;
  readonly isPrimary: boolean;
  readonly isDecisionMaker: boolean;
  readonly status: ContactStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

export type CreateContactPayload = ContactFormValues;

export type UpdateContactPayload = ContactFormValues;
