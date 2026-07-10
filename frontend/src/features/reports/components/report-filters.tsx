'use client';

import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { REPORT_TYPE_OPTIONS, type ReportType } from '@/features/reports/api/reports.types';

interface ReportFiltersProps {
  readonly reportType: ReportType;
  readonly from: string;
  readonly to: string;
  readonly onReportTypeChange: (value: ReportType) => void;
  readonly onFromChange: (value: string) => void;
  readonly onToChange: (value: string) => void;
}

/** Report type selector and inclusive UTC date-range filter. */
export function ReportFilters({
  reportType,
  from,
  to,
  onReportTypeChange,
  onFromChange,
  onToChange,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex min-w-[10rem] flex-col gap-1">
        <label htmlFor="report-type" className="text-xs font-medium text-muted-foreground">
          Report
        </label>
        <NativeSelect
          id="report-type"
          label="Report"
          value={reportType}
          onChange={(event) => {
            onReportTypeChange(event.target.value as ReportType);
          }}
        >
          {REPORT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex min-w-[10rem] flex-col gap-1">
        <label htmlFor="report-from" className="text-xs font-medium text-muted-foreground">
          From
        </label>
        <Input
          id="report-from"
          type="date"
          value={from}
          onChange={(event) => {
            onFromChange(event.target.value);
          }}
        />
      </div>

      <div className="flex min-w-[10rem] flex-col gap-1">
        <label htmlFor="report-to" className="text-xs font-medium text-muted-foreground">
          To
        </label>
        <Input
          id="report-to"
          type="date"
          value={to}
          onChange={(event) => {
            onToChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}
