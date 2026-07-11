'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, LoadingState } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import { useProjectMembers } from '@/features/projects/members/hooks/use-project-members';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ProjectMembersSummaryCardProps {
  readonly projectId: string;
  readonly onViewAll: () => void;
}

export function ProjectMembersSummaryCard({
  projectId,
  onViewAll,
}: ProjectMembersSummaryCardProps) {
  const { data, isLoading, error, refetch } = useProjectMembers(projectId);

  const activeMembers = data?.members.filter((member) => member.status === 'ACTIVE') ?? [];
  const preview = activeMembers.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Members Summary</CardTitle>
        <Caption className="text-muted-foreground">
          {isLoading ? '…' : `${String(activeMembers.length)} active`}
        </Caption>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <LoadingState label="Loading members..." />
        ) : error ? (
          <div className="space-y-3">
            <Body className="text-sm text-danger">{extractApiErrorMessage(error)}</Body>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : activeMembers.length === 0 ? (
          <Body className="text-muted-foreground">No members assigned yet.</Body>
        ) : (
          <ul className="space-y-2">
            {preview.map((member) => (
              <li key={member.id} className="min-w-0">
                <Body className="truncate">{member.userDisplayName}</Body>
                <Caption className="block truncate text-muted-foreground">
                  {member.role}
                  {member.departmentName.length > 0 ? ` · ${member.departmentName}` : ''}
                </Caption>
              </li>
            ))}
          </ul>
        )}

        {activeMembers.length > preview.length ? (
          <Caption className="text-muted-foreground">
            +{String(activeMembers.length - preview.length)} more
          </Caption>
        ) : null}

        <Button type="button" variant="outline" size="sm" onClick={onViewAll}>
          View all members
        </Button>
      </CardContent>
    </Card>
  );
}
