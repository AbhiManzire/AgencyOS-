import type { FounderReport, ReportDateRange, ReportsScope, ReportType } from '../reports.types';

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');

export interface ReportsRepository {
  getReport(
    scope: ReportsScope,
    reportType: ReportType,
    range: ReportDateRange,
  ): Promise<FounderReport>;
}
