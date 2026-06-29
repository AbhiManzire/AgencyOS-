import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { DealRecord } from '@/features/sales/api/deal.types';
import { formatDealAge } from '@/features/sales/utils/deal-display';

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
          <SummaryMetric label="Last Activity" value="—" hint="Activity tracking coming soon" />
          <SummaryMetric label="Next Follow-up" value="—" hint="Follow-up scheduling coming soon" />
        </div>
      </CardContent>
    </Card>
  );
}
