import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { LeadRecord } from '@/features/sales/leads/api/lead.types';
import {
  formatLeadDate,
  formatLeadDealSize,
  formatLeadScore,
  formatLeadSource,
} from '@/features/sales/leads/utils/lead-display';
import { formatDealOwner } from '@/features/sales/utils/deal-display';

interface LeadDetailOverviewCardProps {
  readonly lead: LeadRecord;
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

function display(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }
  return value;
}

export function LeadDetailOverviewCard({ lead }: LeadDetailOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <OverviewField label="Company" value={lead.company} />
          <OverviewField label="Code" value={display(lead.code)} />
          <OverviewField label="Contact" value={display(lead.contactPerson)} />
          <OverviewField label="Email" value={display(lead.email)} />
          <OverviewField label="Phone" value={display(lead.phone)} />
          <OverviewField label="WhatsApp" value={display(lead.whatsapp)} />
          <OverviewField label="Website" value={display(lead.website)} />
          <OverviewField label="Industry" value={display(lead.industry)} />
          <OverviewField label="Country" value={display(lead.country)} />
          <OverviewField label="Source" value={formatLeadSource(lead.source)} />
          <OverviewField
            label="Assignee"
            value={formatDealOwner(
              lead.assignedToDisplayName,
              lead.assignedToEmail,
              lead.assignedToUserId,
            )}
          />
          <OverviewField label="Lead score" value={formatLeadScore(lead.leadScore)} />
          <OverviewField
            label="Expected deal size"
            value={formatLeadDealSize(lead.expectedDealSize)}
          />
          <OverviewField label="Created" value={formatLeadDate(lead.createdAt)} />
          {lead.convertedClientId ? (
            <OverviewField
              label="Converted client"
              value="View client"
              href={`/clients/${lead.convertedClientId}`}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
