import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ClientRecord } from '@/features/clients/api/client.types';
import { displayClientField } from '@/features/clients/utils/client-display';

interface ClientDetailSummaryCardProps {
  readonly client: ClientRecord;
}

interface SummaryFieldProps {
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

function SummaryField({ label, value, href }: SummaryFieldProps) {
  return (
    <div className="space-y-1">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      {href && value !== '—' ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {value}
        </a>
      ) : (
        <Body>{value}</Body>
      )}
    </div>
  );
}

export function ClientDetailSummaryCard({ client }: ClientDetailSummaryCardProps) {
  const company = displayClientField(client.legalName ?? client.displayName);
  const website = displayClientField(client.website);
  const websiteHref =
    website !== '—' && !website.startsWith('http') ? `https://${website}` : website;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryField label="Company" value={company} />
          <SummaryField label="Client code" value={displayClientField(client.clientCode)} />
          <SummaryField label="Industry" value={displayClientField(client.industry)} />
          <SummaryField label="Currency" value={displayClientField(client.currency)} />
          <SummaryField
            label="Payment terms (days)"
            value={
              client.paymentTermsDays !== null && client.paymentTermsDays !== undefined
                ? String(client.paymentTermsDays)
                : '—'
            }
          />
          <SummaryField
            label="Credit limit"
            value={
              client.creditLimit !== null && client.creditLimit !== undefined
                ? String(client.creditLimit)
                : '—'
            }
          />
          <SummaryField label="GSTIN" value={displayClientField(client.gstin)} />
          <SummaryField label="PAN" value={displayClientField(client.pan)} />
          <SummaryField label="Email" value={displayClientField(client.email)} />
          <SummaryField label="Phone" value={displayClientField(client.phone)} />
          <SummaryField
            label="Website"
            value={website}
            href={websiteHref !== '—' ? websiteHref : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}
