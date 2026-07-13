'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/design-system';
import { MyQueuePanel } from '@/features/sales/workspace/components/my-queue-panel';
import { SalesCalendar } from '@/features/sales/workspace/components/sales-calendar';
import { SalesTaskFormDrawer } from '@/features/sales/workspace/components/sales-task-form-drawer';
import { WorkspaceDashboardCards } from '@/features/sales/workspace/components/workspace-dashboard-cards';
import { WorkspaceWidgets } from '@/features/sales/workspace/components/workspace-widgets';
import type { WorkspaceCalendarView } from '@/features/sales/workspace/api/workspace.types';
import { useWorkspaceCalendar } from '@/features/sales/workspace/hooks/use-workspace-calendar';
import { useWorkspaceDashboard } from '@/features/sales/workspace/hooks/use-workspace-dashboard';
import { useWorkspaceQueue } from '@/features/sales/workspace/hooks/use-workspace-queue';
import { Can } from '@/lib/rbac';

/** Sales executive My Work landing page. */
export default function MyWorkPage() {
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<WorkspaceCalendarView>('month');

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    error: dashboardErrorValue,
    refetch: refetchDashboard,
  } = useWorkspaceDashboard();

  const {
    data: queue,
    isLoading: queueLoading,
    isError: queueError,
    error: queueErrorValue,
    refetch: refetchQueue,
  } = useWorkspaceQueue({ skip: 0, take: 25 });

  const {
    data: calendar,
    isLoading: calendarLoading,
    isError: calendarError,
    error: calendarErrorValue,
    refetch: refetchCalendar,
  } = useWorkspaceCalendar({ view: calendarView });

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="My Work"
        description="Your sales queue, calendar, and daily priorities."
        actions={
          <Can permission="sales.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setTaskDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              New Task
            </Button>
          </Can>
        }
      />

      <div className="space-y-6">
        <WorkspaceDashboardCards
          dashboard={dashboard}
          isLoading={dashboardLoading}
          isError={dashboardError}
          error={dashboardErrorValue}
          onRetry={() => {
            void refetchDashboard();
          }}
        />

        <WorkspaceWidgets widgets={dashboard?.widgets} />

        <div className="grid gap-6 xl:grid-cols-2">
          <MyQueuePanel
            items={queue?.items}
            total={queue?.total ?? 0}
            isLoading={queueLoading}
            isError={queueError}
            error={queueErrorValue}
            onRetry={() => {
              void refetchQueue();
            }}
          />
          <SalesCalendar
            view={calendarView}
            events={calendar?.events}
            from={calendar?.from}
            to={calendar?.to}
            isLoading={calendarLoading}
            isError={calendarError}
            error={calendarErrorValue}
            onViewChange={setCalendarView}
            onRetry={() => {
              void refetchCalendar();
            }}
          />
        </div>
      </div>

      <SalesTaskFormDrawer open={taskDrawerOpen} onOpenChange={setTaskDrawerOpen} />
    </PageContainer>
  );
}
