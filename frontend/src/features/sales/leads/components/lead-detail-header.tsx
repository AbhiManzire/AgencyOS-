'use client';

import { Archive, Briefcase, Pencil, RotateCcw, UserPlus } from 'lucide-react';
import { Body, Caption } from '@/design-system';
import { Button } from '@/components/ui/button';
import type { LeadRecord } from '@/features/sales/leads/api/lead.types';
import { LeadArchivedBadge } from '@/features/sales/leads/components/lead-archived-badge';
import { LeadPriorityBadge } from '@/features/sales/leads/components/lead-priority-badge';
import { LeadStatusBadge } from '@/features/sales/leads/components/lead-status-badge';
import { isLeadArchived } from '@/features/sales/leads/utils/list-leads-query';
import { formatDealOwner } from '@/features/sales/utils/deal-display';
import { Can } from '@/lib/rbac';

interface LeadDetailHeaderProps {
  readonly lead: LeadRecord;
  readonly onEdit: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
  readonly onConvert: () => void;
  readonly onCreateDeal?: () => void;
  readonly isRestorePending?: boolean;
  readonly isConvertPending?: boolean;
  readonly isCreateDealPending?: boolean;
}

export function LeadDetailHeader({
  lead,
  onEdit,
  onArchive,
  onRestore,
  onConvert,
  onCreateDeal,
  isRestorePending = false,
  isConvertPending = false,
  isCreateDealPending = false,
}: LeadDetailHeaderProps) {
  const archived = isLeadArchived(lead);
  const converted = lead.status === 'CONVERTED' || lead.convertedClientId !== null;
  const qualified = lead.status === 'QUALIFIED' && !archived;
  const assignee = formatDealOwner(
    lead.assignedToDisplayName,
    lead.assignedToEmail,
    lead.assignedToUserId,
  );

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1
            className={
              archived
                ? 'text-2xl font-semibold tracking-tight text-muted-foreground md:text-3xl'
                : 'text-2xl font-semibold tracking-tight text-foreground md:text-3xl'
            }
          >
            {lead.company}
          </h1>
          <LeadStatusBadge status={archived ? 'ARCHIVED' : lead.status} />
          <LeadPriorityBadge priority={lead.priority} />
          {archived ? <LeadArchivedBadge /> : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
          <div>
            <Caption className="block uppercase tracking-wide">Assignee</Caption>
            <Body className="text-muted-foreground">{assignee}</Body>
          </div>
          {lead.contactPerson ? (
            <div>
              <Caption className="block uppercase tracking-wide">Contact</Caption>
              <Body className="text-muted-foreground">{lead.contactPerson}</Body>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {qualified && onCreateDeal ? (
          <Can permission="sales.create" mode="disable">
            <Button
              type="button"
              className="gap-2"
              disabled={isCreateDealPending}
              onClick={onCreateDeal}
            >
              <Briefcase className="size-4" />
              Create Deal
            </Button>
          </Can>
        ) : null}
        {!archived && !converted ? (
          <Can permission="sales.update" mode="disable">
            <Button type="button" className="gap-2" disabled={isConvertPending} onClick={onConvert}>
              <UserPlus className="size-4" />
              Convert to client
            </Button>
          </Can>
        ) : null}
        <Can permission="sales.update" mode="disable">
          <Button
            type="button"
            variant="outline"
            disabled={archived || converted}
            className="gap-2"
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
