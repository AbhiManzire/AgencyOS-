'use client';

import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  PERIOD_OPTIONS,
  REPORT_TYPE_OPTIONS,
  type ReportPeriod,
  type ReportType,
} from '@/features/reports/api/reports.types';

export interface ReportFilterState {
  readonly reportType: ReportType;
  readonly period: ReportPeriod;
  readonly from: string;
  readonly to: string;
  readonly clientId: string;
  readonly projectId: string;
  readonly departmentId: string;
  readonly ownerUserId: string;
  readonly currency: string;
}

interface ReportFiltersProps {
  readonly filters: ReportFilterState;
  readonly showReportType?: boolean;
  readonly onChange: (patch: Partial<ReportFilterState>) => void;
}

function utcMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function utcQuarterRange(): { from: string; to: string } {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
  const from = new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function utcYearRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** Applies period presets to from/to dates. */
export function applyPeriodPreset(period: ReportPeriod): Partial<ReportFilterState> {
  if (period === 'month') {
    return { period, ...utcMonthRange() };
  }
  if (period === 'quarter') {
    return { period, ...utcQuarterRange() };
  }
  if (period === 'year') {
    return { period, ...utcYearRange() };
  }
  return { period };
}

export function defaultReportFilters(reportType: ReportType = 'founder'): ReportFilterState {
  return {
    reportType,
    period: 'month',
    ...utcMonthRange(),
    clientId: '',
    projectId: '',
    departmentId: '',
    ownerUserId: '',
    currency: '',
  };
}

/** Report type, period presets, date range, and optional dimension filters. */
export function ReportFilters({ filters, showReportType = true, onChange }: ReportFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {showReportType ? (
        <div className="flex min-w-[10rem] flex-col gap-1">
          <label htmlFor="report-type" className="text-xs font-medium text-muted-foreground">
            Report
          </label>
          <NativeSelect
            id="report-type"
            label="Report"
            value={filters.reportType}
            onChange={(event) => {
              onChange({ reportType: event.target.value as ReportType });
            }}
          >
            {REPORT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}

      <div className="flex min-w-[8rem] flex-col gap-1">
        <label htmlFor="report-period" className="text-xs font-medium text-muted-foreground">
          Period
        </label>
        <NativeSelect
          id="report-period"
          label="Period"
          value={filters.period}
          onChange={(event) => {
            const period = event.target.value as ReportPeriod;
            onChange(applyPeriodPreset(period));
          }}
        >
          {PERIOD_OPTIONS.map((option) => (
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
          value={filters.from}
          onChange={(event) => {
            onChange({ from: event.target.value, period: 'custom' });
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
          value={filters.to}
          onChange={(event) => {
            onChange({ to: event.target.value, period: 'custom' });
          }}
        />
      </div>

      <div className="flex min-w-[12rem] flex-col gap-1">
        <label htmlFor="report-client" className="text-xs font-medium text-muted-foreground">
          Client ID
        </label>
        <Input
          id="report-client"
          placeholder="Optional UUID"
          value={filters.clientId}
          onChange={(event) => {
            onChange({ clientId: event.target.value.trim() });
          }}
        />
      </div>

      <div className="flex min-w-[12rem] flex-col gap-1">
        <label htmlFor="report-project" className="text-xs font-medium text-muted-foreground">
          Project ID
        </label>
        <Input
          id="report-project"
          placeholder="Optional UUID"
          value={filters.projectId}
          onChange={(event) => {
            onChange({ projectId: event.target.value.trim() });
          }}
        />
      </div>

      <div className="flex min-w-[12rem] flex-col gap-1">
        <label htmlFor="report-department" className="text-xs font-medium text-muted-foreground">
          Department ID
        </label>
        <Input
          id="report-department"
          placeholder="Optional UUID"
          value={filters.departmentId}
          onChange={(event) => {
            onChange({ departmentId: event.target.value.trim() });
          }}
        />
      </div>

      <div className="flex min-w-[12rem] flex-col gap-1">
        <label htmlFor="report-owner" className="text-xs font-medium text-muted-foreground">
          Owner ID
        </label>
        <Input
          id="report-owner"
          placeholder="Optional UUID"
          value={filters.ownerUserId}
          onChange={(event) => {
            onChange({ ownerUserId: event.target.value.trim() });
          }}
        />
      </div>

      <div className="flex min-w-[6rem] flex-col gap-1">
        <label htmlFor="report-currency" className="text-xs font-medium text-muted-foreground">
          Currency
        </label>
        <Input
          id="report-currency"
          placeholder="USD"
          maxLength={3}
          value={filters.currency}
          onChange={(event) => {
            onChange({ currency: event.target.value.trim().toUpperCase() });
          }}
        />
      </div>
    </div>
  );
}
