import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  AnalyticsDomain,
  AnalyticsResult,
  CreateScheduledReportInput,
  ExportFormat,
  FounderReport,
  ReportQueryParams,
  ReportType,
  ScheduledReport,
  UpdateScheduledReportInput,
} from '@/features/reports/api/reports.types';

/** Maps UI report type (hyphenated) to API path / export param. */
export function toApiReportType(reportType: string): string {
  return reportType.replaceAll('_', '-');
}

function toExportReportType(reportType: string): string {
  return reportType.replaceAll('-', '_');
}

function cleanParams(
  params: ReportQueryParams & { format?: ExportFormat },
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      out[key] = String(value);
    }
  }
  return out;
}

/** Fetches a report for the given type and query. */
export async function getReport(
  reportType: ReportType,
  params: ReportQueryParams,
): Promise<FounderReport> {
  const response = await apiClient.get<ApiSuccessResponse<FounderReport>>(
    `/reports/${toApiReportType(reportType)}`,
    { params: cleanParams(params) },
  );
  return response.data.data;
}

/** Fetches analytics aggregates and chart series for a domain. */
export async function getAnalytics(
  domain: AnalyticsDomain,
  params: ReportQueryParams,
): Promise<AnalyticsResult> {
  const response = await apiClient.get<ApiSuccessResponse<AnalyticsResult>>(
    `/reports/analytics/${domain}`,
    { params: cleanParams(params) },
  );
  return response.data.data;
}

/** Downloads a report export as a blob (CSV, PDF, or Excel). */
export async function exportReport(
  reportType: ReportType,
  params: ReportQueryParams,
  format: ExportFormat = 'csv',
): Promise<{ blob: Blob; filename: string }> {
  const exportType = toExportReportType(reportType);
  const response = await apiClient.get<Blob>(`/reports/${exportType}/export`, {
    params: cleanParams({ ...params, format }),
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const ext = format === 'xlsx' ? 'xlsx' : format;
  const filename =
    filenameMatch?.[1] ?? `${exportType}-report-${params.from}_to_${params.to}.${ext}`;

  return { blob: response.data, filename };
}

/** @deprecated Prefer exportReport(..., 'csv') */
export async function exportReportCsv(
  reportType: ReportType,
  params: ReportQueryParams,
): Promise<{ blob: Blob; filename: string }> {
  return exportReport(reportType, params, 'csv');
}

export async function listScheduledReports(params?: {
  skip?: number;
  take?: number;
}): Promise<{ items: readonly ScheduledReport[]; total: number }> {
  const response = await apiClient.get<ApiSuccessResponse<readonly ScheduledReport[]>>(
    '/reports/schedules',
    { params },
  );
  return {
    items: response.data.data,
    total: response.data.meta?.total ?? response.data.data.length,
  };
}

export async function createScheduledReport(
  input: CreateScheduledReportInput,
): Promise<ScheduledReport> {
  const response = await apiClient.post<ApiSuccessResponse<ScheduledReport>>(
    '/reports/schedules',
    input,
  );
  return response.data.data;
}

export async function updateScheduledReport(
  id: string,
  input: UpdateScheduledReportInput,
): Promise<ScheduledReport> {
  const response = await apiClient.patch<ApiSuccessResponse<ScheduledReport>>(
    `/reports/schedules/${id}`,
    input,
  );
  return response.data.data;
}

export async function deleteScheduledReport(id: string): Promise<ScheduledReport> {
  const response = await apiClient.delete<ApiSuccessResponse<ScheduledReport>>(
    `/reports/schedules/${id}`,
  );
  return response.data.data;
}

export async function runScheduledReport(id: string): Promise<ScheduledReport> {
  const response = await apiClient.post<ApiSuccessResponse<ScheduledReport>>(
    `/reports/schedules/${id}/run`,
  );
  return response.data.data;
}
