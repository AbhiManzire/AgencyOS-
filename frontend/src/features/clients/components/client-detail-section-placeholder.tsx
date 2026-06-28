import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';

interface ClientDetailSectionPlaceholderProps {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export function ClientDetailSectionPlaceholder({
  title,
  description,
  icon: Icon,
}: ClientDetailSectionPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <Caption className="mb-1 block font-medium text-foreground">{title}</Caption>
          <Body className="max-w-md text-muted-foreground">{description}</Body>
        </div>
      </CardContent>
    </Card>
  );
}
