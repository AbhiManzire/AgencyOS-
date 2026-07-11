'use client';

import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { mapClientRecordToListItem } from '@/features/clients/api/client.mapper';
import { ArchiveClientDialog } from '@/features/clients/components/archive-client-dialog';
import {
  ClientListMobileCards,
  ClientListTable,
} from '@/features/clients/components/client-list-table';
import { ClientListPagination } from '@/features/clients/components/client-list-pagination';
import { ClientListToolbar } from '@/features/clients/components/client-list-toolbar';
import { CreateClientDrawer } from '@/features/clients/components/create-client-drawer';
import { useArchiveClient } from '@/features/clients/hooks/use-archive-client';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useRestoreClient } from '@/features/clients/hooks/use-restore-client';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import type {
  ClientListStatusFilter,
  ClientSortField,
  SortDirection,
} from '@/features/clients/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';
import { resolveListClientsQuery } from '@/features/clients/utils/list-clients-query';

const SEARCH_DEBOUNCE_MS = 300;

export default function ClientsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientListStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortField, setSortField] = useState<ClientSortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [archiveClientId, setArchiveClientId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const { params: listParams } = resolveListClientsQuery({
    statusFilter,
    page,
    pageSize,
    search: debouncedSearch,
    ownerUserId: ownerFilter !== 'all' ? ownerFilter : undefined,
    sortField,
    sortDirection,
  });

  const { data, isLoading, isFetching, error, refetch } = useClients(listParams);
  const { data: workspaceOwners = [] } = useWorkspaceOwners();
  const { mutateAsync: archiveClient, isPending: isArchiving } = useArchiveClient();
  const { mutateAsync: restoreClient, isPending: isRestoring } = useRestoreClient();

  const ownersById = useMemo(() => {
    return new Map(workspaceOwners.map((owner) => [owner.id, owner]));
  }, [workspaceOwners]);

  const ownerOptions = useMemo(
    () =>
      workspaceOwners.map((owner) => ({
        id: owner.id,
        label: owner.displayName,
      })),
    [workspaceOwners],
  );

  const clients = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.items.map((record) => mapClientRecordToListItem(record, ownersById));
  }, [data, ownersById]);

  const totalItems = data?.total ?? 0;

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== 'all' || ownerFilter !== 'all';
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  const handleSortFieldChange = (field: ClientSortField): void => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      setPage(1);
      return;
    }

    setSortField(field);
    setSortDirection('asc');
    setPage(1);
  };

  const handleToggleRow = (id: string, checked: boolean): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleToggleAll = (checked: boolean): void => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(clients.map((client) => client.id)));
  };

  const clearFilters = (): void => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setOwnerFilter('all');
    setPage(1);
  };

  const handleRefresh = (): void => {
    void refetch();
  };

  const handleConfirmArchive = async (): Promise<void> => {
    if (archiveClientId === null) {
      return;
    }

    try {
      await archiveClient(archiveClientId);
      showToast('Client archived successfully');
      setArchiveClientId(null);
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestoreClient = async (clientId: string): Promise<void> => {
    try {
      await restoreClient({ id: clientId });
      showToast('Client restored successfully');
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Clients"
        description="Manage all client organizations"
        actions={
          <Can permission="clients.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              New Client
            </Button>
          </Can>
        }
      />

      <CreateClientDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <CreateClientDrawer
        open={editClientId !== null}
        mode="edit"
        clientId={editClientId ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditClientId(null);
          }
        }}
      />

      <ArchiveClientDialog
        open={archiveClientId !== null}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveClientId(null);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />

      <div className="space-y-4">
        <ClientListToolbar
          search={search}
          statusFilter={statusFilter}
          ownerFilter={ownerFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          owners={ownerOptions}
          isRefreshing={isFetching && !isLoading}
          onSearchChange={setSearch}
          onStatusFilterChange={(value) => {
            setStatusFilter(value as ClientListStatusFilter);
            setPage(1);
          }}
          onOwnerFilterChange={(value) => {
            setOwnerFilter(value);
            setPage(1);
          }}
          onSortFieldChange={(value) => {
            setSortField(value);
            setPage(1);
          }}
          onSortDirectionToggle={() => {
            setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
            setPage(1);
          }}
          onRefresh={handleRefresh}
        />

        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            action={
              <Button variant="outline" onClick={handleRefresh}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading clients..." />
        ) : clients.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No clients match your filters' : 'No clients yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first client to get started.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Can permission="clients.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Client
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <ClientListMobileCards
              clients={clients}
              selectedIds={selectedIds}
              onToggleRow={handleToggleRow}
              onEditClient={setEditClientId}
              onArchiveClient={setArchiveClientId}
              onRestoreClient={(clientId) => {
                void handleRestoreClient(clientId);
              }}
            />
            <div className="hidden md:block">
              <ClientListTable
                clients={clients}
                selectedIds={selectedIds}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={handleSortFieldChange}
                onToggleRow={handleToggleRow}
                onToggleAll={handleToggleAll}
                onEditClient={setEditClientId}
                onArchiveClient={setArchiveClientId}
                onRestoreClient={(clientId) => {
                  void handleRestoreClient(clientId);
                }}
              />
            </div>
            <ClientListPagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {isRestoring ? (
        <div className="sr-only" aria-live="polite">
          Restoring client...
        </div>
      ) : null}
    </PageContainer>
  );
}
