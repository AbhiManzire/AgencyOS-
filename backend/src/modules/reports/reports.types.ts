import type {
  ScheduledReportExportFormat,
  ScheduledReportFrequency,
  ScheduledReportRunStatus,
} from '@prisma/client';

export type ReportType =
  | 'revenue'
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'invoices'
  | 'sales_pipeline'
  | 'sales_conversion'
  | 'sales_forecast'
  | 'sales_lead_source'
  | 'sales_performance'
  | 'profit_loss'
  | 'cash_flow'
  | 'receivables'
  | 'payables'
  | 'gst_summary'
  | 'sales_register'
  | 'purchase_register'
  | 'outstanding'
  | 'client_ledger'
  | 'vendor_ledger'
  | 'founder'
  | 'expense'
  | 'profit'
  | 'sales'
  | 'finance';

export type AnalyticsDomain = 'founder' | 'clients' | 'projects' | 'tasks' | 'sales' | 'finance';

export type ExportFormat = 'csv' | 'pdf' | 'xlsx';

export type ReportPeriod = 'month' | 'quarter' | 'year' | 'custom';

export type AnalyticsGranularity = 'month' | 'quarter' | 'year';

export interface ReportsScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface ReportDateRange {
  readonly from: Date;
  readonly to: Date;
}

export interface ReportFilters {
  readonly clientId?: string;
  readonly projectId?: string;
  readonly departmentId?: string;
  readonly ownerUserId?: string;
  readonly currency?: string;
  readonly period?: ReportPeriod;
}

export type ReportQuery = ReportDateRange & ReportFilters;

export interface ReportMetric {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly format: 'number' | 'currency' | 'percent';
}

export interface ReportColumn {
  readonly key: string;
  readonly label: string;
}

export interface FounderReport {
  readonly reportType: ReportType;
  readonly from: string;
  readonly to: string;
  readonly currency: string;
  readonly metrics: readonly ReportMetric[];
  readonly columns: readonly ReportColumn[];
  readonly rows: readonly Record<string, string | number | null>[];
}

export interface AnalyticsSeriesPoint {
  readonly period: string;
  readonly value: number;
}

export interface AnalyticsSeries {
  readonly key: string;
  readonly label: string;
  readonly chartType: 'line' | 'bar' | 'pie' | 'area';
  readonly points: readonly AnalyticsSeriesPoint[];
  readonly format: 'number' | 'currency' | 'percent';
}

export interface AnalyticsBreakdownItem {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

export interface AnalyticsBreakdown {
  readonly key: string;
  readonly label: string;
  readonly chartType: 'bar' | 'pie';
  readonly items: readonly AnalyticsBreakdownItem[];
  readonly format: 'number' | 'currency' | 'percent';
}

export interface AnalyticsResult {
  readonly domain: AnalyticsDomain;
  readonly from: string;
  readonly to: string;
  readonly currency: string;
  readonly granularity: AnalyticsGranularity;
  readonly metrics: readonly ReportMetric[];
  readonly series: readonly AnalyticsSeries[];
  readonly breakdowns: readonly AnalyticsBreakdown[];
}

export type ScheduledReportFrequencyType = ScheduledReportFrequency;
export type ScheduledReportExportFormatType = ScheduledReportExportFormat;
export type ScheduledReportRunStatusType = ScheduledReportRunStatus;

export interface ScheduledReportRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly reportType: string;
  readonly frequency: ScheduledReportFrequencyType;
  readonly exportFormat: ScheduledReportExportFormatType;
  readonly recipientEmails: readonly string[];
  readonly filters: Record<string, unknown>;
  readonly isActive: boolean;
  readonly nextRunAt: Date;
  readonly lastRunAt: Date | null;
  readonly lastStatus: ScheduledReportRunStatusType | null;
  readonly lastError: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface ExportResult {
  readonly filename: string;
  readonly buffer: Buffer;
  readonly contentType: string;
}
