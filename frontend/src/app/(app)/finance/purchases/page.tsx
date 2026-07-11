'use client';

import { Plus, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { CreatePurchaseBillDrawer } from '@/features/finance/purchases/components/create-purchase-bill-drawer';
import { PurchaseBillListTable } from '@/features/finance/purchases/components/purchase-bill-list-table';
import { usePurchaseBills } from '@/features/finance/purchases/hooks/use-purchase-bills';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const LIST_FETCH_TAKE = 100;

export default function PurchasesPage() {
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

  const { data, isLoading, error, refetch, isFetching } = usePurchaseBills(listParams);

  const matchingBills = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return data.items;
    }

    return data.items.filter(
      (bill) =>
        bill.billNumber.toLowerCase().includes(query) ||
        bill.vendorName.toLowerCase().includes(query),
    );
  }, [data, search]);

  const filteredBills = useMemo(() => {
    const start = (page - 1) * pageSize;
    return matchingBills.slice(start, start + pageSize);
  }, [matchingBills, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(matchingBills.length / pageSize));
  const hasActiveFilters = search.trim().length > 0;

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Purchases"
        description="Manage vendor purchase bills and payments"
        actions={
          <Can permission="finance.purchases.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Bill
            </Button>
          </Can>
        }
      />

      <CreatePurchaseBillDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Input
            type="search"
            placeholder="Search bills..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search purchase bills"
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
          <LoadingState label="Loading purchase bills..." />
        ) : filteredBills.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={hasActiveFilters ? 'No bills match your search' : 'No purchase bills yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria.'
                : 'Create your first purchase bill to get started.'
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
                <Can permission="finance.purchases.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Bill
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <PurchaseBillListTable bills={filteredBills} />
            {matchingBills.length > pageSize ? (
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
