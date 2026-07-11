import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { DealRecord } from '@/features/sales/api/deal.types';
import {
  DEAL_PRIORITY_LABELS,
  formatDealDate,
  formatDealProbability,
} from '@/features/sales/utils/deal-display';

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
          {deal.leadId ? (
            <OverviewField label="Lead" value="View lead" href={`/sales/leads/${deal.leadId}`} />
          ) : (
            <OverviewField label="Lead" value="—" />
          )}
          <OverviewField label="Service" value={deal.service ?? '—'} />
          <OverviewField
            label="Probability"
            value={formatDealProbability(deal.stage, deal.probability)}
          />
          <OverviewField label="Priority" value={DEAL_PRIORITY_LABELS[deal.priority]} />
          <OverviewField label="Expected Close" value={formatDealDate(deal.expectedCloseDate)} />
          <OverviewField label="Stage entered" value={formatDealDate(deal.stageEnteredAt)} />
          {deal.convertedProjectId ? (
            <OverviewField
              label="Project"
              value="View project"
              href={`/projects/${deal.convertedProjectId}`}
            />
          ) : null}
          {deal.wonAt ? <OverviewField label="Won at" value={formatDealDate(deal.wonAt)} /> : null}
          {deal.lostAt ? (
            <OverviewField label="Lost at" value={formatDealDate(deal.lostAt)} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
