'use client';

import { Columns3, Plus, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { DealDashboardMetrics } from '@/features/sales/components/deal-dashboard-metrics';
import { DealFormDrawer } from '@/features/sales/components/deal-form-drawer';
import { useDeals } from '@/features/sales/hooks/use-deals';
import { DealForecastPanel } from '@/features/sales/pipeline/components/deal-forecast-panel';
import { PipelineKanbanBoard } from '@/features/sales/pipeline/components/pipeline-kanban-board';
import { PipelineSettingsSheet } from '@/features/sales/pipeline/components/pipeline-settings-sheet';
import { PipelineToolbar } from '@/features/sales/pipeline/components/pipeline-toolbar';
import {
  PIPELINE_COLUMNS,
  PIPELINE_LIST_PARAMS,
  type PipelineColumnDefinition,
  type PipelineColumnStage,
} from '@/features/sales/pipeline/pipeline.constants';
import { mapDealRecordToPipelineCard } from '@/features/sales/pipeline/pipeline.mapper';
import { useDefaultPipeline } from '@/features/sales/pipelines/hooks/use-pipelines';
import { formatDealOwner, normalizeDealStage } from '@/features/sales/utils/deal-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function SalesPipelinePage() {
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  const { data: defaultPipeline } = useDefaultPipeline();

  const columns = useMemo((): readonly PipelineColumnDefinition[] => {
    const stages = defaultPipeline?.stages.filter((stage) => stage.deletedAt === null) ?? [];
    if (stages.length === 0) {
      return PIPELINE_COLUMNS;
    }

    return stages
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .filter((stage) => stage.stageKey !== 'ARCHIVED')
      .map((stage) => {
        const stageKey = normalizeDealStage(stage.stageKey) as PipelineColumnStage;
        return {
          id: stageKey,
          label: stage.name,
          stage: stageKey,
          probability: stage.probability,
          colorToken: stage.colorToken,
        } satisfies PipelineColumnDefinition;
      });
  }, [defaultPipeline]);

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

    return data.items
      .map(mapDealRecordToPipelineCard)
      .map((deal) => ({ ...deal, stage: normalizeDealStage(deal.stage) }))
      .filter((deal) => deal.stage !== 'ARCHIVED')
      .filter((deal) => {
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
        description="Track opportunities from qualification to close"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Can permission="sales.update">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setSettingsOpen(true);
                }}
              >
                <Settings2 className="size-4" />
                Pipeline settings
              </Button>
            </Can>
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
          </div>
        }
      />

      <DealFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      <PipelineSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

      <div className="space-y-4">
        <DealDashboardMetrics />
        <DealForecastPanel />

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
          <PipelineKanbanBoard deals={pipelineDeals} listParams={listParams} columns={columns} />
        )}
      </div>
    </PageContainer>
  );
}
