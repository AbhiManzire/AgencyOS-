export type ReportType =
  | 'founder'
  | 'revenue'
  | 'expense'
  | 'profit'
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'sales'
  | 'finance'
  | 'invoices'
  | 'sales-pipeline'
  | 'sales-conversion'
  | 'sales-forecast'
  | 'sales-lead-source'
  | 'sales-performance'
  | 'profit-loss'
  | 'cash-flow'
  | 'receivables'
  | 'payables'
  | 'gst-summary'
  | 'sales-register'
  | 'purchase-register'
  | 'outstanding'
  | 'client-ledger'
  | 'vendor-ledger';

export type AnalyticsDomain = 'founder' | 'clients' | 'projects' | 'tasks' | 'sales' | 'finance';

export type ExportFormat = 'csv' | 'pdf' | 'xlsx';

export type ReportPeriod = 'month' | 'quarter' | 'year' | 'custom';

export type MetricFormat = 'number' | 'currency' | 'percent';

export interface ReportMetric {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly format: MetricFormat;
}

export interface ReportColumn {
  readonly key: string;
  readonly label: string;
}

export interface FounderReport {
  readonly reportType: string;
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
  readonly format: MetricFormat;
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
  readonly format: MetricFormat;
}

export interface AnalyticsResult {
  readonly domain: AnalyticsDomain;
  readonly from: string;
  readonly to: string;
  readonly currency: string;
  readonly granularity: 'month' | 'quarter' | 'year';
  readonly metrics: readonly ReportMetric[];
  readonly series: readonly AnalyticsSeries[];
  readonly breakdowns: readonly AnalyticsBreakdown[];
}

export interface ReportQueryParams {
  readonly from: string;
  readonly to: string;
  readonly period?: ReportPeriod;
  readonly clientId?: string;
  readonly projectId?: string;
  readonly departmentId?: string;
  readonly ownerUserId?: string;
  readonly currency?: string;
}

/** @deprecated Use ReportQueryParams */
export type ReportDateRangeParams = ReportQueryParams;

export type ScheduledReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ScheduledReportExportFormat = 'CSV' | 'PDF' | 'XLSX';
export type ScheduledReportRunStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface ScheduledReport {
  readonly id: string;
  readonly name: string;
  readonly reportType: string;
  readonly frequency: ScheduledReportFrequency;
  readonly exportFormat: ScheduledReportExportFormat;
  readonly recipientEmails: readonly string[];
  readonly filters: Record<string, unknown>;
  readonly isActive: boolean;
  readonly nextRunAt: string;
  readonly lastRunAt: string | null;
  readonly lastStatus: ScheduledReportRunStatus | null;
  readonly lastError: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateScheduledReportInput {
  readonly name: string;
  readonly reportType: string;
  readonly frequency: ScheduledReportFrequency;
  readonly exportFormat?: ScheduledReportExportFormat;
  readonly recipientEmails: readonly string[];
  readonly filters?: Record<string, unknown>;
  readonly isActive?: boolean;
}

export interface UpdateScheduledReportInput {
  readonly name?: string;
  readonly reportType?: string;
  readonly frequency?: ScheduledReportFrequency;
  readonly exportFormat?: ScheduledReportExportFormat;
  readonly recipientEmails?: readonly string[];
  readonly filters?: Record<string, unknown>;
  readonly isActive?: boolean;
}

export const REPORT_TYPE_OPTIONS: readonly { value: ReportType; label: string }[] = [
  { value: 'founder', label: 'Founder report' },
  { value: 'revenue', label: 'Revenue report' },
  { value: 'expense', label: 'Expense report' },
  { value: 'profit', label: 'Profit report' },
  { value: 'clients', label: 'Client report' },
  { value: 'projects', label: 'Project report' },
  { value: 'tasks', label: 'Task report' },
  { value: 'sales', label: 'Sales report' },
  { value: 'finance', label: 'Finance report' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'sales-pipeline', label: 'Sales pipeline' },
  { value: 'sales-conversion', label: 'Sales conversion' },
  { value: 'sales-forecast', label: 'Sales forecast' },
  { value: 'sales-lead-source', label: 'Lead source' },
  { value: 'sales-performance', label: 'Sales performance' },
  { value: 'profit-loss', label: 'Profit & loss' },
  { value: 'cash-flow', label: 'Cash flow' },
  { value: 'receivables', label: 'Receivables' },
  { value: 'payables', label: 'Payables' },
  { value: 'gst-summary', label: 'GST summary' },
  { value: 'sales-register', label: 'Sales register' },
  { value: 'purchase-register', label: 'Purchase register' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'client-ledger', label: 'Client ledger' },
  { value: 'vendor-ledger', label: 'Vendor ledger' },
] as const;

export const ANALYTICS_DOMAIN_OPTIONS: readonly { value: AnalyticsDomain; label: string }[] = [
  { value: 'founder', label: 'Founder' },
  { value: 'clients', label: 'Clients' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
] as const;

export const PERIOD_OPTIONS: readonly { value: ReportPeriod; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom range' },
] as const;
