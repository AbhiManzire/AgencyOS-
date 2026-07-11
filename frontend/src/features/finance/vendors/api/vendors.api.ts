import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateVendorPayload,
  ListVendorsParams,
  ListVendorsResult,
  RestoreVendorPayload,
  UpdateVendorPayload,
  VendorRecord,
} from '@/features/finance/vendors/api/vendor.types';

/** Fetches a paginated list of vendors for the active workspace. */
export async function listVendors(params: ListVendorsParams = {}): Promise<ListVendorsResult> {
  const response = await apiClient.get<ApiSuccessResponse<VendorRecord[]>>('/vendors', {
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

/** Fetches a single vendor by id. */
export async function getVendor(id: string): Promise<VendorRecord> {
  const response = await apiClient.get<ApiSuccessResponse<VendorRecord>>(`/vendors/${id}`);
  return response.data.data;
}

/** Creates a vendor in the active workspace. */
export async function createVendor(payload: CreateVendorPayload): Promise<VendorRecord> {
  const response = await apiClient.post<ApiSuccessResponse<VendorRecord>>('/vendors', payload);
  return response.data.data;
}

/** Updates an existing vendor. */
export async function updateVendor(
  id: string,
  payload: UpdateVendorPayload,
): Promise<VendorRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<VendorRecord>>(
    `/vendors/${id}`,
    payload,
  );
  return response.data.data;
}

/** Archives a vendor (DELETE /vendors/:id). */
export async function archiveVendor(id: string): Promise<VendorRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<VendorRecord>>(`/vendors/${id}`);
  return response.data.data;
}

/** Restores an archived vendor. */
export async function restoreVendor(
  id: string,
  payload: RestoreVendorPayload = {},
): Promise<VendorRecord> {
  const response = await apiClient.post<ApiSuccessResponse<VendorRecord>>(
    `/vendors/${id}/restore`,
    payload,
  );
  return response.data.data;
}
