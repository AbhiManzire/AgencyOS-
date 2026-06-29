import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import {
  displayTaskField,
  formatTaskDate,
  formatTaskEstimatedHours,
} from '@/features/tasks/utils/task-display';

interface TaskDetailOverviewCardProps {
  readonly description: string | null;
  readonly projectId: string;
  readonly projectName: string;
  readonly milestoneName: string;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly estimatedHours: number | null;
  readonly createdByUserId: string | null;
}

interface OverviewFieldProps {
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

function OverviewField({ label, value, href }: OverviewFieldProps) {
  return (
    <div className="space-y-1">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      {href !== undefined ? (
        <Body>
          <Link href={href} className="text-primary underline-offset-4 hover:underline">
            {value}
          </Link>
        </Body>
      ) : (
        <Body>{value}</Body>
      )}
    </div>
  );
}

export function TaskDetailOverviewCard({
  description,
  projectId,
  projectName,
  milestoneName,
  startDate,
  dueDate,
  estimatedHours,
  createdByUserId,
}: TaskDetailOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Caption className="mb-1 block uppercase tracking-wide">Description</Caption>
          <Body className="whitespace-pre-wrap text-muted-foreground">
            {displayTaskField(description)}
          </Body>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <OverviewField label="Project" value={projectName} href={`/projects/${projectId}`} />
          <OverviewField label="Milestone" value={milestoneName} />
          <OverviewField label="Start Date" value={formatTaskDate(startDate)} />
          <OverviewField label="Due Date" value={formatTaskDate(dueDate)} />
          <OverviewField label="Estimated Hours" value={formatTaskEstimatedHours(estimatedHours)} />
          <OverviewField label="Created By" value={displayTaskField(createdByUserId)} />
        </div>
      </CardContent>
    </Card>
  );
}
