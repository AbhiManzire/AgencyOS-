'use client';

import { Archive, Briefcase, FileText, Pencil, RotateCcw } from 'lucide-react';
import { Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { DealRecord } from '@/features/sales/api/deal.types';
import { DealPriorityBadge } from '@/features/sales/components/deal-priority-badge';
import { DealStageBadge } from '@/features/sales/components/deal-stage-badge';
import { formatDealOwner, formatDealValue } from '@/features/sales/utils/deal-display';
import { Can } from '@/lib/rbac';

interface DealDetailHeaderProps {
  readonly deal: DealRecord;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
  readonly onConvertToProject: () => void;
  readonly onConvertToInvoice: () => void;
  readonly isArchivePending?: boolean;
  readonly isRestorePending?: boolean;
  readonly isConvertProjectPending?: boolean;
  readonly isConvertInvoicePending?: boolean;
}

export function DealDetailHeader({
  deal,
  onEdit,
  onArchive,
  onRestore,
  onConvertToProject,
  onConvertToInvoice,
  isArchivePending = false,
  isRestorePending = false,
  isConvertProjectPending = false,
  isConvertInvoicePending = false,
}: DealDetailHeaderProps) {
  const ownerLabel = formatDealOwner(deal.ownerDisplayName, deal.ownerEmail, deal.ownerUserId);
  const archived = deal.stage === 'ARCHIVED' || deal.deletedAt !== null;
  const isWon = deal.stage === 'WON';
  const hasProject = deal.convertedProjectId !== null;

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {deal.title}
          </h1>
          <DealStageBadge stage={deal.stage} />
          <DealPriorityBadge priority={deal.priority} />
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
        {!archived && !hasProject ? (
          <Can permission="sales.update" mode="disable">
            <Button
              type="button"
              className="gap-2"
              disabled={isConvertProjectPending}
              onClick={onConvertToProject}
            >
              <Briefcase className="size-4" />
              Convert to project
            </Button>
          </Can>
        ) : null}
        {isWon && hasProject ? (
          <Can permission="sales.update" mode="disable">
            <Button
              type="button"
              className="gap-2"
              disabled={isConvertInvoicePending}
              onClick={onConvertToInvoice}
            >
              <FileText className="size-4" />
              Convert to invoice
            </Button>
          </Can>
        ) : null}
        <Can permission="sales.update" mode="disable">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={archived}
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </Can>
        {archived ? (
          <Can permission="sales.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isRestorePending}
              onClick={onRestore}
            >
              <RotateCcw className="size-4" />
              Restore
            </Button>
          </Can>
        ) : (
          <Can permission="sales.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-danger"
              disabled={isArchivePending}
              onClick={onArchive}
            >
              <Archive className="size-4" />
              Archive
            </Button>
          </Can>
        )}
      </div>
    </div>
  );
}
