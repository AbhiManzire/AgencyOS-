import type { ContactStatus } from '@/features/clients/contacts/types';

/** Contact row returned by client contacts API — mirrors backend Contact record. */
export interface ContactRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly clientId: string;
  readonly firstName: string;
  readonly lastName: string | null;
  readonly jobTitle: string | null;
  readonly department: string | null;
  readonly role: string | null;
  readonly email: string | null;
  readonly mobile: string | null;
  readonly phone: string | null;
  readonly isPrimary: boolean;
  readonly isDecisionMaker: boolean;
  readonly isFinance: boolean;
  readonly isTechnical: boolean;
  readonly isProcurement: boolean;
  readonly status: ContactStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

export interface CreateContactPayload {
  readonly firstName: string;
  readonly lastName?: string;
  readonly jobTitle?: string;
  readonly department?: string;
  readonly role?: string;
  readonly email?: string;
  readonly mobile?: string;
  readonly phone?: string;
  readonly isPrimary?: boolean;
  readonly isDecisionMaker?: boolean;
  readonly isFinance?: boolean;
  readonly isTechnical?: boolean;
  readonly isProcurement?: boolean;
  readonly status?: ContactStatus;
}

export interface UpdateContactPayload {
  readonly firstName: string;
  readonly lastName?: string | null;
  readonly jobTitle?: string | null;
  readonly department?: string | null;
  readonly role?: string | null;
  readonly email?: string | null;
  readonly mobile?: string | null;
  readonly phone?: string | null;
  readonly isPrimary?: boolean;
  readonly isDecisionMaker?: boolean;
  readonly isFinance?: boolean;
  readonly isTechnical?: boolean;
  readonly isProcurement?: boolean;
  readonly status?: ContactStatus;
}
