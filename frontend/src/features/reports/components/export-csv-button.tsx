'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportReportCsv } from '@/features/reports/api/reports.api';
import type { ReportDateRangeParams, ReportType } from '@/features/reports/api/reports.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ExportCsvButtonProps {
  readonly reportType: ReportType;
  readonly params: ReportDateRangeParams;
  readonly disabled?: boolean;
}

/** Triggers CSV download for the active founder report. */
export function ExportCsvButton({ reportType, params, disabled }: ExportCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(): Promise<void> {
    setIsExporting(true);
    setError(null);

    try {
      const { blob, filename } = await exportReportCsv(reportType, params);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        disabled={disabled === true || isExporting}
        onClick={() => {
          void handleExport();
        }}
      >
        <Download className="size-4" />
        {isExporting ? 'Exporting…' : 'Export CSV'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
