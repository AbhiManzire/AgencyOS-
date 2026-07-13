'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, DataCard } from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import type {
  ClientHealthResult,
  ClientMetrics,
} from '@/features/clients/success/api/client-success.types';
import { ClientHealthBadge } from '@/features/clients/success/components/client-health-badge';
import { formatShortDate } from '@/lib/format/date';
import { formatMoney } from '@/lib/format/money';
import { Can } from '@/lib/rbac';

interface ClientMetricsGridProps {
  readonly metrics: ClientMetrics;
  readonly health?: ClientHealthResult;
  readonly currency?: string;
  readonly onRefreshHealth?: () => void;
  readonly isRefreshingHealth?: boolean;
}

export function ClientMetricsGrid({
  metrics,
  health,
  currency = 'USD',
  onRefreshHealth,
  isRefreshingHealth = false,
}: ClientMetricsGridProps) {
  const healthStatus = health?.status ?? metrics.healthStatus;
  const healthScore = health?.score ?? metrics.healthScore;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Client metrics</CardTitle>
          <ClientHealthBadge status={healthStatus} score={healthScore} />
        </div>
        {onRefreshHealth ? (
          <Can permission="clients.update">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefreshingHealth}
              className="gap-2"
              onClick={onRefreshHealth}
            >
              {isRefreshingHealth ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh health
            </Button>
          </Can>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <DataCard label="Lifetime revenue" value={formatMoney(metrics.lifetimeRevenue, currency)} />
        <DataCard label="Outstanding" value={formatMoney(metrics.outstanding, currency)} />
        <DataCard label="Paid amount" value={formatMoney(metrics.paidAmount, currency)} />
        <DataCard label="Open deals" value={String(metrics.openDeals)} />
        <DataCard label="Active projects" value={String(metrics.activeProjects)} />
        <DataCard label="Completed projects" value={String(metrics.completedProjects)} />
        <DataCard label="Client since" value={formatShortDate(metrics.clientSince)} />
        <DataCard label="Next renewal" value={formatShortDate(metrics.renewalDate)} />
        <DataCard label="Last activity" value={formatShortDate(metrics.lastActivityAt)} />
        <DataCard label="Last invoice" value={formatShortDate(metrics.lastInvoiceAt)} />
      </div>

      {health ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Health factors</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Factor
                label="Days since activity"
                value={
                  health.factors.daysSinceLastActivity === null
                    ? '—'
                    : String(health.factors.daysSinceLastActivity)
                }
              />
              <Factor label="Overdue invoices" value={String(health.factors.overdueInvoiceCount)} />
              <Factor label="Delayed projects" value={String(health.factors.delayedProjectCount)} />
              <Factor label="Overdue renewals" value={String(health.factors.overdueRenewalCount)} />
              <Factor
                label="Overdue follow-ups"
                value={String(health.factors.overdueFollowUpCount)}
              />
            </dl>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Factor({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
