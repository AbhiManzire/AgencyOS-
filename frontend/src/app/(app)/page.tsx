'use client';

import { ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataCard, LoadingState, PageContainer, PageHeader } from '@/design-system';
import {
  DashboardClientHealth,
  DashboardFollowUpCards,
  DashboardKpiCards,
  DashboardQuickActions,
  DashboardRecentActivity,
  DashboardRecentClients,
  DashboardRecentProjects,
  DashboardSection,
  DashboardUpcoming,
} from '@/features/dashboard/components';
import { useDashboardSummary } from '@/features/dashboard/hooks/use-dashboard-summary';
import { CreateClientDrawer } from '@/features/clients/components/create-client-drawer';
import { PermissionRoute, usePermission } from '@/lib/rbac';

export default function DashboardPage() {
  const router = useRouter();
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const { allowed: canSales, isLoading: salesLoading } = usePermission('sales.read');
  const { allowed: canDashboard, isLoading: dashboardLoading } = usePermission('dashboard.read');
  const permissionsReady = !salesLoading && !dashboardLoading;
  const showFounderDashboard = permissionsReady && canDashboard;
  const { summary, isLoading, isError, error, refetch } = useDashboardSummary({
    enabled: showFounderDashboard,
  });

  useEffect(() => {
    if (!permissionsReady) {
      return;
    }

    if (canSales && !canDashboard) {
      router.replace('/sales/my-work');
    }
  }, [canDashboard, canSales, permissionsReady, router]);

  if (!permissionsReady) {
    return (
      <PageContainer size="2xl">
        <LoadingState label="Loading workspace..." />
      </PageContainer>
    );
  }

  if (canSales && !canDashboard) {
    return (
      <PageContainer size="2xl">
        <LoadingState label="Redirecting to My Work..." />
      </PageContainer>
    );
  }

  return (
    <PermissionRoute permission="dashboard.read">
      <PageContainer size="2xl">
        <PageHeader
          title="Founder Dashboard"
          description="Live executive control center — revenue, delivery, sales, and finance."
        />

        <div className="space-y-6">
          {canSales ? (
            <DataCard
              label="Sales Workspace"
              value={
                <Link
                  href="/sales/my-work"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ClipboardList className="size-5" />
                  Open My Work
                </Link>
              }
              hint="Your sales queue, calendar, and daily priorities."
            />
          ) : null}

          <DashboardKpiCards
            summary={summary}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
          />

          <DashboardSection
            title="Follow-ups"
            description="Today's pipeline of reminders, overdue items, and recent timeline activity."
          >
            <DashboardFollowUpCards />
          </DashboardSection>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <DashboardRecentActivity />

              <DashboardSection title="Recent Clients" description="Latest client accounts added.">
                <DashboardRecentClients />
              </DashboardSection>

              <DashboardSection
                title="Recent Projects"
                description="Latest delivery engagements updated."
              >
                <DashboardRecentProjects />
              </DashboardSection>
            </div>

            <div className="space-y-6">
              <DashboardSection title="Quick Actions" description="Common workspace tasks.">
                <DashboardQuickActions
                  onNewClient={() => {
                    setCreateClientOpen(true);
                  }}
                />
                {canSales ? (
                  <div className="mt-3">
                    <Button asChild variant="outline" className="w-full gap-2">
                      <Link href="/sales/my-work">
                        <ClipboardList className="size-4" />
                        Go to My Work
                      </Link>
                    </Button>
                  </div>
                ) : null}
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
