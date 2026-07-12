'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import {
  REPORT_TYPE_OPTIONS,
  type CreateScheduledReportInput,
  type ScheduledReportFrequency,
  type ScheduledReportExportFormat,
} from '@/features/reports/api/reports.types';
import {
  useCreateScheduledReport,
  useDeleteScheduledReport,
  useRunScheduledReport,
  useScheduledReports,
  useUpdateScheduledReport,
} from '@/features/reports/hooks/use-scheduled-reports';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

const FREQUENCY_OPTIONS: readonly { value: ScheduledReportFrequency; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const FORMAT_OPTIONS: readonly { value: ScheduledReportExportFormat; label: string }[] = [
  { value: 'CSV', label: 'CSV' },
  { value: 'XLSX', label: 'Excel' },
  { value: 'PDF', label: 'PDF' },
];

/** CRUD + run UI for email-ready scheduled reports. */
export function SchedulesPanel() {
  const { schedules, isLoading, isError, error, refetch } = useScheduledReports();
  const createMutation = useCreateScheduledReport();
  const updateMutation = useUpdateScheduledReport();
  const deleteMutation = useDeleteScheduledReport();
  const runMutation = useRunScheduledReport();

  const [name, setName] = useState('');
  const [reportType, setReportType] = useState('founder');
  const [frequency, setFrequency] = useState<ScheduledReportFrequency>('WEEKLY');
  const [exportFormat, setExportFormat] = useState<ScheduledReportExportFormat>('CSV');
  const [emails, setEmails] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate(): Promise<void> {
    setFormError(null);
    const recipientEmails = emails
      .split(/[,;\s]+/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (name.trim().length === 0 || recipientEmails.length === 0) {
      setFormError('Name and at least one recipient email are required.');
      return;
    }

    const input: CreateScheduledReportInput = {
      name: name.trim(),
      reportType,
      frequency,
      exportFormat,
      recipientEmails,
      isActive: true,
    };

    try {
      await createMutation.mutateAsync(input);
      setName('');
      setEmails('');
    } catch (err) {
      setFormError(extractApiErrorMessage(err));
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading schedules..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button type="button" variant="outline" onClick={refetch}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium">Create scheduled report</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="sched-name">
              Name
            </label>
            <Input
              id="sched-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              placeholder="Weekly founder pack"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="sched-type">
              Report type
            </label>
            <NativeSelect
              id="sched-type"
              label="Report type"
              value={reportType}
              onChange={(event) => {
                setReportType(event.target.value);
              }}
            >
              {REPORT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="sched-freq">
              Frequency
            </label>
            <NativeSelect
              id="sched-freq"
              label="Frequency"
              value={frequency}
              onChange={(event) => {
                setFrequency(event.target.value as ScheduledReportFrequency);
              }}
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground" htmlFor="sched-format">
              Export format
            </label>
            <NativeSelect
              id="sched-format"
              label="Export format"
              value={exportFormat}
              onChange={(event) => {
                setExportFormat(event.target.value as ScheduledReportExportFormat);
              }}
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-muted-foreground" htmlFor="sched-emails">
              Recipient emails
            </label>
            <Input
              id="sched-emails"
              value={emails}
              onChange={(event) => {
                setEmails(event.target.value);
              }}
              placeholder="founder@agency.com, ops@agency.com"
            />
          </div>
        </div>
        {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
        <Button
          type="button"
          disabled={createMutation.isPending}
          onClick={() => {
            void handleCreate();
          }}
        >
          {createMutation.isPending ? 'Saving…' : 'Create schedule'}
        </Button>
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          title="No scheduled reports"
          description="Create a daily, weekly, or monthly email-ready schedule."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Frequency</th>
                <th className="px-3 py-2 font-medium">Format</th>
                <th className="px-3 py-2 font-medium">Next run</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{schedule.name}</td>
                  <td className="px-3 py-2">{schedule.reportType}</td>
                  <td className="px-3 py-2">{schedule.frequency}</td>
                  <td className="px-3 py-2">{schedule.exportFormat}</td>
                  <td className="px-3 py-2">{new Date(schedule.nextRunAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {schedule.isActive ? (schedule.lastStatus ?? 'Active') : 'Paused'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={runMutation.isPending}
                        onClick={() => {
                          void runMutation.mutateAsync(schedule.id);
                        }}
                      >
                        Run
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          void updateMutation.mutateAsync({
                            id: schedule.id,
                            input: { isActive: !schedule.isActive },
                          });
                        }}
                      >
                        {schedule.isActive ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          void deleteMutation.mutateAsync(schedule.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
