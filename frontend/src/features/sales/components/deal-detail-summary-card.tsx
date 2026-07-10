'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import { useActivities } from '@/features/activity/hooks/use-activities';
import type { DealRecord } from '@/features/sales/api/deal.types';
import { useDealFollowUps } from '@/features/sales/follow-ups/hooks/use-deal-follow-ups';
import { formatDealAge, formatDealDate } from '@/features/sales/utils/deal-display';
import { formatDateTime } from '@/lib/format/date';

interface SummaryMetricProps {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

function SummaryMetric({ label, value, hint }: SummaryMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      <Body className="mt-1 text-muted-foreground">{hint}</Body>
    </div>
  );
}

interface DealDetailSummaryCardProps {
  readonly deal: DealRecord;
}

export function DealDetailSummaryCard({ deal }: DealDetailSummaryCardProps) {
  const { data: activities = [], isLoading: isActivityLoading } = useActivities('deal', deal.id);
  const { data: followUps = [], isLoading: isFollowUpLoading } = useDealFollowUps(deal.id);

  const lastActivity = activities.length > 0 ? activities[0] : null;
  const nextFollowUp = useMemo(() => {
    const pending = followUps
      .filter((item) => item.status === 'PENDING')
      .sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
      );
    return pending.length > 0 ? pending[0] : null;
  }, [followUps]);

  let lastActivityValue = '—';
  let lastActivityHint = 'No activity recorded yet';
  if (isActivityLoading && activities.length === 0) {
    lastActivityValue = '…';
    lastActivityHint = 'Loading activity…';
  } else if (lastActivity !== null) {
    const timestamp =
      lastActivity.timestamp instanceof Date
        ? lastActivity.timestamp.toISOString()
        : lastActivity.timestamp;
    lastActivityValue = formatDateTime(timestamp);
    lastActivityHint = lastActivity.title;
  }

  let nextFollowUpValue = '—';
  let nextFollowUpHint = 'No pending follow-ups';
  if (isFollowUpLoading && followUps.length === 0) {
    nextFollowUpValue = '…';
    nextFollowUpHint = 'Loading follow-ups…';
  } else if (nextFollowUp !== null) {
    nextFollowUpValue = formatDealDate(nextFollowUp.scheduledAt);
    nextFollowUpHint = nextFollowUp.subject;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryMetric
            label="Age"
            value={formatDealAge(deal.createdAt)}
            hint="Time since deal was created"
          />
          <SummaryMetric label="Last Activity" value={lastActivityValue} hint={lastActivityHint} />
          <SummaryMetric label="Next Follow-up" value={nextFollowUpValue} hint={nextFollowUpHint} />
        </div>
      </CardContent>
    </Card>
  );
}
