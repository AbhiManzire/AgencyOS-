export type ReportType =
  | 'revenue'
  | 'clients'
  | 'projects'
  | 'tasks'
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

export interface ReportDateRangeParams {
  readonly from: string;
  readonly to: string;
}

export const REPORT_TYPE_OPTIONS: readonly { value: ReportType; label: string }[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'clients', label: 'Clients' },
  { value: 'projects', label: 'Projects' },
  { value: 'tasks', label: 'Tasks' },
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
