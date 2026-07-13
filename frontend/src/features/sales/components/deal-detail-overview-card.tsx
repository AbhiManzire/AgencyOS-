import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { DealRecord } from '@/features/sales/api/deal.types';
import {
  DEAL_PRIORITY_LABELS,
  formatDealDate,
  formatDealForecastCategory,
  formatDealProbability,
  formatDealSource,
  formatDealStatus,
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
        {deal.description ? (
          <div className="space-y-1">
            <Caption className="block uppercase tracking-wide">Description</Caption>
            <Body className="whitespace-pre-wrap text-muted-foreground">{deal.description}</Body>
          </div>
        ) : null}
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
          <OverviewField label="Status" value={formatDealStatus(deal.status)} />
          <OverviewField label="Source" value={formatDealSource(deal.source)} />
          <OverviewField
            label="Forecast"
            value={formatDealForecastCategory(deal.forecastCategory)}
          />
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
          {deal.lossReason ? <OverviewField label="Loss reason" value={deal.lossReason} /> : null}
          {deal.competitor ? <OverviewField label="Competitor" value={deal.competitor} /> : null}
          {deal.lossNotes ? <OverviewField label="Loss notes" value={deal.lossNotes} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
