import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ListLedgerParams,
  ListLedgerResult,
  LedgerEntryRecord,
} from '@/features/finance/ledger/api/ledger.types';

export async function listLedgerEntries(params: ListLedgerParams = {}): Promise<ListLedgerResult> {
  const response = await apiClient.get<ApiSuccessResponse<LedgerEntryRecord[]>>('/ledger', {
    params,
  });
  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}
