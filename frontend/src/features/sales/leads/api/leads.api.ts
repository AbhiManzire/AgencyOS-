import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateLeadPayload,
  LeadRecord,
  ListLeadsParams,
  ListLeadsResult,
  RestoreLeadPayload,
  UpdateLeadPayload,
} from '@/features/sales/leads/api/lead.types';
import type { LeadSource, LeadStatus } from '@/features/sales/leads/types';

/** Fetches a paginated list of leads for the active workspace. */
export async function listLeads(params: ListLeadsParams): Promise<ListLeadsResult> {
  const response = await apiClient.get<ApiSuccessResponse<LeadRecord[]>>('/leads', {
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

/** Fetches a single lead by id. */
export async function getLead(id: string): Promise<LeadRecord> {
  const response = await apiClient.get<ApiSuccessResponse<LeadRecord>>(`/leads/${id}`);
  return response.data.data;
}

/** Creates a lead in the active workspace. */
export async function createLead(payload: CreateLeadPayload): Promise<LeadRecord> {
  const response = await apiClient.post<ApiSuccessResponse<LeadRecord>>('/leads', payload);
  return response.data.data;
}

/** Updates an existing lead. */
export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<LeadRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<LeadRecord>>(`/leads/${id}`, payload);
  return response.data.data;
}

/** Archives a lead (DELETE /leads/:id). */
export async function archiveLead(id: string): Promise<LeadRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<LeadRecord>>(`/leads/${id}`);
  return response.data.data;
}

/** Restores an archived lead. */
export async function restoreLead(
  id: string,
  payload: RestoreLeadPayload = {},
): Promise<LeadRecord> {
  const response = await apiClient.post<ApiSuccessResponse<LeadRecord>>(
    `/leads/${id}/restore`,
    payload,
  );
  return response.data.data;
}

/** Converts a lead into a client. */
export async function convertLead(id: string): Promise<LeadRecord> {
  const response = await apiClient.post<ApiSuccessResponse<LeadRecord>>(`/leads/${id}/convert`, {});
  return response.data.data;
}

export interface LeadSourceCatalogEntry {
  readonly value: LeadSource;
  readonly label: string;
  readonly enabled: boolean;
}

export async function listLeadSources(): Promise<readonly LeadSourceCatalogEntry[]> {
  const response =
    await apiClient.get<ApiSuccessResponse<readonly LeadSourceCatalogEntry[]>>('/leads/sources');
  return response.data.data;
}

export type LeadExportFormat = 'csv' | 'xlsx';
export type LeadExportMode = 'filter' | 'selected' | 'all';
export type LeadDuplicateStrategy = 'skip' | 'update' | 'create';

export interface LeadImportPreviewRow {
  readonly rowNumber: number;
  readonly data: Readonly<Record<string, string | undefined>>;
  readonly errors: readonly string[];
  readonly duplicateLeadId?: string;
  readonly status: 'valid' | 'invalid' | 'duplicate';
}

export interface LeadImportPreviewResult {
  readonly fileHeaders: readonly string[];
  readonly appliedMapping: Readonly<Record<string, string>>;
  readonly rows: readonly LeadImportPreviewRow[];
  readonly summary: {
    readonly total: number;
    readonly valid: number;
    readonly invalid: number;
    readonly duplicates: number;
  };
}

export interface LeadImportCommitRow {
  readonly rowNumber: number;
  readonly action: 'create' | 'update' | 'skip';
  readonly existingLeadId?: string;
  readonly data: Readonly<Record<string, string | undefined>>;
}

export interface LeadImportSummary {
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
  readonly failed: number;
  readonly errors: readonly { readonly rowNumber: number; readonly message: string }[];
}

export interface LeadBulkResult {
  readonly succeeded: readonly string[];
  readonly failed: readonly { readonly id: string; readonly message: string }[];
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Downloads the lead import template. */
export async function downloadLeadImportTemplate(format: LeadExportFormat): Promise<void> {
  const response = await apiClient.get<Blob>('/leads/import/template', {
    params: { format },
    responseType: 'blob',
  });
  const filename = format === 'xlsx' ? 'leads-import-template.xlsx' : 'leads-import-template.csv';
  triggerBrowserDownload(response.data, filename);
}

/** Uploads a file and returns a validated import preview. */
export async function previewLeadImport(
  file: File,
  mapping: Readonly<Record<string, string>>,
  duplicateStrategy: LeadDuplicateStrategy,
): Promise<LeadImportPreviewResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping));
  formData.append('duplicateStrategy', duplicateStrategy);

  const response = await apiClient.post<ApiSuccessResponse<LeadImportPreviewResult>>(
    '/leads/import/preview',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return response.data.data;
}

/** Commits a previously previewed import. */
export async function commitLeadImport(
  rows: readonly LeadImportCommitRow[],
): Promise<LeadImportSummary> {
  const response = await apiClient.post<ApiSuccessResponse<LeadImportSummary>>(
    '/leads/import/commit',
    { rows },
  );
  return response.data.data;
}

/** Exports leads by filter, selection, or all records. */
export async function exportLeads(payload: {
  readonly format: LeadExportFormat;
  readonly mode: LeadExportMode;
  readonly leadIds?: readonly string[];
  readonly filters?: ListLeadsParams;
}): Promise<void> {
  const response = await apiClient.post<Blob>('/leads/export', payload, {
    responseType: 'blob',
  });
  const extension = payload.format === 'xlsx' ? 'xlsx' : 'csv';
  triggerBrowserDownload(response.data, `leads-export.${extension}`);
}

export async function bulkAssignLeadOwner(
  leadIds: readonly string[],
  assignedToUserId: string,
): Promise<LeadBulkResult> {
  const response = await apiClient.post<ApiSuccessResponse<LeadBulkResult>>(
    '/leads/bulk/assign-owner',
    { leadIds, assignedToUserId },
  );
  return response.data.data;
}

export async function bulkChangeLeadStatus(
  leadIds: readonly string[],
  status: Exclude<LeadStatus, 'ARCHIVED' | 'CONVERTED'>,
): Promise<LeadBulkResult> {
  const response = await apiClient.post<ApiSuccessResponse<LeadBulkResult>>(
    '/leads/bulk/change-status',
    { leadIds, status },
  );
  return response.data.data;
}

export async function bulkAddLeadTags(
  leadIds: readonly string[],
  tagNames: readonly string[],
): Promise<LeadBulkResult> {
  const response = await apiClient.post<ApiSuccessResponse<LeadBulkResult>>(
    '/leads/bulk/add-tags',
    { leadIds, tagNames },
  );
  return response.data.data;
}

export async function bulkDeleteLeads(leadIds: readonly string[]): Promise<LeadBulkResult> {
  const response = await apiClient.post<ApiSuccessResponse<LeadBulkResult>>('/leads/bulk/delete', {
    leadIds,
  });
  return response.data.data;
}

export async function bulkExportLeads(
  leadIds: readonly string[],
  format: LeadExportFormat,
): Promise<void> {
  const response = await apiClient.post<Blob>(
    '/leads/bulk/export',
    { leadIds, format },
    { responseType: 'blob' },
  );
  triggerBrowserDownload(response.data, `leads-export.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
}
