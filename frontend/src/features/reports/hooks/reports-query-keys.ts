import type { ReportQueryParams, ReportType } from '@/features/reports/api/reports.types';
import type { AnalyticsDomain } from '@/features/reports/api/reports.types';

export const reportsQueryKeys = {
  all: ['reports'] as const,
  report: (reportType: ReportType, params: ReportQueryParams) =>
    [...reportsQueryKeys.all, 'report', reportType, params] as const,
  analytics: (domain: AnalyticsDomain, params: ReportQueryParams) =>
    [...reportsQueryKeys.all, 'analytics', domain, params] as const,
  schedules: () => [...reportsQueryKeys.all, 'schedules'] as const,
};
