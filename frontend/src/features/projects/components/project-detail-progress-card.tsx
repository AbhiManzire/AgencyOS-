import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';

interface ProgressMetricProps {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

function ProgressMetric({ label, value, hint }: ProgressMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      <Body className="mt-1 text-muted-foreground">{hint}</Body>
    </div>
  );
}

export function ProjectDetailProgressCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <ProgressMetric label="Milestones" value="—" hint="Milestone tracking coming soon" />
          <ProgressMetric label="Tasks" value="—" hint="Task tracking coming soon" />
          <ProgressMetric label="Completion" value="—" hint="Completion metrics coming soon" />
        </div>
      </CardContent>
    </Card>
  );
}
