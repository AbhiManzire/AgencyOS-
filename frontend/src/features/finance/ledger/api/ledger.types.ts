import type { LedgerAccountType } from '@/features/finance/shared/finance.types';

export type { LedgerAccountType };

export interface LedgerEntryRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entryDate: string;
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
  readonly createdAt: string;
  readonly createdByUserId: string | null;
}

export interface ListLedgerParams {
  readonly skip?: number;
  readonly take?: number;
  readonly clientId?: string;
  readonly vendorId?: string;
  readonly accountType?: LedgerAccountType;
}

export interface ListLedgerResult {
  readonly items: readonly LedgerEntryRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}
