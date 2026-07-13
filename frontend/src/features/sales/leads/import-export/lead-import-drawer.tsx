'use client';

import { Download, Loader2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionTitle, useToast } from '@/design-system';
import {
  commitLeadImport,
  downloadLeadImportTemplate,
  previewLeadImport,
  type LeadDuplicateStrategy,
  type LeadImportCommitRow,
  type LeadImportPreviewResult,
} from '@/features/sales/leads/api/leads.api';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

const CANONICAL_FIELDS = [
  'company',
  'contactPerson',
  'email',
  'phone',
  'whatsapp',
  'website',
  'industry',
  'country',
  'source',
  'priority',
  'status',
  'notes',
  'expectedDealSize',
  'assignedToUserId',
  'campaignId',
  'code',
] as const;

interface LeadImportDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onImported: () => void;
}

export function LeadImportDrawer({ open, onOpenChange, onImported }: LeadImportDrawerProps) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<LeadDuplicateStrategy>('skip');
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<LeadImportPreviewResult | null>(null);
  const [summaryMessage, setSummaryMessage] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const resetState = (): void => {
    setFile(null);
    setDuplicateStrategy('skip');
    setMapping({});
    setPreview(null);
    setSummaryMessage(null);
  };

  const handleClose = (nextOpen: boolean): void => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx'): Promise<void> => {
    setIsDownloadingTemplate(true);
    try {
      await downloadLeadImportTemplate(format);
      showToast(`Template downloaded (${format.toUpperCase()})`);
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handlePreview = async (): Promise<void> => {
    if (file === null) {
      showToast('Select a CSV or Excel file to import', 'error');
      return;
    }

    setIsPreviewing(true);
    setSummaryMessage(null);
    try {
      const result = await previewLeadImport(file, mapping, duplicateStrategy);
      setPreview(result);
      setMapping({ ...result.appliedMapping });
      showToast(
        `Preview ready: ${String(result.summary.valid)} valid, ${String(result.summary.invalid)} invalid, ${String(result.summary.duplicates)} duplicates`,
      );
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  const commitRows = useMemo((): readonly LeadImportCommitRow[] => {
    if (preview === null) {
      return [];
    }

    return preview.rows
      .filter((row) => row.status !== 'invalid')
      .map((row) => {
        if (row.status === 'duplicate') {
          if (duplicateStrategy === 'skip') {
            return {
              rowNumber: row.rowNumber,
              action: 'skip' as const,
              data: row.data,
              existingLeadId: row.duplicateLeadId,
            };
          }
          if (duplicateStrategy === 'update' && row.duplicateLeadId !== undefined) {
            return {
              rowNumber: row.rowNumber,
              action: 'update' as const,
              data: row.data,
              existingLeadId: row.duplicateLeadId,
            };
          }
        }

        return {
          rowNumber: row.rowNumber,
          action: 'create' as const,
          data: row.data,
        };
      });
  }, [duplicateStrategy, preview]);

  const handleCommit = async (): Promise<void> => {
    if (commitRows.length === 0) {
      showToast('No valid rows to import', 'error');
      return;
    }

    setIsCommitting(true);
    try {
      const summary = await commitLeadImport(commitRows);
      const message = `Import complete — created ${String(summary.created)}, updated ${String(summary.updated)}, skipped ${String(summary.skipped)}, failed ${String(summary.failed)}`;
      setSummaryMessage(message);
      showToast(message);
      onImported();
      if (summary.failed === 0) {
        handleClose(false);
      }
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <div className="space-y-6 p-1">
          <div className="space-y-1">
            <SectionTitle className="text-base">Import leads</SectionTitle>
            <p className="text-sm text-muted-foreground">
              Upload CSV or Excel, map fields, review validation, then commit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isDownloadingTemplate}
              onClick={() => {
                void handleDownloadTemplate('csv');
              }}
            >
              <Download className="size-4" />
              CSV template
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isDownloadingTemplate}
              onClick={() => {
                void handleDownloadTemplate('xlsx');
              }}
            >
              <Download className="size-4" />
              Excel template
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="lead-import-file">
              File
            </label>
            <input
              id="lead-import-file"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                setFile(next);
                setPreview(null);
                setSummaryMessage(null);
              }}
            />
          </div>

          <NativeSelect
            label="Duplicate strategy"
            value={duplicateStrategy}
            onChange={(event) => {
              setDuplicateStrategy(event.target.value as LeadDuplicateStrategy);
            }}
          >
            <option value="skip">Skip duplicates</option>
            <option value="update">Update existing by email</option>
            <option value="create">Create anyway</option>
          </NativeSelect>

          {preview !== null ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Field mapping</p>
              <div className="grid gap-2">
                {CANONICAL_FIELDS.map((field) => (
                  <div key={field} className="grid grid-cols-2 items-center gap-2">
                    <span className="text-sm text-muted-foreground">{field}</span>
                    <NativeSelect
                      label={`Map ${field}`}
                      value={mapping[field] ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setMapping((current) => {
                          if (value.length === 0) {
                            const { [field]: _removed, ...rest } = current;
                            return rest;
                          }
                          return { ...current, [field]: value };
                        });
                      }}
                    >
                      <option value="">—</option>
                      {preview.fileHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPreviewing || file === null}
                onClick={() => {
                  void handlePreview();
                }}
              >
                Re-run preview with mapping
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="gap-2"
              disabled={isPreviewing || file === null}
              onClick={() => {
                void handlePreview();
              }}
            >
              {isPreviewing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Validate & preview
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isCommitting || commitRows.length === 0}
              onClick={() => {
                void handleCommit();
              }}
            >
              {isCommitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Commit import
            </Button>
          </div>

          {preview !== null ? (
            <div className="space-y-3">
              <p className="text-sm">
                Total {preview.summary.total} · Valid {preview.summary.valid} · Invalid{' '}
                {preview.summary.invalid} · Duplicates {preview.summary.duplicates}
              </p>
              <div className="max-h-64 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr>
                      <th className="px-2 py-1">Row</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Company</th>
                      <th className="px-2 py-1">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-border">
                        <td className="px-2 py-1">{row.rowNumber}</td>
                        <td className="px-2 py-1">{row.status}</td>
                        <td className="px-2 py-1">{row.data.company ?? '—'}</td>
                        <td className="px-2 py-1 text-muted-foreground">
                          {row.errors.length > 0 ? row.errors.join('; ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {summaryMessage !== null ? (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {summaryMessage}
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
