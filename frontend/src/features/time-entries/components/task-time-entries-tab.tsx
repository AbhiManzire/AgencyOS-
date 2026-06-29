'use client';

import { Clock, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteTimeEntryDialog } from '@/features/time-entries/components/delete-time-entry-dialog';
import {
  TimeEntryDrawer,
  toCreateTimeEntryPayload,
  toUpdateTimeEntryPayload,
} from '@/features/time-entries/components/time-entry-drawer';
import { TimeEntryTable } from '@/features/time-entries/components/time-entry-table';
import { TimeSummaryCards } from '@/features/time-entries/components/time-summary-cards';
import { TimeSummaryPanel } from '@/features/time-entries/components/time-summary-panel';
import { TaskTimerControls } from '@/features/time-entries/components/task-timer-controls';
import { useCreateTimeEntry } from '@/features/time-entries/hooks/use-create-time-entry';
import { useDeleteTimeEntry } from '@/features/time-entries/hooks/use-delete-time-entry';
import { useTaskTimeEntries } from '@/features/time-entries/hooks/use-task-time-entries';
import { useUpdateTimeEntry } from '@/features/time-entries/hooks/use-update-time-entry';
import type { TimeEntryFormValues } from '@/features/time-entries/types';
import { computeTimeEntrySummary } from '@/features/time-entries/utils/time-entry-summary';
import { Can, usePermission } from '@/lib/rbac';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface TaskTimeEntriesTabProps {
  readonly taskId: string;
  readonly projectId: string;
  readonly readOnly?: boolean;
}

export function TaskTimeEntriesTab({
  taskId,
  projectId,
  readOnly = false,
}: TaskTimeEntriesTabProps) {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('time.manage');
  const { data, isLoading, error, refetch } = useTaskTimeEntries(taskId);
  const { mutateAsync: createTimeEntry, isPending: isCreating } = useCreateTimeEntry(taskId);
  const { mutateAsync: updateTimeEntry, isPending: isUpdating } = useUpdateTimeEntry(taskId);
  const { mutateAsync: deleteTimeEntry, isPending: isDeleting } = useDeleteTimeEntry(taskId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const entries = data ?? [];

  const summary = useMemo(() => computeTimeEntrySummary(entries), [entries]);

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeEntryId),
    [activeEntryId, entries],
  );

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveEntryId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (entryId: string): void => {
    setDrawerMode('edit');
    setActiveEntryId(entryId);
    setDrawerOpen(true);
  };

  const handleSave = async (
    values: TimeEntryFormValues,
    mode: 'create' | 'edit',
  ): Promise<void> => {
    if (mode === 'edit' && activeEntryId !== null) {
      await updateTimeEntry({
        timeEntryId: activeEntryId,
        payload: toUpdateTimeEntryPayload(values),
      });
      return;
    }

    await createTimeEntry(toCreateTimeEntryPayload(values));
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteEntryId === null) {
      return;
    }

    try {
      await deleteTimeEntry(deleteEntryId);
      showToast('Time entry deleted successfully');
      setDeleteEntryId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading time entries..." />;
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
          <h2 className="text-lg font-semibold">Time Entries</h2>
          <p className="text-sm text-muted-foreground">Logged work time for this task.</p>
        </div>
        {!readOnly ? (
          <Can permission="time.manage">
            <Button type="button" className="gap-2" onClick={openCreateDrawer}>
              <Plus className="size-4" />
              Add Entry
            </Button>
          </Can>
        ) : null}
      </div>

      {!readOnly ? <TaskTimerControls taskId={taskId} /> : null}

      <TimeSummaryCards summary={summary} />
      <TimeSummaryPanel summary={summary} />

      {entries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No time entries yet"
          description="Log the first time entry for this task."
          action={
            readOnly ? undefined : (
              <Can permission="time.manage">
                <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                  <Plus className="size-4" />
                  Add Entry
                </Button>
              </Can>
            )
          }
        />
      ) : (
        <TimeEntryTable
          entries={entries}
          readOnly={readOnly || !canManage}
          onEditEntry={openEditDrawer}
          onDeleteEntry={setDeleteEntryId}
        />
      )}

      <TimeEntryDrawer
        open={drawerOpen}
        mode={drawerMode}
        projectId={projectId}
        entry={activeEntry}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteTimeEntryDialog
        open={deleteEntryId !== null}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteEntryId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
