'use client';

import { Milestone, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteMilestoneDialog } from '@/features/projects/milestones/components/delete-milestone-dialog';
import {
  MilestoneFormDrawer,
  toCreateMilestonePayload,
  toUpdateMilestonePayload,
} from '@/features/projects/milestones/components/milestone-form-drawer';
import { ProjectMilestonesTable } from '@/features/projects/milestones/components/project-milestones-table';
import { useCreateProjectMilestone } from '@/features/projects/milestones/hooks/use-create-project-milestone';
import { useDeleteProjectMilestone } from '@/features/projects/milestones/hooks/use-delete-project-milestone';
import { useProjectMilestones } from '@/features/projects/milestones/hooks/use-project-milestones';
import { useUpdateProjectMilestone } from '@/features/projects/milestones/hooks/use-update-project-milestone';
import type { MilestoneFormValues } from '@/features/projects/milestones/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ProjectMilestonesTabProps {
  readonly projectId: string;
  readonly readOnly?: boolean;
}

export function ProjectMilestonesTab({ projectId, readOnly = false }: ProjectMilestonesTabProps) {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useProjectMilestones(projectId);
  const { mutateAsync: createMilestone, isPending: isCreating } =
    useCreateProjectMilestone(projectId);
  const { mutateAsync: updateMilestone, isPending: isUpdating } =
    useUpdateProjectMilestone(projectId);
  const { mutateAsync: deleteMilestone, isPending: isDeleting } =
    useDeleteProjectMilestone(projectId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null);

  const milestones = data?.milestones ?? [];
  const availableOwners = data?.availableOwners ?? [];

  const activeMilestone = useMemo(
    () => milestones.find((milestone) => milestone.id === activeMilestoneId),
    [activeMilestoneId, milestones],
  );

  const deleteMilestoneName = useMemo(() => {
    const milestone = milestones.find((item) => item.id === deleteMilestoneId);
    return milestone?.name ?? 'this milestone';
  }, [deleteMilestoneId, milestones]);

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveMilestoneId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (milestoneId: string): void => {
    setDrawerMode('edit');
    setActiveMilestoneId(milestoneId);
    setDrawerOpen(true);
  };

  const handleSave = async (
    values: MilestoneFormValues,
    mode: 'create' | 'edit',
  ): Promise<void> => {
    if (mode === 'edit' && activeMilestoneId !== null) {
      await updateMilestone({
        milestoneId: activeMilestoneId,
        payload: toUpdateMilestonePayload(values),
      });
      return;
    }

    await createMilestone(toCreateMilestonePayload(values));
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteMilestoneId === null) {
      return;
    }

    try {
      await deleteMilestone(deleteMilestoneId);
      showToast('Milestone deleted successfully');
      setDeleteMilestoneId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading milestones..." />;
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
          <h2 className="text-lg font-semibold">Milestones</h2>
          <p className="text-sm text-muted-foreground">Delivery checkpoints for this project.</p>
        </div>
        {!readOnly ? (
          <Button type="button" className="gap-2" onClick={openCreateDrawer}>
            <Plus className="size-4" />
            Add Milestone
          </Button>
        ) : null}
      </div>

      {milestones.length === 0 ? (
        <EmptyState
          icon={Milestone}
          title="No milestones yet"
          description="Add the first milestone to track delivery progress."
          action={
            readOnly ? undefined : (
              <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                <Plus className="size-4" />
                Add Milestone
              </Button>
            )
          }
        />
      ) : (
        <ProjectMilestonesTable
          milestones={milestones}
          readOnly={readOnly}
          onEditMilestone={openEditDrawer}
          onDeleteMilestone={setDeleteMilestoneId}
        />
      )}

      <MilestoneFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        milestone={activeMilestone}
        availableOwners={availableOwners}
        availableMilestones={milestones}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteMilestoneDialog
        open={deleteMilestoneId !== null}
        milestoneName={deleteMilestoneName}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteMilestoneId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
