import type { ClientContactStatus } from '@prisma/client';

export interface ClientContactApplicationContext {
  readonly actorUserId: string;
}

export interface CreateClientContactCommand {
  readonly firstName: string;
  readonly lastName?: string;
  readonly jobTitle?: string;
  readonly department?: string;
  readonly email?: string;
  readonly mobile?: string;
  readonly phone?: string;
  readonly isPrimary?: boolean;
  readonly isDecisionMaker?: boolean;
  readonly status?: ClientContactStatus;
}

export interface UpdateClientContactCommand {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly jobTitle?: string;
  readonly department?: string;
  readonly email?: string;
  readonly mobile?: string;
  readonly phone?: string;
  readonly isPrimary?: boolean;
  readonly isDecisionMaker?: boolean;
  readonly status?: ClientContactStatus;
}
