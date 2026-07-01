'use client';

import { Receipt, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { CreateInvoiceDrawer } from '@/features/finance/invoices/components/create-invoice-drawer';
import { InvoiceListTable } from '@/features/finance/invoices/components/invoice-list-table';
import { useInvoices } from '@/features/finance/invoices/hooks/use-invoices';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const LIST_FETCH_TAKE = 100;

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const pageSize = 10;

  const listParams = useMemo(
    () => ({
      skip: 0,
      take: LIST_FETCH_TAKE,
    }),
    [],
  );

  const { data, isLoading, error, refetch, isFetching } = useInvoices(listParams);

  const matchingInvoices = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return data.items;
    }

    return data.items.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.clientName.toLowerCase().includes(query) ||
        invoice.projectName.toLowerCase().includes(query) ||
        (invoice.quoteNumber?.toLowerCase().includes(query) ?? false),
    );
  }, [data, search]);

  const filteredInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return matchingInvoices.slice(start, start + pageSize);
  }, [matchingInvoices, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(matchingInvoices.length / pageSize));
  const hasActiveFilters = search.trim().length > 0;

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Invoices"
        description="Manage client invoices for projects and quotes"
        actions={
          <Can permission="invoices.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Invoice
            </Button>
          </Can>
        }
      />

      <CreateInvoiceDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Input
            type="search"
            placeholder="Search invoices..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search invoices"
          />
        </div>

        {error ? (
          <ErrorState
            message={extractApiErrorMessage(error)}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading invoices..." />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasActiveFilters ? 'No invoices match your search' : 'No invoices yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria.'
                : 'Create your first invoice to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                  }}
                >
                  Clear search
                </Button>
              ) : (
                <Can permission="invoices.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Invoice
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <InvoiceListTable invoices={filteredInvoices} />
            {matchingInvoices.length > pageSize ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                  {isFetching ? ' · Updating...' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((current) => Math.max(1, current - 1));
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage((current) => current + 1);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageContainer>
  );
}
