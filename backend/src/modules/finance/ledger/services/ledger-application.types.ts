import type { LedgerAccountType } from '@prisma/client';
import type {
  LedgerEntryRecord,
  LedgerScope,
  ListLedgerEntriesResult,
} from '../repositories/ledger-entry.repository.interface';

export interface LedgerApplicationContext {
  readonly actorUserId: string;
}

export interface ListLedgerQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly clientId?: string;
  readonly vendorId?: string;
  readonly accountType?: LedgerAccountType;
}

export type { LedgerEntryRecord, LedgerScope, ListLedgerEntriesResult };
