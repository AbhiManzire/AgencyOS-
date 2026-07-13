'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  DataCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { useProjectDeliveryDashboard } from '@/features/projects/delivery/hooks/use-delivery-dashboard';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { formatShortDate } from '@/lib/format/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ProjectDeliveryDashboard() {
  const { data, isLoading, error, refetch } = useProjectDeliveryDashboard();

  if (isLoading) {
    return <LoadingState label="Loading delivery dashboard..." />;
  }

  if (error || data === undefined) {
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

  const { healthDistribution, upcomingMilestones } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DataCard label="Active projects" value={String(data.activeProjects)} />
        <DataCard label="Completed" value={String(data.completedProjects)} />
        <DataCard label="Overdue" value={String(data.overdueProjects)} />
        <DataCard label="Team utilization" value={`${String(Math.round(data.teamUtilization))}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Green</p>
                <p className="text-lg font-semibold">{healthDistribution.green}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Yellow</p>
                <p className="text-lg font-semibold">{healthDistribution.yellow}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Red</p>
                <p className="text-lg font-semibold">{healthDistribution.red}</p>
              </div>
              <div className="rounded-md border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Unknown</p>
                <p className="text-lg font-semibold">{healthDistribution.unknown}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming milestones</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <EmptyState
                title="No upcoming milestones"
                description="Milestones with upcoming due dates will appear here."
              />
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>% Done</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingMilestones.map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell className="font-medium">{milestone.name}</TableCell>
                        <TableCell>
                          <Link
                            href={`/projects/${milestone.projectId}`}
                            className="text-primary hover:underline"
                          >
                            {milestone.projectName}
                          </Link>
                        </TableCell>
                        <TableCell>{formatShortDate(milestone.dueDate)}</TableCell>
                        <TableCell>{milestone.completionPercent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
