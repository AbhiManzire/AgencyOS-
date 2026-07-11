'use client';

import { Building2, Plus } from 'lucide-react';
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
import { ArchiveVendorDialog } from '@/features/finance/vendors/components/archive-vendor-dialog';
import { CreateVendorDrawer } from '@/features/finance/vendors/components/create-vendor-drawer';
import { VendorListTable } from '@/features/finance/vendors/components/vendor-list-table';
import { useArchiveVendor } from '@/features/finance/vendors/hooks/use-archive-vendor';
import { useRestoreVendor } from '@/features/finance/vendors/hooks/use-restore-vendor';
import { useVendors } from '@/features/finance/vendors/hooks/use-vendors';
import type { VendorSortField } from '@/features/finance/vendors/api/vendor.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

export default function VendorsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortBy, setSortBy] = useState<VendorSortField>('updatedAt');
  const [page, setPage] = useState(1);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editVendorId, setEditVendorId] = useState<string | null>(null);
  const [archiveVendorId, setArchiveVendorId] = useState<string | null>(null);

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
      includeArchived: includeArchived ? true : undefined,
      sortBy,
      sortOrder: 'desc' as const,
    }),
    [debouncedSearch, includeArchived, page, sortBy],
  );

  const { data, isLoading, isFetching, error, refetch } = useVendors(listParams);
  const { mutateAsync: archiveVendor, isPending: isArchiving } = useArchiveVendor();
  const { mutateAsync: restoreVendor, isPending: isRestoring } = useRestoreVendor();

  const vendors = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const hasActiveFilters = debouncedSearch.trim().length > 0 || includeArchived;

  const handleConfirmArchive = async (): Promise<void> => {
    if (archiveVendorId === null) {
      return;
    }

    try {
      await archiveVendor(archiveVendorId);
      showToast('Vendor archived', 'success');
      setArchiveVendorId(null);
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (vendorId: string): Promise<void> => {
    try {
      await restoreVendor({ id: vendorId });
      showToast('Vendor restored', 'success');
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Vendors"
        description="Manage suppliers and vendors for expenses and purchase bills."
        actions={
          <Can permission="finance.vendors.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Vendor
            </Button>
          </Can>
        }
      />

      <CreateVendorDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />
      <CreateVendorDrawer
        open={editVendorId !== null}
        mode="edit"
        vendorId={editVendorId ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditVendorId(null);
          }
        }}
      />
      <ArchiveVendorDialog
        open={archiveVendorId !== null}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveVendorId(null);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Input
              type="search"
              placeholder="Search vendors..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              aria-label="Search vendors"
            />
          </div>
          <NativeSelect
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as VendorSortField);
              setPage(1);
            }}
            aria-label="Sort vendors"
            className="w-full sm:w-44"
          >
            <option value="updatedAt">Updated</option>
            <option value="createdAt">Created</option>
            <option value="name">Name</option>
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
          <LoadingState label="Loading vendors..." />
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasActiveFilters ? 'No vendors match your filters' : 'No vendors yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Create your first vendor to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setIncludeArchived(false);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Can permission="finance.vendors.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Vendor
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <VendorListTable
              vendors={vendors}
              onEdit={(vendorId) => {
                setEditVendorId(vendorId);
              }}
              onArchive={(vendorId) => {
                setArchiveVendorId(vendorId);
              }}
              onRestore={(vendorId) => {
                if (!isRestoring) {
                  void handleRestore(vendorId);
                }
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
