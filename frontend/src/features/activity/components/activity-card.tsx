'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileText,
  FolderKanban,
  GitBranch,
  Handshake,
  Mail,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Pencil,
  Phone,
  Share2,
  Smartphone,
  Tag,
  Trophy,
  UserCheck,
  UserPlus,
  Bell,
  XCircle,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Avatar, StatusBadge } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import { ActivityAttachments } from '@/features/activity/components/activity-attachments';
import { ActivityComments } from '@/features/activity/components/activity-comments';
import { activityTypeLabel } from '@/features/activity/api/activity.mapper';
import type { ActivityType } from '@/features/activity/api/activity.types';
import type { ActivityTimelineEntry } from '@/features/activity/types';
import { formatDateTime } from '@/lib/format/date';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  readonly entry: ActivityTimelineEntry;
  readonly className?: string;
}

const ACTIVITY_ICON_BY_TYPE: Record<ActivityType, LucideIcon> = {
  LEAD_CREATED: UserPlus,
  LEAD_UPDATED: Pencil,
  OWNER_CHANGED: UserCheck,
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
  MEETING: Handshake,
  NOTE: FileText,
  TASK: CheckCircle2,
  FOLLOW_UP: CalendarCheck,
  PROPOSAL_SENT: FileText,
  QUOTE_SENT: FileText,
  INVOICE_SENT: FileText,
  PAYMENT_RECEIVED: Banknote,
  REMINDER: Bell,
  STATUS_CHANGED: CircleDot,
  PIPELINE_CHANGED: GitBranch,
  TAG_ADDED: Tag,
  ATTACHMENT_UPLOADED: Paperclip,
  DOCUMENT_SHARED: Share2,
  DEAL_WON: Trophy,
  DEAL_LOST: XCircle,
  CLIENT_CONVERTED: Briefcase,
  PROJECT_CREATED: FolderKanban,
  CUSTOM: MessageSquare,
};

function formatActivityTimestamp(timestamp: string | Date): string {
  const value = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  return formatDateTime(value);
}

function resolveIcon(activityType: string | undefined): LucideIcon {
  if (activityType !== undefined && activityType in ACTIVITY_ICON_BY_TYPE) {
    return ACTIVITY_ICON_BY_TYPE[activityType as ActivityType];
  }
  return FileText;
}

function ActivityIcon({ icon: Icon }: { readonly icon: LucideIcon }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </div>
  );
}

interface CollapsibleSectionProps {
  readonly title: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}

function CollapsibleSection({ title, open, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/40"
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        {title}
      </button>
      {open ? <div className="border-t border-border px-3 py-3">{children}</div> : null}
    </div>
  );
}

/** Single activity entry card for use inside ActivityTimeline. */
export function ActivityCard({ entry, className }: ActivityCardProps) {
  const initials = entry.actor.initials ?? entry.actor.name.slice(0, 2);
  const icon = resolveIcon(entry.activityType);
  const typeLabel = entry.typeLabel ?? activityTypeLabel(entry.activityType ?? 'CUSTOM');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  return (
    <article className={cn('min-w-0', className)}>
      <div className="flex gap-3">
        <ActivityIcon icon={icon} />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-sm font-semibold">{entry.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge variant="neutral">{typeLabel}</StatusBadge>
                {entry.origin === 'MANUAL' ? (
                  <StatusBadge variant="primary">Manual</StatusBadge>
                ) : entry.origin === 'SYSTEM' ? (
                  <StatusBadge variant="neutral">System</StatusBadge>
                ) : null}
              </div>
            </div>
            <Caption className="shrink-0">{formatActivityTimestamp(entry.timestamp)}</Caption>
          </div>

          <div className="flex items-center gap-2">
            <Avatar size="sm" initials={initials} aria-label={entry.actor.name} />
            <Caption className="font-medium text-foreground">{entry.actor.name}</Caption>
          </div>

          {entry.description ? (
            <Body className="text-muted-foreground">{entry.description}</Body>
          ) : null}

          <div className="space-y-2 pt-1">
            <CollapsibleSection
              title="Comments"
              open={commentsOpen}
              onToggle={() => {
                setCommentsOpen((current) => !current);
              }}
            >
              <ActivityComments activityId={entry.id} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Attachments"
              open={attachmentsOpen}
              onToggle={() => {
                setAttachmentsOpen((current) => !current);
              }}
            >
              <ActivityAttachments activityId={entry.id} />
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </article>
  );
}
