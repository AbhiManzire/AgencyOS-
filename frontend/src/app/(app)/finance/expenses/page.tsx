'use client';

import { Plus, Receipt } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { ArchiveExpenseDialog } from '@/features/finance/expenses/components/archive-expense-dialog';
import { CreateExpenseDrawer } from '@/features/finance/expenses/components/create-expense-drawer';
import { ExpenseListTable } from '@/features/finance/expenses/components/expense-list-table';
import { useApproveExpense } from '@/features/finance/expenses/hooks/use-approve-expense';
import { useArchiveExpense } from '@/features/finance/expenses/hooks/use-archive-expense';
import { useExpenses } from '@/features/finance/expenses/hooks/use-expenses';
import { useRejectExpense } from '@/features/finance/expenses/hooks/use-reject-expense';
import type { ExpenseSortField } from '@/features/finance/expenses/api/expense.types';
import {
  APPROVAL_STATUS_LABELS,
  type ApprovalStatus,
} from '@/features/finance/shared/finance.types';
import { useVendors } from '@/features/finance/vendors/hooks/use-vendors';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

const APPROVAL_FILTER_OPTIONS: readonly (ApprovalStatus | 'all')[] = [
  'all',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NOT_REQUIRED',
];

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortBy, setSortBy] = useState<ExpenseSortField>('expenseDate');
  const [page, setPage] = useState(1);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [archiveExpenseId, setArchiveExpenseId] = useState<string | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const listParams = useMemo(
    () => ({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      q: debouncedSearch.trim().length > 0 ? debouncedSearch.trim() : undefined,
      approvalStatus: approvalFilter !== 'all' ? approvalFilter : undefined,
      vendorId: vendorFilter !== 'all' ? vendorFilter : undefined,
      includeArchived: includeArchived ? true : undefined,
      sortBy,
      sortOrder: 'desc' as const,
    }),
    [approvalFilter, debouncedSearch, includeArchived, page, sortBy, vendorFilter],
  );

  const { data, isLoading, isFetching, error, refetch } = useExpenses(listParams);
  const { data: vendorsData } = useVendors({ take: 100, sortBy: 'name', sortOrder: 'asc' });
  const { mutateAsync: archiveExpense, isPending: isArchiving } = useArchiveExpense();
  const { mutateAsync: approveExpense } = useApproveExpense();
  const { mutateAsync: rejectExpense } = useRejectExpense();

  const expenses = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    approvalFilter !== 'all' ||
    vendorFilter !== 'all' ||
    includeArchived;

  const vendorNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const vendor of vendorsData?.items ?? []) {
      map[vendor.id] = vendor.name;
    }
    return map;
  }, [vendorsData]);

  const handleConfirmArchive = async (): Promise<void> => {
    if (archiveExpenseId === null) {
      return;
    }

    try {
      await archiveExpense(archiveExpenseId);
      showToast('Expense archived', 'success');
      setArchiveExpenseId(null);
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleApprove = async (expenseId: string): Promise<void> => {
    setActionPendingId(expenseId);
    try {
      await approveExpense(expenseId);
      showToast('Expense approved', 'success');
    } catch (approveError) {
      showToast(extractApiErrorMessage(approveError), 'error');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleReject = async (expenseId: string): Promise<void> => {
    setActionPendingId(expenseId);
    try {
      await rejectExpense(expenseId);
      showToast('Expense rejected', 'success');
    } catch (rejectError) {
      showToast(extractApiErrorMessage(rejectError), 'error');
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Expenses"
        description="Track and approve workspace expenses."
        actions={
          <Can permission="finance.expenses.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Expense
            </Button>
          </Can>
        }
      />

      <CreateExpenseDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />
      <CreateExpenseDrawer
        open={editExpenseId !== null}
        mode="edit"
        expenseId={editExpenseId ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditExpenseId(null);
          }
        }}
      />
      <ArchiveExpenseDialog
        open={archiveExpenseId !== null}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveExpenseId(null);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative max-w-sm flex-1">
            <Input
              type="search"
              placeholder="Search expenses..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              aria-label="Search expenses"
            />
          </div>
          <NativeSelect
            value={approvalFilter}
            onChange={(event) => {
              setApprovalFilter(event.target.value as ApprovalStatus | 'all');
              setPage(1);
            }}
            aria-label="Filter by approval status"
            className="w-full sm:w-44"
          >
            {APPROVAL_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All statuses' : APPROVAL_STATUS_LABELS[option]}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={vendorFilter}
            onChange={(event) => {
              setVendorFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by vendor"
            className="w-full sm:w-48"
          >
            <option value="all">All vendors</option>
            {(vendorsData?.items ?? []).map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as ExpenseSortField);
              setPage(1);
            }}
            aria-label="Sort expenses"
            className="w-full sm:w-40"
          >
            <option value="expenseDate">Date</option>
            <option value="amount">Amount</option>
            <option value="updatedAt">Updated</option>
            <option value="createdAt">Created</option>
          </NativeSelect>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => {
                setIncludeArchived(event.target.checked);
                setPage(1);
              }}
              className="size-4 rounded border-input"
            />
            Include archived
          </label>
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
          <LoadingState label="Loading expenses..." />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasActiveFilters ? 'No expenses match your filters' : 'No expenses yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Create your first expense to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setApprovalFilter('all');
                    setVendorFilter('all');
                    setIncludeArchived(false);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Can permission="finance.expenses.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Expense
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <ExpenseListTable
              expenses={expenses}
              vendorNames={vendorNames}
              actionPendingId={actionPendingId}
              onEdit={(expenseId) => {
                setEditExpenseId(expenseId);
              }}
              onArchive={(expenseId) => {
                setArchiveExpenseId(expenseId);
              }}
              onApprove={(expenseId) => {
                void handleApprove(expenseId);
              }}
              onReject={(expenseId) => {
                void handleReject(expenseId);
              }}
            />
            {totalItems > PAGE_SIZE ? (
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
