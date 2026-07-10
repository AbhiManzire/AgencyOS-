'use client';

import { useState } from 'react';
import { PageContainer, PageHeader } from '@/design-system';
import {
  DashboardClientHealth,
  DashboardKpiCards,
  DashboardQuickActions,
  DashboardRecentActivity,
  DashboardRecentClients,
  DashboardSection,
  DashboardUpcoming,
} from '@/features/dashboard/components';
import { useDashboardSummary } from '@/features/dashboard/hooks/use-dashboard-summary';
import { CreateClientDrawer } from '@/features/clients/components/create-client-drawer';
import { PermissionRoute } from '@/lib/rbac';

export default function DashboardPage() {
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const { summary, isLoading, isError, error, refetch } = useDashboardSummary();

  return (
    <PermissionRoute permission="dashboard.read">
      <PageContainer size="2xl">
        <PageHeader
          title="Dashboard"
          description="Executive overview of clients, activity, and upcoming work."
        />

        <div className="space-y-6">
          <DashboardKpiCards
            summary={summary}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
          />

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <DashboardRecentActivity />

              <DashboardSection title="Recent Clients" description="Latest client accounts added.">
                <DashboardRecentClients />
              </DashboardSection>
            </div>

            <div className="space-y-6">
              <DashboardSection title="Quick Actions" description="Common workspace tasks.">
                <DashboardQuickActions
                  onNewClient={() => {
                    setCreateClientOpen(true);
                  }}
                />
              </DashboardSection>

              <DashboardSection
                title="Client Health"
                description="Distribution of client lifecycle stages."
              >
                <DashboardClientHealth
                  summary={summary}
                  isLoading={isLoading}
                  isError={isError}
                  error={error}
                  onRetry={refetch}
                />
              </DashboardSection>

              <DashboardSection title="Upcoming" description="Schedule and task previews.">
                <DashboardUpcoming />
              </DashboardSection>
            </div>
          </div>
        </div>

        <CreateClientDrawer open={createClientOpen} onOpenChange={setCreateClientOpen} />
      </PageContainer>
    </PermissionRoute>
  );
}
