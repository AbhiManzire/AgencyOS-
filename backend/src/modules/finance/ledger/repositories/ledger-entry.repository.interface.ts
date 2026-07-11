import type { LedgerAccountType, Prisma } from '@prisma/client';

export const LEDGER_ENTRY_REPOSITORY = Symbol('LEDGER_ENTRY_REPOSITORY');

export interface LedgerScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type LedgerTransactionClient = Prisma.TransactionClient;

export interface LedgerEntryRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entryDate: Date;
  readonly accountType: LedgerAccountType;
  readonly entityType: string;
  readonly entityId: string;
  readonly clientId: string | null;
  readonly vendorId: string | null;
  readonly debit: number;
  readonly credit: number;
  readonly balanceAfter: number | null;
  readonly description: string | null;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly createdAt: Date;
  readonly createdByUserId: string | null;
}

export interface CreateLedgerEntryData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entryDate: Date;
  readonly accountType: LedgerAccountType;
  readonly entityType: string;
  readonly entityId: string;
  readonly clientId?: string | null;
  readonly vendorId?: string | null;
  readonly debit: number;
  readonly credit: number;
  readonly balanceAfter?: number | null;
  readonly description?: string | null;
  readonly referenceType?: string | null;
  readonly referenceId?: string | null;
  readonly createdAt: Date;
  readonly createdByUserId?: string | null;
}

export interface ListLedgerEntriesParams {
  readonly scope: LedgerScope;
  readonly skip?: number;
  readonly take?: number;
  readonly clientId?: string;
  readonly vendorId?: string;
  readonly accountType?: LedgerAccountType;
}

export interface ListLedgerEntriesResult {
  readonly items: readonly LedgerEntryRecord[];
  readonly total: number;
}

export interface LedgerEntryRepository {
  create(data: CreateLedgerEntryData, tx?: LedgerTransactionClient): Promise<LedgerEntryRecord>;
  list(params: ListLedgerEntriesParams): Promise<ListLedgerEntriesResult>;
}
