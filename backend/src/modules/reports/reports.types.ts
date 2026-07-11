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
  | 'vendor_ledger';

export interface ReportsScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface ReportDateRange {
  readonly from: Date;
  readonly to: Date;
}

export interface ReportMetric {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly format: 'number' | 'currency';
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
