'use client';

import { DataCard, ErrorState, LoadingState } from '@/design-system';
import { Button } from '@/components/ui/button';
import { useIntegrationHealthDashboard } from '@/features/integrations/hooks/use-integrations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

function formatRateLimitNote(info: unknown, message?: string): string {
  if (message && message.trim().length > 0) {
    return message;
  }
  if (typeof info === 'string' && info.trim().length > 0) {
    return info;
  }
  if (info && typeof info === 'object') {
    try {
      return JSON.stringify(info);
    } catch {
      return 'Rate limit details available';
    }
  }
  return 'Rate limit note';
}

export function IntegrationHealthDashboard() {
  const { data, isLoading, error, refetch } = useIntegrationHealthDashboard();

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

  if (isLoading || !data) {
    return <LoadingState label="Loading health dashboard..." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DataCard label="Connected" value={data.connected} />
        <DataCard label="Disconnected" value={data.disconnected} />
        <DataCard label="Failed" value={data.error} />
        <DataCard label="Pending" value={data.pending} />
      </div>

      {data.rateLimits.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Rate limit notes</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {data.rateLimits.map((note) => (
              <li key={`${note.connectionId}-${note.providerKey}`}>
                <span className="font-medium text-foreground">
                  {note.displayName ?? note.providerKey}
                </span>
                {': '}
                {formatRateLimitNote(note.info, note.message)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
