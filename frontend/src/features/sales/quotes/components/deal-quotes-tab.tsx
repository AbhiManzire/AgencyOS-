'use client';

import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { QuoteListTable } from '@/features/sales/quotes/components/quote-list-table';
import { useQuotes } from '@/features/sales/quotes/hooks/use-quotes';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface DealQuotesTabProps {
  readonly dealId: string;
}

/** Lists quotes linked to a deal using the existing quotes list API. */
export function DealQuotesTab({ dealId }: DealQuotesTabProps) {
  const { data, isLoading, isError, error, refetch } = useQuotes(
    { dealId, skip: 0, take: 50 },
    { enabled: dealId.length > 0 },
  );

  if (isLoading) {
    return <LoadingState label="Loading quotes..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const quotes = data?.items ?? [];

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No quotes yet"
        description="Quotes linked to this deal will appear here."
        action={
          <Can permission="quotes.create">
            <Button type="button" variant="outline" asChild>
              <Link href="/sales/quotes">Go to quotes</Link>
            </Button>
          </Can>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Can permission="quotes.create">
          <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
            <Link href="/sales/quotes">
              <Plus className="size-4" />
              Manage quotes
            </Link>
          </Button>
        </Can>
      </div>
      <QuoteListTable quotes={quotes} />
    </div>
  );
}
