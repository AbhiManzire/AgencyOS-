'use client';

import { CalendarClock, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteFollowUpDialog } from '@/features/sales/follow-ups/components/delete-follow-up-dialog';
import { FollowUpFormDrawer } from '@/features/sales/follow-ups/components/follow-up-form-drawer';
import { FollowUpsTable } from '@/features/sales/follow-ups/components/follow-ups-table';
import {
  toCreateFollowUpPayload,
  toUpdateFollowUpPayload,
} from '@/features/sales/follow-ups/forms/follow-up-form.validation';
import { useCreateDealFollowUp } from '@/features/sales/follow-ups/hooks/use-create-deal-follow-up';
import { useDealFollowUps } from '@/features/sales/follow-ups/hooks/use-deal-follow-ups';
import { useDeleteDealFollowUp } from '@/features/sales/follow-ups/hooks/use-delete-deal-follow-up';
import { useUpdateDealFollowUp } from '@/features/sales/follow-ups/hooks/use-update-deal-follow-up';
import type { FollowUpFormValues } from '@/features/sales/follow-ups/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';

interface DealFollowUpsTabProps {
  readonly dealId: string;
  readonly ownerUserId: string | null;
}

export function DealFollowUpsTab({ dealId, ownerUserId }: DealFollowUpsTabProps) {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('sales.update');
  const { data: followUps = [], isLoading, error, refetch } = useDealFollowUps(dealId);
  const { mutateAsync: createFollowUp, isPending: isCreating } = useCreateDealFollowUp(dealId);
  const { mutateAsync: updateFollowUp, isPending: isUpdating } = useUpdateDealFollowUp(dealId);
  const { mutateAsync: deleteFollowUp, isPending: isDeleting } = useDeleteDealFollowUp(dealId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeFollowUpId, setActiveFollowUpId] = useState<string | null>(null);
  const [deleteFollowUpId, setDeleteFollowUpId] = useState<string | null>(null);

  const activeFollowUp = useMemo(
    () => followUps.find((item) => item.id === activeFollowUpId),
    [activeFollowUpId, followUps],
  );

  const deleteSubject = useMemo(() => {
    const followUp = followUps.find((item) => item.id === deleteFollowUpId);
    return followUp?.subject ?? 'this follow-up';
  }, [deleteFollowUpId, followUps]);

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveFollowUpId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (followUpId: string): void => {
    setDrawerMode('edit');
    setActiveFollowUpId(followUpId);
    setDrawerOpen(true);
  };

  const handleSave = async (values: FollowUpFormValues): Promise<void> => {
    if (drawerMode === 'edit' && activeFollowUpId !== null) {
      await updateFollowUp({
        followUpId: activeFollowUpId,
        payload: toUpdateFollowUpPayload(values),
      });
      return;
    }

    await createFollowUp(toCreateFollowUpPayload(values, ownerUserId));
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteFollowUpId === null) {
      return;
    }

    try {
      await deleteFollowUp(deleteFollowUpId);
      showToast('Follow-up deleted', 'success');
      setDeleteFollowUpId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading follow-ups..." />;
  }

  if (error) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Follow-ups</h2>
          <p className="text-sm text-muted-foreground">
            Scheduled calls, meetings, and outreach for this deal.
          </p>
        </div>
        {canManage ? (
          <Button type="button" className="gap-2" onClick={openCreateDrawer}>
            <Plus className="size-4" />
            Add Follow-up
          </Button>
        ) : null}
      </div>

      {followUps.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No follow-ups scheduled"
          description="Plan your next call, meeting, or outreach for this deal."
          action={
            canManage ? (
              <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                <Plus className="size-4" />
                Add Follow-up
              </Button>
            ) : undefined
          }
        />
      ) : (
        <FollowUpsTable
          followUps={followUps}
          readOnly={!canManage}
          onEditFollowUp={openEditDrawer}
          onDeleteFollowUp={setDeleteFollowUpId}
        />
      )}

      <FollowUpFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        followUp={activeFollowUp}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteFollowUpDialog
        open={deleteFollowUpId !== null}
        subject={deleteSubject}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteFollowUpId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
