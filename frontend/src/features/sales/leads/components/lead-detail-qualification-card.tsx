import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { LeadRecord } from '@/features/sales/leads/api/lead.types';

interface LeadDetailQualificationCardProps {
  readonly lead: LeadRecord;
}

interface FieldProps {
  readonly label: string;
  readonly value: string | null;
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="space-y-1">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <Body className="whitespace-pre-wrap text-muted-foreground">
        {value !== null && value.trim().length > 0 ? value : '—'}
      </Body>
    </div>
  );
}

export function LeadDetailQualificationCard({ lead }: LeadDetailQualificationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Need" value={lead.need} />
          <Field label="Authority" value={lead.authority} />
          <Field label="Budget notes" value={lead.budgetNotes} />
          <Field label="Timeline" value={lead.timeline} />
          <Field label="Pain points" value={lead.painPoints} />
          <Field label="Decision maker" value={lead.decisionMaker} />
          <Field label="Competitor" value={lead.competitor} />
        </div>
        <Field label="Qualification notes" value={lead.qualificationNotes} />
        <Field label="Notes" value={lead.notes} />
      </CardContent>
    </Card>
  );
}
