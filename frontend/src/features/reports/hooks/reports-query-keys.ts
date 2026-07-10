import type { ReportDateRangeParams, ReportType } from '@/features/reports/api/reports.types';

export const reportsQueryKeys = {
  all: ['reports'] as const,
  report: (reportType: ReportType, params: ReportDateRangeParams) =>
    [...reportsQueryKeys.all, reportType, params.from, params.to] as const,
};
