'use client';

import {
  Check,
  FileText,
  Phone,
  RefreshCw,
  StickyNote,
  UserPlus,
  Users,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkspaceQueueItem } from '@/features/sales/workspace/api/workspace.types';
import { Can } from '@/lib/rbac';
import { cn } from '@/lib/utils';

interface QuickActionBarProps {
  readonly item: WorkspaceQueueItem;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly onComplete: () => void;
  readonly onReschedule: () => void;
  readonly onReassign: () => void;
  readonly onAddNote: () => void;
  readonly onLogCall: () => void;
  readonly onStartMeeting: () => void;
  readonly onConvertLead: () => void;
  readonly onOpenDeal: () => void;
}

/** Inline quick-action buttons for a My Queue row. */
export function QuickActionBar({
  item,
  disabled = false,
  className,
  onComplete,
  onReschedule,
  onReassign,
  onAddNote,
  onLogCall,
  onStartMeeting,
  onConvertLead,
  onOpenDeal,
}: QuickActionBarProps) {
  const isSalesTask = item.sourceType === 'sales_task';
  const hasEntity =
    (item.leadId !== null && item.leadId !== undefined && item.leadId.length > 0) ||
    (item.dealId !== null && item.dealId !== undefined && item.dealId.length > 0) ||
    (item.clientId !== null && item.clientId !== undefined && item.clientId.length > 0);
  const hasLead = item.leadId !== null && item.leadId !== undefined && item.leadId.length > 0;
  const hasDeal = item.dealId !== null && item.dealId !== undefined && item.dealId.length > 0;

  return (
    <Can permission="sales.update">
      <div className={cn('flex flex-wrap gap-1', className)}>
        {isSalesTask ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs"
              disabled={disabled}
              onClick={onComplete}
            >
              <Check className="size-3.5" />
              Complete
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs"
              disabled={disabled}
              onClick={onReschedule}
            >
              <RefreshCw className="size-3.5" />
              Reschedule
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs"
              disabled={disabled}
              onClick={onReassign}
            >
              <UserPlus className="size-3.5" />
              Reassign
            </Button>
          </>
        ) : null}

        {hasEntity ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs"
              disabled={disabled}
              onClick={onAddNote}
            >
              <StickyNote className="size-3.5" />
              Note
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs"
              disabled={disabled}
              onClick={onLogCall}
            >
              <Phone className="size-3.5" />
              Call
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs"
              disabled={disabled}
              onClick={onStartMeeting}
            >
              <Users className="size-3.5" />
              Meeting
            </Button>
          </>
        ) : null}

        {hasLead ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            disabled={disabled}
            onClick={onConvertLead}
          >
            <FileText className="size-3.5" />
            Convert
          </Button>
        ) : null}

        {hasDeal ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            disabled={disabled}
            onClick={onOpenDeal}
          >
            <Briefcase className="size-3.5" />
            Deal
          </Button>
        ) : null}
      </div>
    </Can>
  );
}
