'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, LoadingState } from '@/design-system';
import { Body, CardTitle } from '@/design-system/typography';
import { useClient } from '@/features/clients/hooks/use-client';
import { displayProjectField } from '@/features/projects/utils/project-display';

interface ProjectClientSummaryCardProps {
  readonly clientId: string;
  readonly primaryContactId?: string | null;
}

export function ProjectClientSummaryCard({
  clientId,
  primaryContactId = null,
}: ProjectClientSummaryCardProps) {
  const { data: client, isLoading, error } = useClient(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState label="Loading client..." />
        </CardContent>
      </Card>
    );
  }

  const displayName = client?.displayName ?? displayProjectField(clientId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Client</CardTitle>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href={`/clients/${clientId}`}>
            <ExternalLink className="size-3.5" />
            Open client
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? (
          <Body className="text-muted-foreground">Client details could not be loaded.</Body>
        ) : null}
        <div>
          <p className="text-sm text-muted-foreground">Account</p>
          <p className="font-medium text-foreground">
            <Link href={`/clients/${clientId}`} className="text-primary hover:underline">
              {displayName}
            </Link>
          </p>
        </div>
        {client?.status ? (
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium text-foreground">{client.status}</p>
          </div>
        ) : null}
        {primaryContactId ? (
          <div>
            <p className="text-sm text-muted-foreground">Primary contact</p>
            <p className="font-medium text-foreground">{displayProjectField(primaryContactId)}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
