'use client';

import { Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteMemberDialog } from '@/features/projects/members/components/delete-member-dialog';
import {
  MemberFormDrawer,
  toCreateMemberPayload,
  toUpdateMemberPayload,
} from '@/features/projects/members/components/member-form-drawer';
import { ProjectMembersTable } from '@/features/projects/members/components/project-members-table';
import { formatMemberName } from '@/features/projects/members/forms/member-form.validation';
import { useCreateProjectMember } from '@/features/projects/members/hooks/use-create-project-member';
import { useDeleteProjectMember } from '@/features/projects/members/hooks/use-delete-project-member';
import { useProjectMembers } from '@/features/projects/members/hooks/use-project-members';
import { useUpdateProjectMember } from '@/features/projects/members/hooks/use-update-project-member';
import type { MemberFormValues } from '@/features/projects/members/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ProjectMembersTabProps {
  readonly projectId: string;
  readonly projectOwnerUserId?: string | null;
  readonly readOnly?: boolean;
}

export function ProjectMembersTab({
  projectId,
  projectOwnerUserId = null,
  readOnly = false,
}: ProjectMembersTabProps) {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useProjectMembers(projectId);
  const { mutateAsync: createMember, isPending: isCreating } = useCreateProjectMember(projectId);
  const { mutateAsync: updateMember, isPending: isUpdating } = useUpdateProjectMember(projectId);
  const { mutateAsync: deleteMember, isPending: isDeleting } = useDeleteProjectMember(projectId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

  const members = data?.members ?? [];
  const availableUsers = data?.availableUsers ?? [];

  const activeMember = useMemo(
    () => members.find((member) => member.id === activeMemberId),
    [activeMemberId, members],
  );

  const deleteMemberName = useMemo(() => {
    const member = members.find((item) => item.id === deleteMemberId);
    return member ? formatMemberName(member) : 'this member';
  }, [deleteMemberId, members]);

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveMemberId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (memberId: string): void => {
    setDrawerMode('edit');
    setActiveMemberId(memberId);
    setDrawerOpen(true);
  };

  const handleSave = async (values: MemberFormValues, mode: 'create' | 'edit'): Promise<void> => {
    if (mode === 'edit' && activeMemberId !== null) {
      await updateMember({ memberId: activeMemberId, payload: toUpdateMemberPayload(values) });
      return;
    }

    await createMember(toCreateMemberPayload(values));
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteMemberId === null) {
      return;
    }

    try {
      await deleteMember(deleteMemberId);
      showToast('Member removed successfully');
      setDeleteMemberId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading members..." />;
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
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">Team assigned to this project.</p>
        </div>
        {!readOnly ? (
          <Button type="button" className="gap-2" onClick={openCreateDrawer}>
            <Plus className="size-4" />
            Add Member
          </Button>
        ) : null}
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add the first team member to this project."
          action={
            readOnly ? undefined : (
              <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                <Plus className="size-4" />
                Add Member
              </Button>
            )
          }
        />
      ) : (
        <ProjectMembersTable
          members={members}
          readOnly={readOnly}
          projectOwnerUserId={projectOwnerUserId}
          onEditMember={openEditDrawer}
          onDeleteMember={setDeleteMemberId}
        />
      )}

      <MemberFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        member={activeMember}
        availableUsers={availableUsers}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteMemberDialog
        open={deleteMemberId !== null}
        memberName={deleteMemberName}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteMemberId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
