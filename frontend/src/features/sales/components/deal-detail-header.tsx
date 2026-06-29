'use client';

import { Pencil } from 'lucide-react';
import { Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { DealRecord } from '@/features/sales/api/deal.types';
import { DealStageBadge } from '@/features/sales/components/deal-stage-badge';
import { formatDealOwner, formatDealValue } from '@/features/sales/utils/deal-display';
import { Can } from '@/lib/rbac';

interface DealDetailHeaderProps {
  readonly deal: DealRecord;
}

export function DealDetailHeader({ deal }: DealDetailHeaderProps) {
  const ownerLabel = formatDealOwner(deal.ownerDisplayName, deal.ownerEmail, deal.ownerUserId);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {deal.title}
          </h1>
          <DealStageBadge stage={deal.stage} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
          <div>
            <Caption className="block uppercase tracking-wide">Value</Caption>
            <Body className="font-medium">{formatDealValue(deal.value, deal.currency)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Owner</Caption>
            <Body className="text-muted-foreground">{ownerLabel}</Body>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Can permission="sales.update" mode="disable">
          <Button type="button" variant="outline" disabled className="gap-2">
            <Pencil className="size-4" />
            Edit
          </Button>
        </Can>
      </div>
    </div>
  );
}
