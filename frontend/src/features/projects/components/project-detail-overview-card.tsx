import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { ProjectRecord } from '@/features/projects/api/project.types';
import {
  displayProjectField,
  formatProjectBillable,
  formatProjectDate,
} from '@/features/projects/utils/project-display';

interface ProjectDetailOverviewCardProps {
  readonly project: ProjectRecord;
}

interface OverviewFieldProps {
  readonly label: string;
  readonly value: string;
}

function OverviewField({ label, value }: OverviewFieldProps) {
  return (
    <div className="space-y-1">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <Body>{value}</Body>
    </div>
  );
}

export function ProjectDetailOverviewCard({ project }: ProjectDetailOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Caption className="mb-1 block uppercase tracking-wide">Description</Caption>
          <Body className="whitespace-pre-wrap text-muted-foreground">
            {displayProjectField(project.description)}
          </Body>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <OverviewField label="Billable" value={formatProjectBillable(project.isBillable)} />
          <OverviewField label="Start Date" value={formatProjectDate(project.startDate)} />
          <OverviewField label="End Date" value={formatProjectDate(project.targetEndDate)} />
          <OverviewField label="Created By" value={displayProjectField(project.createdByUserId)} />
        </div>
      </CardContent>
    </Card>
  );
}
