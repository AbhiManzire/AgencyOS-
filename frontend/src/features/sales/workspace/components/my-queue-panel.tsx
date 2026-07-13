'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/design-system';
import { EmptyState, ErrorState, LoadingState, StatusBadge, useToast } from '@/design-system';
import { Caption, SectionTitle } from '@/design-system/typography';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import type { WorkspaceQueueItem } from '@/features/sales/workspace/api/workspace.types';
import { QuickActionBar } from '@/features/sales/workspace/components/quick-action-bar';
import {
  QueueNoteDialog,
  ReassignTaskDialog,
  RescheduleTaskDialog,
} from '@/features/sales/workspace/components/queue-action-dialogs';
import { useQuickAction } from '@/features/sales/workspace/hooks/use-quick-action';
import {
  QUEUE_KIND_LABELS,
  QUEUE_PRIORITY_LABELS,
  QUEUE_PRIORITY_VARIANTS,
  formatWorkspaceDateTime,
  getQueueKindIcon,
} from '@/features/sales/workspace/utils/workspace-labels';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

type DialogMode = 'reschedule' | 'reassign' | 'note' | 'call' | null;

interface MyQueuePanelProps {
  readonly items: readonly WorkspaceQueueItem[] | undefined;
  readonly total: number;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
}

/** Priority-sorted My Queue list with inline quick actions. */
export function MyQueuePanel({
  items,
  total,
  isLoading,
  isError,
  error,
  onRetry,
}: MyQueuePanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { mutateAsync: runQuickAction, isPending } = useQuickAction();
  const { data: workspaceOwners = [] } = useWorkspaceOwners();

  const [activeItem, setActiveItem] = useState<WorkspaceQueueItem | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const ownerOptions = useMemo(
    () =>
      workspaceOwners.map((owner) => ({
        id: owner.id,
        label: owner.displayName,
      })),
    [workspaceOwners],
  );

  const closeDialog = (): void => {
    setDialogMode(null);
    setActiveItem(null);
  };

  const withPending = async (
    item: WorkspaceQueueItem,
    action: () => Promise<void>,
  ): Promise<void> => {
    setPendingItemId(item.id);
    try {
      await action();
    } finally {
      setPendingItemId(null);
    }
  };

  const handleComplete = async (item: WorkspaceQueueItem): Promise<void> => {
    if (item.sourceType !== 'sales_task') {
      return;
    }

    await withPending(item, async () => {
      try {
        await runQuickAction({
          action: 'complete_task',
          taskId: item.sourceId,
        });
        showToast('Task completed');
      } catch (actionError) {
        showToast(extractApiErrorMessage(actionError), 'error');
      }
    });
  };

  const handleReschedule = async (values: {
    dueDate: string;
    dueTime: string | null;
  }): Promise<void> => {
    if (activeItem?.sourceType !== 'sales_task') {
      return;
    }

    const item = activeItem;
    await withPending(item, async () => {
      try {
        await runQuickAction({
          action: 'reschedule_task',
          taskId: item.sourceId,
          dueDate: values.dueDate,
          dueTime: values.dueTime,
        });
        showToast('Task rescheduled');
        closeDialog();
      } catch (actionError) {
        showToast(extractApiErrorMessage(actionError), 'error');
      }
    });
  };

  const handleReassign = async (ownerUserId: string): Promise<void> => {
    if (activeItem?.sourceType !== 'sales_task') {
      return;
    }

    const item = activeItem;
    await withPending(item, async () => {
      try {
        await runQuickAction({
          action: 'reassign_task',
          taskId: item.sourceId,
          ownerUserId,
        });
        showToast('Task reassigned');
        closeDialog();
      } catch (actionError) {
        showToast(extractApiErrorMessage(actionError), 'error');
      }
    });
  };

  const handleNoteAction = async (note: string): Promise<void> => {
    if (activeItem === null || dialogMode === null) {
      return;
    }

    const item = activeItem;
    const action = dialogMode === 'call' ? 'log_call' : 'add_note';

    await withPending(item, async () => {
      try {
        await runQuickAction({
          action,
          leadId: item.leadId ?? undefined,
          dealId: item.dealId ?? undefined,
          clientId: item.clientId ?? undefined,
          note: note.length > 0 ? note : undefined,
        });
        showToast(action === 'log_call' ? 'Call logged' : 'Note added');
        closeDialog();
      } catch (actionError) {
        showToast(extractApiErrorMessage(actionError), 'error');
      }
    });
  };

  const handleStartMeeting = async (item: WorkspaceQueueItem): Promise<void> => {
    await withPending(item, async () => {
      try {
        await runQuickAction({
          action: 'start_meeting',
          leadId: item.leadId ?? undefined,
          dealId: item.dealId ?? undefined,
          clientId: item.clientId ?? undefined,
          title: item.title,
        });
        showToast('Meeting started');
      } catch (actionError) {
        showToast(extractApiErrorMessage(actionError), 'error');
      }
    });
  };

  const handleConvertLead = async (item: WorkspaceQueueItem): Promise<void> => {
    if (item.leadId === null || item.leadId === undefined) {
      return;
    }

    await withPending(item, async () => {
      try {
        const result = await runQuickAction({
          action: 'convert_lead',
          leadId: item.leadId ?? undefined,
        });
        showToast('Lead converted');

        const payload = result.result as { convertedClientId?: string | null } | null;
        if (
          payload !== null &&
          typeof payload === 'object' &&
          typeof payload.convertedClientId === 'string' &&
          payload.convertedClientId.length > 0
        ) {
          router.push(`/clients/${payload.convertedClientId}`);
        }
      } catch (actionError) {
        showToast(extractApiErrorMessage(actionError), 'error');
      }
    });
  };

  const handleOpenDeal = (item: WorkspaceQueueItem): void => {
    if (item.dealId === null || item.dealId === undefined) {
      return;
    }
    router.push(`/sales/deals/${item.dealId}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <SectionTitle className="text-base">My Queue</SectionTitle>
          <Caption>{total === 1 ? '1 priority item' : `${String(total)} priority items`}</Caption>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            message={extractApiErrorMessage(error)}
            action={
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading queue..." />
        ) : items === undefined || items.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="No overdue or upcoming sales actions right now."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const Icon = getQueueKindIcon(item.kind);
              const rowBusy = isPending && pendingItemId === item.id;

              return (
                <li key={item.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md border border-border bg-muted/40 p-1.5">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        <StatusBadge variant={QUEUE_PRIORITY_VARIANTS[item.priority]}>
                          {QUEUE_PRIORITY_LABELS[item.priority]}
                        </StatusBadge>
                        <Caption>{QUEUE_KIND_LABELS[item.kind]}</Caption>
                      </div>
                      <Caption>Due {formatWorkspaceDateTime(item.dueAt)}</Caption>
                      <QuickActionBar
                        item={item}
                        disabled={rowBusy}
                        onComplete={() => {
                          void handleComplete(item);
                        }}
                        onReschedule={() => {
                          setActiveItem(item);
                          setDialogMode('reschedule');
                        }}
                        onReassign={() => {
                          setActiveItem(item);
                          setDialogMode('reassign');
                        }}
                        onAddNote={() => {
                          setActiveItem(item);
                          setDialogMode('note');
                        }}
                        onLogCall={() => {
                          setActiveItem(item);
                          setDialogMode('call');
                        }}
                        onStartMeeting={() => {
                          void handleStartMeeting(item);
                        }}
                        onConvertLead={() => {
                          void handleConvertLead(item);
                        }}
                        onOpenDeal={() => {
                          handleOpenDeal(item);
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <RescheduleTaskDialog
        key={activeItem ? `reschedule-${activeItem.id}` : 'reschedule-closed'}
        open={dialogMode === 'reschedule' && activeItem !== null}
        isPending={isPending}
        onCancel={closeDialog}
        onConfirm={(values) => {
          void handleReschedule(values);
        }}
      />
      <ReassignTaskDialog
        key={activeItem ? `reassign-${activeItem.id}` : 'reassign-closed'}
        open={dialogMode === 'reassign' && activeItem !== null}
        isPending={isPending}
        owners={ownerOptions}
        onCancel={closeDialog}
        onConfirm={(ownerUserId) => {
          void handleReassign(ownerUserId);
        }}
      />
      <QueueNoteDialog
        key={activeItem ? `note-${String(dialogMode)}-${activeItem.id}` : 'note-closed'}
        open={(dialogMode === 'note' || dialogMode === 'call') && activeItem !== null}
        title={dialogMode === 'call' ? 'Log call' : 'Add note'}
        confirmLabel={dialogMode === 'call' ? 'Log call' : 'Save note'}
        isPending={isPending}
        onCancel={closeDialog}
        onConfirm={(note) => {
          void handleNoteAction(note);
        }}
      />
    </Card>
  );
}
