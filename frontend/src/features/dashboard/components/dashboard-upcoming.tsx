'use client';

import { CalendarDays, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';

interface UpcomingPanelProps {
  readonly title: string;
  readonly description: string;
  readonly icon: typeof CalendarDays;
  readonly href?: string;
}

function UpcomingPanel({ title, description, icon: Icon, href }: UpcomingPanelProps) {
  const content = (
    <Card
      padding
      shadow="none"
      className={href ? 'transition-colors hover:bg-muted/30' : undefined}
    >
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
  );

  if (href === undefined) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

export function DashboardUpcoming() {
  return (
    <div className="space-y-3">
      <UpcomingPanel
        title="Meetings"
        description="Calendar integration coming soon."
        icon={CalendarDays}
      />
      <UpcomingPanel
        title="Tasks"
        description="View and manage workspace tasks."
        icon={CheckSquare}
        href="/tasks"
      />
    </div>
  );
}
