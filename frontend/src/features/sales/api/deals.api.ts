import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ConvertDealToInvoicePayload,
  ConvertedInvoiceRecord,
  CreateDealFromLeadPayload,
  CreateDealPayload,
  DealDashboardResult,
  DealForecastResult,
  DealRecord,
  ListDealsParams,
  ListDealsResult,
  LoseDealPayload,
  UpdateDealPayload,
  UpdateDealStagePayload,
  WinDealPayload,
} from '@/features/sales/api/deal.types';
import type { DealForecastPeriod } from '@/features/sales/types';

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

/** Creates a deal from a qualified lead. */
export async function createDealFromLead(
  leadId: string,
  payload: CreateDealFromLeadPayload = {},
): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/from-lead/${leadId}`,
    payload,
  );
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

/** Moves a deal to a pipeline stage. */
export async function updateDealStage(
  dealId: string,
  payload: UpdateDealStagePayload,
): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}/stage`,
    payload,
  );
  return response.data.data;
}

/** Marks a deal as won. */
export async function winDeal(dealId: string, payload: WinDealPayload = {}): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}/win`,
    payload,
  );
  return response.data.data;
}

/** Marks a deal as lost. */
export async function loseDeal(dealId: string, payload: LoseDealPayload): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}/lose`,
    payload,
  );
  return response.data.data;
}

/** Fetches forecast metrics for a period. */
export async function getDealForecast(period: DealForecastPeriod): Promise<DealForecastResult> {
  const response = await apiClient.get<ApiSuccessResponse<DealForecastResult>>('/deals/forecast', {
    params: { period },
  });
  return response.data.data;
}

/** Fetches deal dashboard aggregate metrics. */
export async function getDealDashboard(): Promise<DealDashboardResult> {
  const response = await apiClient.get<ApiSuccessResponse<DealDashboardResult>>('/deals/dashboard');
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
export async function convertDealToProject(
  dealId: string,
  payload: { readonly templateId?: string } = {},
): Promise<DealRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealRecord>>(
    `/deals/${dealId}/convert-to-project`,
    payload,
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
