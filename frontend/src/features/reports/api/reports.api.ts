import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  FounderReport,
  ReportDateRangeParams,
  ReportType,
} from '@/features/reports/api/reports.types';

/** Maps UI report type (hyphenated) to export param (underscored). */
function toExportReportType(reportType: ReportType): string {
  return reportType.replaceAll('-', '_');
}

/** Fetches a founder report for the given type and date range. */
export async function getReport(
  reportType: ReportType,
  params: ReportDateRangeParams,
): Promise<FounderReport> {
  const response = await apiClient.get<ApiSuccessResponse<FounderReport>>(
    `/reports/${reportType}`,
    { params },
  );
  return response.data.data;
}

/** Downloads a founder report as CSV (blob). */
export async function exportReportCsv(
  reportType: ReportType,
  params: ReportDateRangeParams,
): Promise<{ blob: Blob; filename: string }> {
  const exportType = toExportReportType(reportType);
  const response = await apiClient.get<Blob>(`/reports/${exportType}/export`, {
    params,
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? `${exportType}-report-${params.from}_to_${params.to}.csv`;

  return { blob: response.data, filename };
}
