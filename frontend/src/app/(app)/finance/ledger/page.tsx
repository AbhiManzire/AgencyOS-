'use client';

import { BookOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import {
  LedgerFilters,
  type LedgerFiltersState,
} from '@/features/finance/ledger/components/ledger-filters';
import { LedgerListTable } from '@/features/finance/ledger/components/ledger-list-table';
import { useLedger } from '@/features/finance/ledger/hooks/use-ledger';
import type { ListLedgerParams } from '@/features/finance/ledger/api/ledger.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

const LIST_FETCH_TAKE = 100;

const DEFAULT_FILTERS: LedgerFiltersState = {
  clientId: '',
  vendorId: '',
  accountType: '',
  fromDate: '',
  toDate: '',
};

function entryDateInRange(entryDate: string, fromDate: string, toDate: string): boolean {
  const day = entryDate.slice(0, 10);
  if (fromDate.length > 0 && day < fromDate) {
    return false;
  }
  if (toDate.length > 0 && day > toDate) {
    return false;
  }
  return true;
}

export default function LedgerPage() {
  const [filters, setFilters] = useState<LedgerFiltersState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const listParams = useMemo((): ListLedgerParams => {
    const clientId = filters.clientId.trim();
    const vendorId = filters.vendorId.trim();

    return {
      skip: 0,
      take: LIST_FETCH_TAKE,
      ...(clientId.length > 0 ? { clientId } : {}),
      ...(vendorId.length > 0 ? { vendorId } : {}),
      ...(filters.accountType !== '' ? { accountType: filters.accountType } : {}),
    };
  }, [filters.accountType, filters.clientId, filters.vendorId]);

  const { data, isLoading, error, refetch, isFetching } = useLedger(listParams);

  const filteredEntries = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((entry) =>
      entryDateInRange(entry.entryDate, filters.fromDate, filters.toDate),
    );
  }, [data?.items, filters.fromDate, filters.toDate]);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const hasDateFilters = filters.fromDate.length > 0 || filters.toDate.length > 0;
  const hasActiveFilters =
    filters.clientId.trim().length > 0 ||
    filters.vendorId.trim().length > 0 ||
    filters.accountType !== '' ||
    hasDateFilters;

  const handleFiltersChange = (next: LedgerFiltersState): void => {
    setFilters(next);
    setPage(1);
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Ledger"
        description="Read-only ledger entries for receivables, payables, and payments"
      />

      <div className="space-y-4">
        <LedgerFilters filters={filters} onChange={handleFiltersChange} />

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
          <LoadingState label="Loading ledger entries..." />
        ) : pagedEntries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={
              hasActiveFilters ? 'No ledger entries match your filters' : 'No ledger entries yet'
            }
            description={
              hasActiveFilters
                ? 'Try adjusting client, vendor, account type, or date filters.'
                : 'Ledger entries appear when invoices, payments, and bills are posted.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <LedgerListTable entries={pagedEntries} />
            {filteredEntries.length > pageSize ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                  {isFetching ? ' · Updating...' : ''}
                  {hasDateFilters ? ' · Date filter applied locally' : ''}
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
