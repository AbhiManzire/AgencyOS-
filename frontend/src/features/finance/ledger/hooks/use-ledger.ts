import { useQuery } from '@tanstack/react-query';
import { listLedgerEntries } from '@/features/finance/ledger/api/ledger.api';
import type { ListLedgerParams } from '@/features/finance/ledger/api/ledger.types';
import { ledgerQueryKeys } from '@/features/finance/ledger/hooks/ledger-query-keys';

export function useLedger(params: ListLedgerParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ledgerQueryKeys.list(params),
    queryFn: () => listLedgerEntries(params),
    enabled: options?.enabled ?? true,
  });
}
