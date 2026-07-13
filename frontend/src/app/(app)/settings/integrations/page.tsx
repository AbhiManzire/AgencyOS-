'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import type {
  IntegrationCatalogProvider,
  IntegrationConnectionRecord,
} from '@/features/integrations/api/integration.types';
import { AddConnectionDrawer } from '@/features/integrations/components/add-connection-drawer';
import { ConnectCredentialsDrawer } from '@/features/integrations/components/connect-credentials-drawer';
import { ConnectionDetailDrawer } from '@/features/integrations/components/connection-detail-drawer';
import { ConnectionsTable } from '@/features/integrations/components/connections-table';
import { IntegrationHealthDashboard } from '@/features/integrations/components/integration-health-dashboard';
import { IntegrationLogsPanel } from '@/features/integrations/components/integration-logs-panel';
import {
  IntegrationsPageTabs,
  type IntegrationsPageTab,
} from '@/features/integrations/components/integrations-page-tabs';
import { MarketplaceGrid } from '@/features/integrations/components/marketplace-grid';
import { SyncHistoryTable } from '@/features/integrations/components/sync-history-table';
import {
  useIntegrationCatalog,
  useIntegrationConnections,
  useIntegrationSyncLogs,
} from '@/features/integrations/hooks/use-integrations';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export default function IntegrationsPage() {
  const [tab, setTab] = useState<IntegrationsPageTab>('marketplace');
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<IntegrationCatalogProvider | null>(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [connectTarget, setConnectTarget] = useState<IntegrationConnectionRecord | null>(null);
  const [detailConnectionId, setDetailConnectionId] = useState<string | null>(null);
  const [syncPage, setSyncPage] = useState(1);
  const pageSize = 15;

  const catalogQuery = useIntegrationCatalog({ enabled: tab === 'marketplace' });
  const connectionsQuery = useIntegrationConnections(
    { take: 100 },
    { enabled: tab === 'connections' || tab === 'sync' || tab === 'marketplace' },
  );

  const syncParams = useMemo(
    () => ({
      skip: (syncPage - 1) * pageSize,
      take: pageSize,
    }),
    [syncPage],
  );
  const syncLogsQuery = useIntegrationSyncLogs(syncParams, { enabled: tab === 'sync' });

  const filteredProviders = useMemo(() => {
    const providers = catalogQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return providers;
    }
    return providers.filter(
      (provider) =>
        provider.label.toLowerCase().includes(query) ||
        provider.key.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query),
    );
  }, [catalogQuery.data, search]);

  const filteredConnections = useMemo(() => {
    const connections = connectionsQuery.data?.items ?? [];
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return connections;
    }
    return connections.filter(
      (connection) =>
        connection.displayName.toLowerCase().includes(query) ||
        connection.providerKey.toLowerCase().includes(query) ||
        connection.status.toLowerCase().includes(query),
    );
  }, [connectionsQuery.data, search]);

  const connectionNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const connection of connectionsQuery.data?.items ?? []) {
      map.set(connection.id, connection.displayName);
    }
    return map;
  }, [connectionsQuery.data]);

  const syncTotalPages = syncLogsQuery.data
    ? Math.max(1, Math.ceil(syncLogsQuery.data.total / pageSize))
    : 1;

  const activeError =
    tab === 'marketplace'
      ? catalogQuery.error
      : tab === 'connections'
        ? connectionsQuery.error
        : tab === 'sync'
          ? syncLogsQuery.error
          : null;

  const activeLoading =
    (tab === 'marketplace' && catalogQuery.isLoading) ||
    (tab === 'connections' && connectionsQuery.isLoading) ||
    (tab === 'sync' && syncLogsQuery.isLoading);

  const activeRefetch = () => {
    if (tab === 'marketplace') {
      void catalogQuery.refetch();
      return;
    }
    if (tab === 'connections') {
      void connectionsQuery.refetch();
      return;
    }
    if (tab === 'sync') {
      void syncLogsQuery.refetch();
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Integrations"
        description="Connect providers, monitor health, and review sync activity"
      />

      <div className="mb-6">
        <IntegrationHealthDashboard />
      </div>

      <IntegrationsPageTabs
        activeTab={tab}
        onTabChange={(next) => {
          setTab(next);
          setSearch('');
          setSyncPage(1);
        }}
      />

      <div className="space-y-4 pt-4">
        {tab === 'marketplace' || tab === 'connections' ? (
          <div className="relative max-w-sm">
            <Input
              type="search"
              placeholder={tab === 'marketplace' ? 'Search providers...' : 'Search connections...'}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              aria-label={tab === 'marketplace' ? 'Search providers' : 'Search connections'}
            />
          </div>
        ) : null}

        {tab === 'logs' ? (
          <IntegrationLogsPanel />
        ) : activeError ? (
          <ErrorState
            message={extractApiErrorMessage(activeError)}
            action={
              <Button variant="outline" onClick={activeRefetch}>
                Try again
              </Button>
            }
          />
        ) : activeLoading ? (
          <LoadingState
            label={
              tab === 'marketplace'
                ? 'Loading marketplace...'
                : tab === 'connections'
                  ? 'Loading connections...'
                  : 'Loading sync history...'
            }
          />
        ) : tab === 'marketplace' ? (
          <MarketplaceGrid
            providers={filteredProviders}
            onAddConnection={(provider) => {
              setSelectedProvider(provider);
              setAddDrawerOpen(true);
            }}
          />
        ) : tab === 'connections' ? (
          <ConnectionsTable
            connections={filteredConnections}
            onConnect={(connection) => {
              setConnectTarget(connection);
            }}
            onSelect={(connection) => {
              setDetailConnectionId(connection.id);
            }}
          />
        ) : (
          <>
            <SyncHistoryTable
              logs={syncLogsQuery.data?.items ?? []}
              connectionNames={connectionNames}
            />
            {syncLogsQuery.data && syncLogsQuery.data.total > pageSize ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {syncPage} of {syncTotalPages}
                  {syncLogsQuery.isFetching ? ' · Updating...' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={syncPage <= 1}
                    onClick={() => {
                      setSyncPage((current) => Math.max(1, current - 1));
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={syncPage >= syncTotalPages}
                    onClick={() => {
                      setSyncPage((current) => current + 1);
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

      <AddConnectionDrawer
        open={addDrawerOpen}
        provider={selectedProvider}
        onOpenChange={(open) => {
          setAddDrawerOpen(open);
          if (!open) {
            setSelectedProvider(null);
          }
        }}
      />
      <ConnectCredentialsDrawer
        open={connectTarget != null}
        connection={connectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConnectTarget(null);
          }
        }}
      />
      <ConnectionDetailDrawer
        open={detailConnectionId != null}
        connectionId={detailConnectionId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailConnectionId(null);
          }
        }}
        onConnect={(connection) => {
          setDetailConnectionId(null);
          setConnectTarget(connection);
        }}
      />
    </PageContainer>
  );
}
