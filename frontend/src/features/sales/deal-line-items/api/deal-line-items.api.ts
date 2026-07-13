import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateDealLineItemPayload,
  DealLineItemRecord,
  UpdateDealLineItemPayload,
} from '@/features/sales/deal-line-items/api/deal-line-item.types';

/** Lists line items for a deal. */
export async function listDealLineItems(dealId: string): Promise<readonly DealLineItemRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<DealLineItemRecord[]>>(
    `/deals/${dealId}/line-items`,
  );
  return response.data.data;
}

/** Creates a line item on a deal. */
export async function createDealLineItem(
  dealId: string,
  payload: CreateDealLineItemPayload,
): Promise<DealLineItemRecord> {
  const response = await apiClient.post<ApiSuccessResponse<DealLineItemRecord>>(
    `/deals/${dealId}/line-items`,
    payload,
  );
  return response.data.data;
}

/** Updates a deal line item. */
export async function updateDealLineItem(
  lineItemId: string,
  payload: UpdateDealLineItemPayload,
): Promise<DealLineItemRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<DealLineItemRecord>>(
    `/deal-line-items/${lineItemId}`,
    payload,
  );
  return response.data.data;
}

/** Soft-deletes a deal line item. */
export async function deleteDealLineItem(lineItemId: string): Promise<DealLineItemRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<DealLineItemRecord>>(
    `/deal-line-items/${lineItemId}`,
  );
  return response.data.data;
}
