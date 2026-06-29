'use client';

import { Columns3, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { DealFormDrawer } from '@/features/sales/components/deal-form-drawer';
import { PipelineKanbanBoard } from '@/features/sales/pipeline/components/pipeline-kanban-board';
import { PipelineToolbar } from '@/features/sales/pipeline/components/pipeline-toolbar';
import { PIPELINE_LIST_PARAMS } from '@/features/sales/pipeline/pipeline.constants';
import { mapDealRecordToPipelineCard } from '@/features/sales/pipeline/pipeline.mapper';
import { useDeals } from '@/features/sales/hooks/use-deals';
import { formatDealOwner } from '@/features/sales/utils/deal-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function SalesPipelinePage() {
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const listParams = useMemo(
    () => ({
      ...PIPELINE_LIST_PARAMS,
      ...(ownerFilter !== 'all' && ownerFilter !== 'unassigned'
        ? { ownerUserId: ownerFilter }
        : {}),
    }),
    [ownerFilter],
  );

  const { data, isLoading, error, refetch } = useDeals(listParams);

  const ownerOptions = useMemo(() => {
    if (!data) {
      return [];
    }

    const options = new Map<string, string>();

    for (const deal of data.items) {
      if (deal.ownerUserId === null) {
        continue;
      }

      const label = formatDealOwner(deal.ownerDisplayName, deal.ownerEmail, deal.ownerUserId);
      options.set(deal.ownerUserId, label);
    }

    return [...options.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) =>
        left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
      );
  }, [data]);

  const pipelineDeals = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return data.items.map(mapDealRecordToPipelineCard).filter((deal) => {
      if (ownerFilter === 'unassigned' && deal.ownerUserId !== null) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      return (
        deal.title.toLowerCase().includes(query) ||
        deal.clientName.toLowerCase().includes(query) ||
        deal.contactName.toLowerCase().includes(query) ||
        deal.ownerName.toLowerCase().includes(query)
      );
    });
  }, [data, ownerFilter, search]);

  const hasActiveFilters = search.trim().length > 0 || ownerFilter !== 'all';
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  const clearFilters = (): void => {
    setSearch('');
    setOwnerFilter('all');
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Sales Pipeline"
        description="Track opportunities from lead to close"
        actions={
          <Can permission="sales.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Deal
            </Button>
          </Can>
        }
      />

      <DealFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="space-y-4">
        <PipelineToolbar
          search={search}
          ownerFilter={ownerFilter}
          ownerOptions={ownerOptions}
          onSearchChange={setSearch}
          onOwnerFilterChange={setOwnerFilter}
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
          <LoadingState label="Loading pipeline..." />
        ) : pipelineDeals.length === 0 ? (
          <EmptyState
            icon={Columns3}
            title={hasActiveFilters ? 'No deals match your filters' : 'No deals in the pipeline'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Create a deal to start tracking opportunities.'
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
                      setDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Deal
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <PipelineKanbanBoard deals={pipelineDeals} listParams={listParams} />
        )}
      </div>
    </PageContainer>
  );
}
