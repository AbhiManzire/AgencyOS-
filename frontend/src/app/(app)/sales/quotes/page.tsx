'use client';

import { FileText, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { CreateQuoteDrawer } from '@/features/sales/quotes/components/create-quote-drawer';
import { QuoteListTable } from '@/features/sales/quotes/components/quote-list-table';
import { useQuotes } from '@/features/sales/quotes/hooks/use-quotes';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const LIST_FETCH_TAKE = 100;

export default function QuotesPage() {
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

  const { data, isLoading, error, refetch, isFetching } = useQuotes(listParams);

  const matchingQuotes = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return data.items;
    }

    return data.items.filter(
      (quote) =>
        quote.quoteNumber.toLowerCase().includes(query) ||
        quote.title.toLowerCase().includes(query) ||
        quote.clientName.toLowerCase().includes(query) ||
        quote.dealTitle.toLowerCase().includes(query),
    );
  }, [data, search]);

  const filteredQuotes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return matchingQuotes.slice(start, start + pageSize);
  }, [matchingQuotes, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(matchingQuotes.length / pageSize));
  const hasActiveFilters = search.trim().length > 0;

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Quotes"
        description="Manage sales quotes for your deals"
        actions={
          <Can permission="quotes.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Quote
            </Button>
          </Can>
        }
      />

      <CreateQuoteDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Input
            type="search"
            placeholder="Search quotes..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search quotes"
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
          <LoadingState label="Loading quotes..." />
        ) : filteredQuotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={hasActiveFilters ? 'No quotes match your search' : 'No quotes yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria.'
                : 'Create your first quote to get started.'
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
                <Can permission="quotes.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Quote
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <QuoteListTable quotes={filteredQuotes} />
            {matchingQuotes.length > pageSize ? (
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
