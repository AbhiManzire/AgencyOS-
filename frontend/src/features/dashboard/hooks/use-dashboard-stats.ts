import { useQueries } from '@tanstack/react-query';
import { listClients } from '@/features/clients/api/clients.api';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';

export interface DashboardClientStats {
  readonly totalClients: number;
  readonly activeClients: number;
  readonly prospectClients: number;
  readonly archivedClients: number;
}

interface UseDashboardStatsResult {
  readonly stats: DashboardClientStats;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

/** Aggregates client counts for dashboard KPI and health sections. */
export function useDashboardStats(): UseDashboardStatsResult {
  const [totalQuery, activeQuery, prospectQuery, archivedQuery] = useQueries({
    queries: [
      {
        queryKey: clientsQueryKeys.list({ take: 1 }),
        queryFn: () => listClients({ take: 1 }),
      },
      {
        queryKey: clientsQueryKeys.list({ status: 'ACTIVE', take: 1 }),
        queryFn: () => listClients({ status: 'ACTIVE', take: 1 }),
      },
      {
        queryKey: clientsQueryKeys.list({ status: 'PROSPECT', take: 1 }),
        queryFn: () => listClients({ status: 'PROSPECT', take: 1 }),
      },
      {
        queryKey: clientsQueryKeys.list({ includeArchived: true, take: 100 }),
        queryFn: () => listClients({ includeArchived: true, take: 100 }),
      },
    ],
  });

  const archivedClients =
    archivedQuery.data?.items.filter((client) => client.deletedAt !== null).length ?? 0;

  return {
    stats: {
      totalClients: totalQuery.data?.total ?? 0,
      activeClients: activeQuery.data?.total ?? 0,
      prospectClients: prospectQuery.data?.total ?? 0,
      archivedClients,
    },
    isLoading:
      totalQuery.isLoading ||
      activeQuery.isLoading ||
      prospectQuery.isLoading ||
      archivedQuery.isLoading,
    isError:
      totalQuery.isError || activeQuery.isError || prospectQuery.isError || archivedQuery.isError,
  };
}
