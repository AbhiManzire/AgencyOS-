'use client';

import { BarChart3, CheckSquare, Receipt } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';
import { Can } from '@/lib/rbac';

interface UpcomingPanelProps {
  readonly title: string;
  readonly description: string;
  readonly icon: typeof CheckSquare;
  readonly href: string;
}

function UpcomingPanel({ title, description, icon: Icon, href }: UpcomingPanelProps) {
  return (
    <Link href={href} className="block">
      <Card padding shadow="none" className="transition-colors hover:bg-muted/30">
        <CardContent className="flex items-start gap-3 p-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-sm">{title}</CardTitle>
            <Caption>{description}</Caption>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardUpcoming() {
  return (
    <div className="space-y-3">
      <Can permission="tasks.read" mode="hide">
        <UpcomingPanel
          title="Tasks"
          description="View and manage workspace tasks."
          icon={CheckSquare}
          href="/tasks"
        />
      </Can>
      <Can permission="invoices.read" mode="hide">
        <UpcomingPanel
          title="Invoices"
          description="Review outstanding and recent invoices."
          icon={Receipt}
          href="/finance/invoices"
        />
      </Can>
      <Can permission="reports.read" mode="hide">
        <UpcomingPanel
          title="Reports"
          description="Open founder operational reports."
          icon={BarChart3}
          href="/reports"
        />
      </Can>
    </div>
  );
}
