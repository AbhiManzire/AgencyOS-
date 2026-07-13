'use client';

import { DataCard } from '@/design-system';
import type { WorkspaceDashboardWidgets } from '@/features/sales/workspace/api/workspace.types';
import { formatWorkspacePercent } from '@/features/sales/workspace/utils/workspace-labels';
import { formatMoney } from '@/lib/format/money';

interface WorkspaceWidgetsProps {
  readonly widgets: WorkspaceDashboardWidgets | undefined;
  readonly currency?: string;
}

/** Performance widgets row for the sales My Work page. */
export function WorkspaceWidgets({ widgets, currency = 'USD' }: WorkspaceWidgetsProps) {
  if (widgets === undefined) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <DataCard
        label="Pipeline"
        value={formatMoney(widgets.currentPipeline, currency, 0)}
        hint="Open deal value"
      />
      <DataCard label="Tasks Done" value={widgets.tasksCompletedToday} hint="Completed today" />
      <DataCard
        label="Calls Done"
        value={widgets.callsCompletedToday}
        hint="Calls completed today"
      />
      <DataCard
        label="Meetings Done"
        value={widgets.meetingsCompletedToday}
        hint="Meetings completed today"
      />
      <DataCard
        label="Lead Conversion"
        value={formatWorkspacePercent(widgets.leadConversionRate)}
        hint="Converted / total leads"
      />
      <DataCard
        label="Deal Win Rate"
        value={formatWorkspacePercent(widgets.dealWinRate)}
        hint="Won / (won + lost)"
      />
    </div>
  );
}
