import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ConvertDealToInvoicePayload,
  ConvertedInvoiceRecord,
  CreateDealPayload,
  DealRecord,
  ListDealsParams,
  ListDealsResult,
  UpdateDealPayload,
} from '@/features/sales/api/deal.types';

/** Fetches a paginated list of deals for the active workspace. */
export async function listDeals(params: ListDealsParams): Promise<ListDealsResult> {
  const response = await apiClient.get<ApiSuccessResponse<DealRecord[]>>('/deals', {
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

/** Creates a deal in the active workspace. */
export async function createDeal(payload: CreateDealPayload): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>('/deals', payload);
  return response.data.data;
}

/** Fetches a single deal by id for the active workspace. */
export async function getDeal(id: string): Promise<DealRecord> {
  const response = await apiClient.get<ApiSuccessResponse<DealRecord>>(`/deals/${id}`);
  return response.data.data;
}

/** Updates a deal in the active workspace. */
export async function updateDeal(dealId: string, payload: UpdateDealPayload): Promise<DealRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}`,
    payload,
  );
  return response.data.data;
}

/** Archives a deal. */
export async function archiveDeal(dealId: string): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}/archive`,
    {},
  );
  return response.data.data;
}

/** Restores an archived deal. */
export async function restoreDeal(dealId: string): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}/restore`,
    {},
  );
  return response.data.data;
}

/** Converts a won deal into a project. */
export async function convertDealToProject(dealId: string): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}/convert-to-project`,
    {},
  );
  return response.data.data;
}

/** Converts a won deal into an invoice. */
export async function convertDealToInvoice(
  dealId: string,
  payload: ConvertDealToInvoicePayload = {},
): Promise<ConvertedInvoiceRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ConvertedInvoiceRecord>>(
    `/deals/${dealId}/convert-to-invoice`,
    payload,
  );
  return response.data.data;
}
