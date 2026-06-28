'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import type {
  ClientListStatusFilter,
  ClientSortField,
  SortDirection,
} from '@/features/clients/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { resolveListClientsQuery } from '@/features/clients/utils/list-clients-query';

function compareClients(
  a: ReturnType<typeof mapClientRecordToListItem>,
  b: ReturnType<typeof mapClientRecordToListItem>,
  field: ClientSortField,
  direction: SortDirection,
): number {
  if (field === 'createdAt') {
    const result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return direction === 'asc' ? result : -result;
  }

  const result = a[field].localeCompare(b[field], undefined, { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

export default function ClientsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientListStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortField, setSortField] = useState<ClientSortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [archiveClientId, setArchiveClientId] = useState<string | null>(null);

  const { params: listParams, usesArchivedClientSideFilter } = resolveListClientsQuery(
    statusFilter,
    page,
    pageSize,
  );

  const { data, isLoading, isFetching, error, refetch } = useClients(listParams);
  const { mutateAsync: archiveClient, isPending: isArchiving } = useArchiveClient();
  const { mutateAsync: restoreClient, isPending: isRestoring } = useRestoreClient();

  const owners = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      ...new Set(
        data.items
          .map((client) => client.ownerUserId)
          .filter((ownerId): ownerId is string => ownerId !== null && ownerId.length > 0),
      ),
    ].sort();
  }, [data]);

  const filteredClients = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();

    const mapped = data.items
      .map(mapClientRecordToListItem)
      .filter((client) => !usesArchivedClientSideFilter || client.isArchived)
      .filter((client) => {
        const matchesSearch =
          query.length === 0 ||
          client.displayName.toLowerCase().includes(query) ||
          client.company.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.owner.toLowerCase().includes(query);

        const matchesOwner = ownerFilter === 'all' || client.owner === ownerFilter;

        return matchesSearch && matchesOwner;
      })
      .sort((a, b) => compareClients(a, b, sortField, sortDirection));

    if (!usesArchivedClientSideFilter) {
      return mapped;
    }

    const start = (page - 1) * pageSize;
    return mapped.slice(start, start + pageSize);
  }, [
    data,
    ownerFilter,
    page,
    pageSize,
    search,
    sortDirection,
    sortField,
    usesArchivedClientSideFilter,
  ]);

  const totalItems = useMemo(() => {
    if (!data) {
      return 0;
    }

    if (!usesArchivedClientSideFilter) {
      return data.total;
    }

    const query = search.trim().toLowerCase();

    return data.items
      .map(mapClientRecordToListItem)
      .filter((client) => client.isArchived)
      .filter((client) => {
        const matchesSearch =
          query.length === 0 ||
          client.displayName.toLowerCase().includes(query) ||
          client.company.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.owner.toLowerCase().includes(query);

        const matchesOwner = ownerFilter === 'all' || client.owner === ownerFilter;

        return matchesSearch && matchesOwner;
      }).length;
  }, [data, ownerFilter, search, usesArchivedClientSideFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== 'all' || ownerFilter !== 'all';
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  const handleSortFieldChange = (field: ClientSortField): void => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
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

    setSelectedIds(new Set(filteredClients.map((client) => client.id)));
  };

  const clearFilters = (): void => {
    setSearch('');
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
          owners={owners}
          isRefreshing={isFetching && !isLoading}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value as ClientListStatusFilter);
            setPage(1);
          }}
          onOwnerFilterChange={(value) => {
            setOwnerFilter(value);
            setPage(1);
          }}
          onSortFieldChange={setSortField}
          onSortDirectionToggle={() => {
            setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
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
        ) : filteredClients.length === 0 ? (
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
              ) : undefined
            }
          />
        ) : (
          <>
            <ClientListMobileCards
              clients={filteredClients}
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
                clients={filteredClients}
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
