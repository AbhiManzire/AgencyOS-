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
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import { mapLeadRecordToListItem } from '@/features/sales/leads/api/lead.mapper';
import { ArchiveLeadDialog } from '@/features/sales/leads/components/archive-lead-dialog';
import { CreateLeadDrawer } from '@/features/sales/leads/components/create-lead-drawer';
import { LeadListPagination } from '@/features/sales/leads/components/lead-list-pagination';
import {
  LeadListMobileCards,
  LeadListTable,
} from '@/features/sales/leads/components/lead-list-table';
import { LeadListToolbar } from '@/features/sales/leads/components/lead-list-toolbar';
import { useArchiveLead } from '@/features/sales/leads/hooks/use-archive-lead';
import { useLeads } from '@/features/sales/leads/hooks/use-leads';
import { useRestoreLead } from '@/features/sales/leads/hooks/use-restore-lead';
import type {
  LeadListStatusFilter,
  LeadSortField,
  SortDirection,
} from '@/features/sales/leads/types';
import { resolveListLeadsQuery } from '@/features/sales/leads/utils/list-leads-query';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const SEARCH_DEBOUNCE_MS = 300;

export default function LeadsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadListStatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [sortField, setSortField] = useState<LeadSortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [archiveLeadId, setArchiveLeadId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const { params: listParams } = resolveListLeadsQuery({
    statusFilter,
    page,
    pageSize,
    search: debouncedSearch,
    assignedToUserId: assignedFilter !== 'all' ? assignedFilter : undefined,
    source: sourceFilter,
    priority: priorityFilter,
    sortField,
    sortDirection,
  });

  const { data, isLoading, isFetching, error, refetch } = useLeads(listParams);
  const { data: workspaceOwners = [] } = useWorkspaceOwners();
  const { mutateAsync: archiveLead, isPending: isArchiving } = useArchiveLead();
  const { mutateAsync: restoreLead, isPending: isRestoring } = useRestoreLead();

  const ownerOptions = useMemo(
    () =>
      workspaceOwners.map((owner) => ({
        id: owner.id,
        label: owner.displayName,
      })),
    [workspaceOwners],
  );

  const leads = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.items.map(mapLeadRecordToListItem);
  }, [data]);

  const totalItems = data?.total ?? 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== 'all' ||
    sourceFilter !== 'all' ||
    priorityFilter !== 'all' ||
    assignedFilter !== 'all';
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  const handleSortFieldChange = (field: LeadSortField): void => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      setPage(1);
      return;
    }

    setSortField(field);
    setSortDirection('asc');
    setPage(1);
  };

  const clearFilters = (): void => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setSourceFilter('all');
    setPriorityFilter('all');
    setAssignedFilter('all');
    setPage(1);
  };

  const handleConfirmArchive = async (): Promise<void> => {
    if (archiveLeadId === null) {
      return;
    }

    try {
      await archiveLead(archiveLeadId);
      showToast('Lead archived successfully');
      setArchiveLeadId(null);
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestoreLead = async (leadId: string): Promise<void> => {
    try {
      await restoreLead({ id: leadId });
      showToast('Lead restored successfully');
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Leads"
        description="Capture and qualify inbound sales leads"
        actions={
          <Can permission="sales.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              New Lead
            </Button>
          </Can>
        }
      />

      <CreateLeadDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <CreateLeadDrawer
        open={editLeadId !== null}
        mode="edit"
        leadId={editLeadId ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditLeadId(null);
          }
        }}
      />

      <ArchiveLeadDialog
        open={archiveLeadId !== null}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveLeadId(null);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />

      <div className="space-y-4">
        <LeadListToolbar
          search={search}
          statusFilter={statusFilter}
          sourceFilter={sourceFilter}
          priorityFilter={priorityFilter}
          assignedFilter={assignedFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          owners={ownerOptions}
          isRefreshing={isFetching && !isLoading}
          onSearchChange={setSearch}
          onStatusFilterChange={(value) => {
            setStatusFilter(value as LeadListStatusFilter);
            setPage(1);
          }}
          onSourceFilterChange={(value) => {
            setSourceFilter(value);
            setPage(1);
          }}
          onPriorityFilterChange={(value) => {
            setPriorityFilter(value);
            setPage(1);
          }}
          onAssignedFilterChange={(value) => {
            setAssignedFilter(value);
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
          onRefresh={() => {
            void refetch();
          }}
        />

        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading leads..." />
        ) : leads.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first lead to start qualifying opportunities.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Can permission="sales.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Lead
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <LeadListMobileCards
              leads={leads}
              onEditLead={setEditLeadId}
              onArchiveLead={setArchiveLeadId}
              onRestoreLead={(leadId) => {
                void handleRestoreLead(leadId);
              }}
            />
            <div className="hidden md:block">
              <LeadListTable
                leads={leads}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={handleSortFieldChange}
                onEditLead={setEditLeadId}
                onArchiveLead={setArchiveLeadId}
                onRestoreLead={(leadId) => {
                  void handleRestoreLead(leadId);
                }}
              />
            </div>
            <LeadListPagination
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
          Restoring lead...
        </div>
      ) : null}
    </PageContainer>
  );
}
