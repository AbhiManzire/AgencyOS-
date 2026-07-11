'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/design-system';
import { useQuoteRevisions } from '@/features/sales/quotes/hooks/use-quote-revisions';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { formatMoney } from '@/lib/format/money';
import { formatShortDate } from '@/lib/format/date';

interface QuoteRevisionsPanelProps {
  readonly quoteId: string;
}

export function QuoteRevisionsPanel({ quoteId }: QuoteRevisionsPanelProps) {
  const { data: revisions = [], isLoading, error, refetch } = useQuoteRevisions(quoteId);

  if (isLoading) {
    return <LoadingState label="Loading revisions..." />;
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

  if (revisions.length === 0) {
    return (
      <EmptyState
        title="No revisions yet"
        description="Revisions appear when this quote is updated."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Revision</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Total</TableHead>
            <TableHead className="hidden lg:table-cell">Valid until</TableHead>
            <TableHead className="hidden lg:table-cell">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revisions.map((revision) => (
            <TableRow key={revision.id}>
              <TableCell className="font-mono">r{revision.revision}</TableCell>
              <TableCell className="font-medium">{revision.title}</TableCell>
              <TableCell>
                <StatusBadge variant="neutral">{revision.status}</StatusBadge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatMoney(revision.totalAmount, revision.currency, 0)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatShortDate(revision.validUntil)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatShortDate(revision.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
