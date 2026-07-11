'use client';

import { useRouter } from 'next/navigation';
import type { SyntheticEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeadArchivedBadge } from '@/features/sales/leads/components/lead-archived-badge';
import { LeadPriorityBadge } from '@/features/sales/leads/components/lead-priority-badge';
import { LeadRowActions } from '@/features/sales/leads/components/lead-row-actions';
import { LeadStatusBadge } from '@/features/sales/leads/components/lead-status-badge';
import { SortIndicator } from '@/features/sales/leads/components/lead-list-toolbar';
import type { LeadListItem, LeadSortField, SortDirection } from '@/features/sales/leads/types';
import {
  formatLeadDate,
  formatLeadDealSize,
  formatLeadScore,
  formatLeadSource,
} from '@/features/sales/leads/utils/lead-display';
import { cn } from '@/lib/utils';

interface LeadListTableProps {
  leads: readonly LeadListItem[];
  sortField: LeadSortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: LeadSortField) => void;
  onEditLead: (leadId: string) => void;
  onArchiveLead: (leadId: string) => void;
  onRestoreLead: (leadId: string) => void;
}

interface SortableHeaderProps {
  label: string;
  field: LeadSortField;
  activeField: LeadSortField;
  direction: SortDirection;
  onSort: (field: LeadSortField) => void;
  className?: string;
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = activeField === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="ds-focus-ring inline-flex items-center rounded-sm hover:text-foreground"
        onClick={() => {
          onSort(field);
        }}
      >
        {label}
        <SortIndicator direction={isActive ? direction : null} />
      </button>
    </TableHead>
  );
}

function stopRowNavigation(event: SyntheticEvent): void {
  event.stopPropagation();
}

export function LeadListTable({
  leads,
  sortField,
  sortDirection,
  onSortFieldChange,
  onEditLead,
  onArchiveLead,
  onRestoreLead,
}: LeadListTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="max-h-[min(70vh,640px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
            <TableRow>
              <SortableHeader
                label="Company"
                field="company"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
              />
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead>Status</TableHead>
              <SortableHeader
                label="Priority"
                field="priority"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden sm:table-cell"
              />
              <TableHead className="hidden lg:table-cell">Source</TableHead>
              <TableHead className="hidden lg:table-cell">Assignee</TableHead>
              <SortableHeader
                label="Score"
                field="leadScore"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden xl:table-cell"
              />
              <TableHead className="hidden xl:table-cell">Deal size</TableHead>
              <SortableHeader
                label="Created"
                field="createdAt"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden lg:table-cell"
              />
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className={cn(
                  'cursor-pointer',
                  lead.isArchived ? 'text-muted-foreground' : undefined,
                )}
                onClick={() => {
                  router.push(`/sales/leads/${lead.id}`);
                }}
              >
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lead.company}</p>
                    {lead.code ? (
                      <p className="truncate text-xs text-muted-foreground">{lead.code}</p>
                    ) : null}
                    {lead.isArchived ? (
                      <span className="mt-1 inline-block">
                        <LeadArchivedBadge />
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                  {lead.contactPerson ?? '—'}
                </TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.isArchived ? 'ARCHIVED' : lead.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <LeadPriorityBadge priority={lead.priority} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatLeadSource(lead.source)}
                </TableCell>
                <TableCell className="hidden max-w-[160px] truncate lg:table-cell">
                  {lead.assignedTo}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {formatLeadScore(lead.leadScore)}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {formatLeadDealSize(lead.expectedDealSize)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatLeadDate(lead.createdAt)}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={stopRowNavigation}
                  onKeyDown={stopRowNavigation}
                >
                  <LeadRowActions
                    isArchived={lead.isArchived}
                    isConverted={lead.isConverted}
                    onEdit={() => {
                      onEditLead(lead.id);
                    }}
                    onArchive={() => {
                      onArchiveLead(lead.id);
                    }}
                    onRestore={() => {
                      onRestoreLead(lead.id);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface LeadListMobileCardsProps {
  leads: readonly LeadListItem[];
  onEditLead: (leadId: string) => void;
  onArchiveLead: (leadId: string) => void;
  onRestoreLead: (leadId: string) => void;
}

export function LeadListMobileCards({
  leads,
  onEditLead,
  onArchiveLead,
  onRestoreLead,
}: LeadListMobileCardsProps) {
  const router = useRouter();

  return (
    <div className="space-y-3 md:hidden">
      {leads.map((lead) => (
        <article
          key={lead.id}
          className={cn(
            'rounded-lg border border-border bg-card p-4',
            lead.isArchived ? 'text-muted-foreground' : undefined,
          )}
          onClick={() => {
            router.push(`/sales/leads/${lead.id}`);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              router.push(`/sales/leads/${lead.id}`);
            }
          }}
          role="link"
          tabIndex={0}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{lead.company}</p>
              <p className="truncate text-sm text-muted-foreground">
                {lead.contactPerson ?? 'No contact'}
              </p>
            </div>
            <div onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
              <LeadRowActions
                isArchived={lead.isArchived}
                isConverted={lead.isConverted}
                onEdit={() => {
                  onEditLead(lead.id);
                }}
                onArchive={() => {
                  onArchiveLead(lead.id);
                }}
                onRestore={() => {
                  onRestoreLead(lead.id);
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <LeadStatusBadge status={lead.isArchived ? 'ARCHIVED' : lead.status} />
            <LeadPriorityBadge priority={lead.priority} />
          </div>
        </article>
      ))}
    </div>
  );
}
