'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  Banknote,
  Briefcase,
  CheckSquare,
  Clock,
  FileMinus2,
  FileText,
  FolderKanban,
  Link2,
  Mail,
  MailX,
  Pencil,
  Receipt,
  RotateCcw,
  Send,
  Tag,
  Timer,
  UserMinus,
  UserPlus,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Avatar } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ActivityTimelineEntry } from '@/features/activity/types';
import { formatDateTime } from '@/lib/format/date';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  readonly entry: ActivityTimelineEntry;
  readonly className?: string;
}

const ACTIVITY_ICON_BY_TYPE: Record<string, LucideIcon> = {
  'invoice.created': FileText,
  'invoice.sent': Send,
  'invoice.cancelled': XCircle,
  'invoice.pdf.generated': FileText,
  'invoice.email.sent': Mail,
  'invoice.email.failed': MailX,
  'payment.received': Banknote,
  'expense.added': Wallet,
  'bill.paid': Receipt,
  'credit_note.created': FileMinus2,
  'project.created': FolderKanban,
  'project.updated': Pencil,
  'project.status_changed': Pencil,
  'project.member_added': UserPlus,
  'project.member_removed': UserMinus,
  'project.archived': Archive,
  'project.restored': RotateCcw,
  'task.created': CheckSquare,
  'task.updated': Pencil,
  'task.archived': Archive,
  'task.restored': RotateCcw,
  'task.assigned': UserPlus,
  'task.reassigned': UserPlus,
  'task.dependency_added': Link2,
  'task.dependency_removed': Link2,
  'task.tag_assigned': Tag,
  'task.tag_unassigned': Tag,
  'time.logged': Timer,
  'time.entry.created': Clock,
  'time.entry.updated': Clock,
  'deal.created': Briefcase,
  'deal.updated': Pencil,
  'deal.stage_changed': Briefcase,
  'deal.archived': Archive,
  'deal.restored': RotateCcw,
  'deal.converted_to_project': FolderKanban,
  'deal.converted_to_invoice': FileText,
  'lead.created': UserPlus,
  'lead.updated': Pencil,
  'lead.archived': Archive,
  'lead.restored': RotateCcw,
  'lead.converted': UserPlus,
  'lead.tag_assigned': Tag,
  'lead.tag_unassigned': Tag,
  'quote.created': FileText,
  'quote.updated': Pencil,
  'quote.status_changed': FileText,
  'proposal.created': FileText,
  'proposal.updated': Pencil,
  'proposal.status_changed': FileText,
};

function formatActivityTimestamp(timestamp: string | Date): string {
  const value = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  return formatDateTime(value);
}

function ActivityIcon({ icon: Icon }: { readonly icon: LucideIcon }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </div>
  );
}

/** Single activity entry card for use inside ActivityTimeline. */
export function ActivityCard({ entry, className }: ActivityCardProps) {
  const initials = entry.actor.initials ?? entry.actor.name.slice(0, 2);
  const icon = ACTIVITY_ICON_BY_TYPE[entry.activityType ?? ''] ?? FileText;

  return (
    <article className={cn('min-w-0', className)}>
      <div className="flex gap-3">
        <ActivityIcon icon={icon} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold">{entry.title}</CardTitle>
            <Caption className="shrink-0">{formatActivityTimestamp(entry.timestamp)}</Caption>
          </div>

          <div className="flex items-center gap-2">
            <Avatar size="sm" initials={initials} aria-label={entry.actor.name} />
            <Caption className="font-medium text-foreground">{entry.actor.name}</Caption>
          </div>

          {entry.description ? (
            <Body className="text-muted-foreground">{entry.description}</Body>
          ) : null}
        </div>
      </div>
    </article>
  );
}
