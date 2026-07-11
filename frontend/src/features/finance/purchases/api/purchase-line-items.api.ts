import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreatePurchaseBillLineItemPayload,
  PurchaseBillLineItemRecord,
  UpdatePurchaseBillLineItemPayload,
} from '@/features/finance/purchases/api/purchase-line-item.types';

/** Lists line items for a purchase bill. */
export async function listPurchaseBillLineItems(
  billId: string,
): Promise<readonly PurchaseBillLineItemRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<PurchaseBillLineItemRecord[]>>(
    `/purchase-bills/${billId}/items`,
  );
  return response.data.data;
}

/** Creates a line item on a purchase bill. */
export async function createPurchaseBillLineItem(
  billId: string,
  payload: CreatePurchaseBillLineItemPayload,
): Promise<PurchaseBillLineItemRecord> {
  const response = await apiClient.post<ApiSuccessResponse<PurchaseBillLineItemRecord>>(
    `/purchase-bills/${billId}/items`,
    payload,
  );
  return response.data.data;
}

/** Updates a purchase bill line item. */
export async function updatePurchaseBillLineItem(
  billId: string,
  lineItemId: string,
  payload: UpdatePurchaseBillLineItemPayload,
): Promise<PurchaseBillLineItemRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<PurchaseBillLineItemRecord>>(
    `/purchase-bills/${billId}/items/${lineItemId}`,
    payload,
  );
  return response.data.data;
}

/** Deletes a purchase bill line item. */
export async function deletePurchaseBillLineItem(
  billId: string,
  lineItemId: string,
): Promise<PurchaseBillLineItemRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<PurchaseBillLineItemRecord>>(
    `/purchase-bills/${billId}/items/${lineItemId}`,
  );
  return response.data.data;
}
