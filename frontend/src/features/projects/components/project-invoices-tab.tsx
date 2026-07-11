'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/design-system';
import { useInvoices } from '@/features/finance/invoices/hooks/use-invoices';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ProjectInvoicesTabProps {
  readonly projectId: string;
}

export function ProjectInvoicesTab({ projectId }: ProjectInvoicesTabProps) {
  const { data, isLoading, error, refetch } = useInvoices({ projectId, take: 50 });

  if (isLoading) {
    return <LoadingState label="Loading invoices..." />;
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

  const invoices = data?.items ?? [];

  if (invoices.length === 0) {
    return (
      <EmptyState title="No invoices" description="No invoices are linked to this project yet." />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <Link
              href={`/finance/invoices/${invoice.id}`}
              className="truncate font-medium text-foreground hover:underline"
            >
              {invoice.invoiceNumber}
            </Link>
            <p className="text-xs text-muted-foreground">{invoice.status}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
