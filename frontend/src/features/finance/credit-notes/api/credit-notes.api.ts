import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ApplyCreditNotePayload,
  ApplyCreditNoteResult,
  CreateCreditNotePayload,
  CreditNoteRecord,
  ListCreditNotesParams,
  ListCreditNotesResult,
} from '@/features/finance/credit-notes/api/credit-note.types';

/** Fetches a paginated list of credit notes. */
export async function listCreditNotes(
  params: ListCreditNotesParams = {},
): Promise<ListCreditNotesResult> {
  const response = await apiClient.get<ApiSuccessResponse<CreditNoteRecord[]>>('/credit-notes', {
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

/** Fetches a single credit note by id. */
export async function getCreditNote(id: string): Promise<CreditNoteRecord> {
  const response = await apiClient.get<ApiSuccessResponse<CreditNoteRecord>>(`/credit-notes/${id}`);
  return response.data.data;
}

/** Creates a credit note. */
export async function createCreditNote(
  payload: CreateCreditNotePayload,
): Promise<CreditNoteRecord> {
  const response = await apiClient.post<ApiSuccessResponse<CreditNoteRecord>>(
    '/credit-notes',
    payload,
  );
  return response.data.data;
}

/** Applies a credit note to an invoice. */
export async function applyCreditNote(
  id: string,
  payload: ApplyCreditNotePayload,
): Promise<ApplyCreditNoteResult> {
  const response = await apiClient.post<ApiSuccessResponse<ApplyCreditNoteResult>>(
    `/credit-notes/${id}/apply`,
    payload,
  );
  return response.data.data;
}

/** Voids a credit note. */
export async function voidCreditNote(id: string): Promise<CreditNoteRecord> {
  const response = await apiClient.post<ApiSuccessResponse<CreditNoteRecord>>(
    `/credit-notes/${id}/void`,
    {},
  );
  return response.data.data;
}
