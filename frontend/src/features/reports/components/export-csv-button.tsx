'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportReport } from '@/features/reports/api/reports.api';
import type {
  ExportFormat,
  ReportQueryParams,
  ReportType,
} from '@/features/reports/api/reports.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ExportButtonsProps {
  readonly reportType: ReportType;
  readonly params: ReportQueryParams;
  readonly disabled?: boolean;
}

const EXPORT_OPTIONS: readonly {
  format: ExportFormat;
  label: string;
  icon: typeof Download;
}[] = [
  { format: 'csv', label: 'CSV', icon: Download },
  { format: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
  { format: 'pdf', label: 'PDF', icon: FileText },
];

/** Triggers CSV / Excel / PDF download for the active report. */
export function ExportButtons({ reportType, params, disabled }: ExportButtonsProps) {
  const [busyFormat, setBusyFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: ExportFormat): Promise<void> {
    setBusyFormat(format);
    setError(null);

    try {
      const { blob, filename } = await exportReport(reportType, params, format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setBusyFormat(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {EXPORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isBusy = busyFormat === option.format;
          return (
            <Button
              key={option.format}
              type="button"
              variant="outline"
              className="gap-2"
              disabled={disabled === true || busyFormat !== null}
              onClick={() => {
                void handleExport(option.format);
              }}
            >
              <Icon className="size-4" />
              {isBusy ? 'Exporting…' : option.label}
            </Button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/** @deprecated Prefer ExportButtons */
export { ExportButtons as ExportCsvButton };
