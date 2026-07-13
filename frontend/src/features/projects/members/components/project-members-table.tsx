import { Avatar } from '@/design-system';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MemberRoleBadge } from '@/features/projects/members/components/member-role-badge';
import { MemberRowActions } from '@/features/projects/members/components/member-row-actions';
import { MemberStatusBadge } from '@/features/projects/members/components/member-status-badge';
import { formatMemberName } from '@/features/projects/members/forms/member-form.validation';
import type { ProjectMemberListItem } from '@/features/projects/members/types';
import { formatProjectDate } from '@/features/projects/utils/project-display';

interface ProjectMembersTableProps {
  readonly members: readonly ProjectMemberListItem[];
  readonly readOnly?: boolean;
  readonly projectOwnerUserId?: string | null;
  readonly onEditMember: (memberId: string) => void;
  readonly onDeleteMember: (memberId: string) => void;
}

export function ProjectMembersTable({
  members,
  readOnly = false,
  projectOwnerUserId = null,
  onEditMember,
  onDeleteMember,
}: ProjectMembersTableProps) {
  const managerCount = members.filter((member) => member.role === 'MANAGER').length;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Assigned On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const name = formatMemberName(member);
              const initials = name.slice(0, 2).toUpperCase();
              const isOwner = projectOwnerUserId !== null && member.userId === projectOwnerUserId;
              const isLastManager = member.role === 'MANAGER' && managerCount <= 1;
              const canRemove = !isOwner && !isLastManager;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="sm" initials={initials} aria-label={name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.userEmail}</p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {member.departmentName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MemberRoleBadge role={member.role} customRoleLabel={member.customRoleLabel} />
                  </TableCell>
                  <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                    {member.departmentName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatProjectDate(member.assignedOn)}
                  </TableCell>
                  <TableCell>
                    <MemberStatusBadge status={member.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MemberRowActions
                      memberName={name}
                      disabled={readOnly}
                      canRemove={canRemove}
                      onEdit={() => {
                        onEditMember(member.id);
                      }}
                      onDelete={() => {
                        onDeleteMember(member.id);
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
