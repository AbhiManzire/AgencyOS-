import type { ClientContactStatus } from '@prisma/client';

export const CLIENT_CONTACT_STATUSES: readonly ClientContactStatus[] = ['ACTIVE', 'INACTIVE'];

export interface CreateClientContactValidationInput {
  readonly firstName: string;
  readonly email?: string | null;
  readonly status?: ClientContactStatus;
  readonly isPrimary?: boolean;
}

export interface UpdateClientContactValidationInput {
  readonly firstName?: string;
  readonly email?: string | null;
  readonly status?: ClientContactStatus;
  readonly isPrimary?: boolean;
}
