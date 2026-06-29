'use client';

import { CalendarDays, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';

interface PlaceholderPanelProps {
  readonly title: string;
  readonly description: string;
  readonly icon: typeof CalendarDays;
}

function PlaceholderPanel({ title, description, icon: Icon }: PlaceholderPanelProps) {
  return (
    <Card padding shadow="none">
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
}

export function DashboardUpcoming() {
  return (
    <div className="space-y-3">
      <PlaceholderPanel
        title="Meetings"
        description="Calendar integration coming soon."
        icon={CalendarDays}
      />
      <PlaceholderPanel
        title="Tasks Due Today"
        description="Task management module coming soon."
        icon={CheckSquare}
      />
    </div>
  );
}
