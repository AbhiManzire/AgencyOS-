import type { ListLedgerParams } from '@/features/finance/ledger/api/ledger.types';

export const ledgerQueryKeys = {
  all: ['ledger'] as const,
  list: (params: ListLedgerParams) => [...ledgerQueryKeys.all, 'list', params] as const,
};
