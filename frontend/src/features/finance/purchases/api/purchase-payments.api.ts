import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreatePurchasePaymentPayload,
  PurchasePaymentRecord,
} from '@/features/finance/purchases/api/purchase-payment.types';

/** Lists payments for a purchase bill. */
export async function listPurchaseBillPayments(
  billId: string,
): Promise<readonly PurchasePaymentRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<PurchasePaymentRecord[]>>(
    `/purchase-bills/${billId}/payments`,
  );
  return response.data.data;
}

/** Records a payment against a purchase bill. */
export async function createPurchaseBillPayment(
  billId: string,
  payload: CreatePurchasePaymentPayload,
): Promise<PurchasePaymentRecord> {
  const response = await apiClient.post<ApiSuccessResponse<PurchasePaymentRecord>>(
    `/purchase-bills/${billId}/payments`,
    payload,
  );
  return response.data.data;
}

/** Fetches a single purchase payment by id. */
export async function getPurchasePayment(id: string): Promise<PurchasePaymentRecord> {
  const response = await apiClient.get<ApiSuccessResponse<PurchasePaymentRecord>>(
    `/purchase-payments/${id}`,
  );
  return response.data.data;
}

/** Voids a purchase payment. */
export async function voidPurchasePayment(id: string): Promise<PurchasePaymentRecord> {
  const response = await apiClient.post<ApiSuccessResponse<PurchasePaymentRecord>>(
    `/purchase-payments/${id}/void`,
    {},
  );
  return response.data.data;
}
