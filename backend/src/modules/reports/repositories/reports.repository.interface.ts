import type {
  AnalyticsDomain,
  AnalyticsResult,
  FounderReport,
  ReportQuery,
  ReportsScope,
  ReportType,
} from '../reports.types';

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');
export const ANALYTICS_REPOSITORY = Symbol('ANALYTICS_REPOSITORY');

export interface ReportsRepository {
  getReport(
    scope: ReportsScope,
    reportType: ReportType,
    query: ReportQuery,
  ): Promise<FounderReport>;
}

export interface AnalyticsRepository {
  getAnalytics(
    scope: ReportsScope,
    domain: AnalyticsDomain,
    query: ReportQuery,
  ): Promise<AnalyticsResult>;
}
