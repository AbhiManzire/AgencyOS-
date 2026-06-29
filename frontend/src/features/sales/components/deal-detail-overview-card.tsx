import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { DealRecord } from '@/features/sales/api/deal.types';
import { formatDealDate, formatDealProbability } from '@/features/sales/utils/deal-display';

interface DealDetailOverviewCardProps {
  readonly deal: DealRecord;
}

interface OverviewFieldProps {
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

function OverviewField({ label, value, href }: OverviewFieldProps) {
  return (
    <div className="space-y-1">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      {href ? (
        <Body>
          <Link href={href} className="text-primary underline-offset-4 hover:underline">
            {value}
          </Link>
        </Body>
      ) : (
        <Body>{value}</Body>
      )}
    </div>
  );
}

export function DealDetailOverviewCard({ deal }: DealDetailOverviewCardProps) {
  const contactLabel = deal.contactName ?? '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <OverviewField
            label="Client"
            value={deal.clientName}
            href={`/clients/${deal.clientId}`}
          />
          <OverviewField label="Contact" value={contactLabel} />
          <OverviewField label="Probability" value={formatDealProbability(deal.stage)} />
          <OverviewField label="Expected Close" value={formatDealDate(deal.expectedCloseDate)} />
        </div>

        <div>
          <Caption className="mb-1 block uppercase tracking-wide">Notes</Caption>
          <Body className="whitespace-pre-wrap text-muted-foreground">—</Body>
        </div>
      </CardContent>
    </Card>
  );
}
