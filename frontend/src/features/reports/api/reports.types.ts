export type ReportType = 'revenue' | 'clients' | 'projects' | 'tasks' | 'invoices';

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
] as const;
