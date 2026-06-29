'use client';

import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/design-system';
import { ActivityTimeline } from '@/features/activity/components/activity-timeline';
import { useActivities } from '@/features/activity/hooks/use-activities';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface InvoiceHistoryTabProps {
  readonly invoiceId: string;
}

export function InvoiceHistoryTab({ invoiceId }: InvoiceHistoryTabProps) {
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useActivities('invoice', invoiceId);

  if (isLoading) {
    return <LoadingState label="Loading invoice history..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Invoice History</h2>
          <p className="text-sm text-muted-foreground">
            PDF generation and email delivery events for this invoice.
          </p>
        </div>
        {isFetching ? <span className="text-sm text-muted-foreground">Updating...</span> : null}
      </div>

      <ActivityTimeline
        entityType="invoice"
        entityId={invoiceId}
        entries={entries}
        emptyTitle="No invoice history yet"
        emptyDescription="Generate a PDF or send this invoice to start the activity timeline."
      />
    </div>
  );
}
