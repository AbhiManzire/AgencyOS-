import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreatePurchaseBillPayload,
  ListPurchaseBillsParams,
  ListPurchaseBillsResult,
  PurchaseBillRecord,
  UpdatePurchaseBillPayload,
} from '@/features/finance/purchases/api/purchase-bill.types';

/** Fetches a paginated list of purchase bills. */
export async function listPurchaseBills(
  params: ListPurchaseBillsParams = {},
): Promise<ListPurchaseBillsResult> {
  const response = await apiClient.get<ApiSuccessResponse<PurchaseBillRecord[]>>(
    '/purchase-bills',
    { params },
  );
  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

/** Fetches a single purchase bill by id. */
export async function getPurchaseBill(id: string): Promise<PurchaseBillRecord> {
  const response = await apiClient.get<ApiSuccessResponse<PurchaseBillRecord>>(
    `/purchase-bills/${id}`,
  );
  return response.data.data;
}

/** Creates a purchase bill. */
export async function createPurchaseBill(
  payload: CreatePurchaseBillPayload,
): Promise<PurchaseBillRecord> {
  const response = await apiClient.post<ApiSuccessResponse<PurchaseBillRecord>>(
    '/purchase-bills',
    payload,
  );
  return response.data.data;
}

/** Updates an existing purchase bill. */
export async function updatePurchaseBill(
  id: string,
  payload: UpdatePurchaseBillPayload,
): Promise<PurchaseBillRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<PurchaseBillRecord>>(
    `/purchase-bills/${id}`,
    payload,
  );
  return response.data.data;
}

/** Archives a purchase bill (DELETE /purchase-bills/:id). */
export async function archivePurchaseBill(id: string): Promise<PurchaseBillRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<PurchaseBillRecord>>(
    `/purchase-bills/${id}`,
  );
  return response.data.data;
}
