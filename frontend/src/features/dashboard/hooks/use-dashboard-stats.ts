'use client';

import { useQueries } from '@tanstack/react-query';
import { listClients } from '@/features/clients/api/clients.api';
import { clientsQueryKeys } from '@/features/clients/hooks/use-clients';
import { listInvoices } from '@/features/finance/invoices/api/invoices.api';
import { listProjects } from '@/features/projects/api/projects.api';

export interface DashboardClientStats {
  readonly totalClients: number;
  readonly activeClients: number;
  readonly prospectClients: number;
  readonly archivedClients: number;
  readonly totalProjects: number;
  readonly totalInvoices: number;
  readonly outstandingInvoices: number;
}

interface UseDashboardStatsResult {
  readonly stats: DashboardClientStats;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly refetch: () => void;
}

/** Aggregates client counts for dashboard KPI and health sections. */
export function useDashboardStats(): UseDashboardStatsResult {
  const [
    totalQuery,
    activeQuery,
    prospectQuery,
    archivedQuery,
    projectsQuery,
    invoicesQuery,
    outstandingInvoicesQuery,
  ] = useQueries({
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
      {
        queryKey: ['dashboard', 'projects', 'total'],
        queryFn: () => listProjects({ take: 1 }),
      },
      {
        queryKey: ['dashboard', 'invoices', 'total'],
        queryFn: () => listInvoices({ take: 1 }),
      },
      {
        queryKey: ['dashboard', 'invoices', 'outstanding'],
        queryFn: () => listInvoices({ status: 'SENT', take: 1 }),
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
      totalProjects: projectsQuery.data?.total ?? 0,
      totalInvoices: invoicesQuery.data?.total ?? 0,
      outstandingInvoices: outstandingInvoicesQuery.data?.total ?? 0,
    },
    isLoading:
      totalQuery.isLoading ||
      activeQuery.isLoading ||
      prospectQuery.isLoading ||
      archivedQuery.isLoading ||
      projectsQuery.isLoading ||
      invoicesQuery.isLoading ||
      outstandingInvoicesQuery.isLoading,
    isError:
      totalQuery.isError ||
      activeQuery.isError ||
      prospectQuery.isError ||
      archivedQuery.isError ||
      projectsQuery.isError ||
      invoicesQuery.isError ||
      outstandingInvoicesQuery.isError,
    error:
      totalQuery.error ??
      activeQuery.error ??
      prospectQuery.error ??
      archivedQuery.error ??
      projectsQuery.error ??
      invoicesQuery.error ??
      outstandingInvoicesQuery.error,
    refetch: () => {
      void totalQuery.refetch();
      void activeQuery.refetch();
      void prospectQuery.refetch();
      void archivedQuery.refetch();
      void projectsQuery.refetch();
      void invoicesQuery.refetch();
      void outstandingInvoicesQuery.refetch();
    },
  };
}
