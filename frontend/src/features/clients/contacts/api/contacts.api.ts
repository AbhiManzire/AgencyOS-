import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ContactRecord,
  CreateContactPayload,
  UpdateContactPayload,
} from '@/features/clients/contacts/api/contact.types';

/** Fetches contacts for a client. */
export async function listContacts(clientId: string): Promise<readonly ContactRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<ContactRecord[]>>(
    `/clients/${clientId}/contacts`,
  );
  return response.data.data;
}

/** Creates a contact for a client. */
export async function createContact(
  clientId: string,
  payload: CreateContactPayload,
): Promise<ContactRecord> {
  const response = await apiClient.post<ApiSuccessResponse<ContactRecord>>(
    `/clients/${clientId}/contacts`,
    payload,
  );
  return response.data.data;
}

/** Updates a contact for a client. */
export async function updateContact(
  clientId: string,
  contactId: string,
  payload: UpdateContactPayload,
): Promise<ContactRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<ContactRecord>>(
    `/clients/${clientId}/contacts/${contactId}`,
    payload,
  );
  return response.data.data;
}

/** Deletes a contact for a client. */
export async function deleteContact(clientId: string, contactId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/contacts/${contactId}`);
}
