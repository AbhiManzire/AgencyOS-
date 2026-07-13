'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  DataCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { ClientHealthBadge } from '@/features/clients/success/components/client-health-badge';
import { useClientSuccessDashboard } from '@/features/clients/success/hooks/use-client-success-dashboard';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClientSuccessDashboardProps {
  readonly currency?: string;
}

export function ClientSuccessDashboard({ currency = 'USD' }: ClientSuccessDashboardProps) {
  const { data, isLoading, error, refetch } = useClientSuccessDashboard();

  if (isLoading) {
    return <LoadingState label="Loading Client Success..." />;
  }

  if (error || data === undefined) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const { healthDistribution, clientsAtRisk } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <DataCard label="Active clients" value={String(data.activeClients)} />
        <DataCard label="New this month" value={String(data.newClients)} />
        <DataCard label="Revenue (month)" value={formatMoney(data.revenue, currency, 0)} />
        <DataCard label="Outstanding" value={formatMoney(data.outstanding, currency, 0)} />
        <DataCard label="Renewals this month" value={String(data.renewalsThisMonth)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Green</p>
                <p className="text-lg font-semibold">{healthDistribution.green}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Yellow</p>
                <p className="text-lg font-semibold">{healthDistribution.yellow}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Red</p>
                <p className="text-lg font-semibold">{healthDistribution.red}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Unknown</p>
                <p className="text-lg font-semibold">{healthDistribution.unknown}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients at risk</CardTitle>
          </CardHeader>
          <CardContent>
            {clientsAtRisk.length === 0 ? (
              <EmptyState
                title="No clients at risk"
                description="Yellow and red health clients will appear here."
              />
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Next renewal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsAtRisk.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {client.displayName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ClientHealthBadge status={client.healthStatus} />
                        </TableCell>
                        <TableCell>{formatMoney(client.outstanding, currency, 0)}</TableCell>
                        <TableCell>{formatShortDate(client.nextRenewalDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
