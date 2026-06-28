'use client';

import { Activity, FileText, FolderOpen } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer } from '@/design-system';
import { ClientDetailAddressCard } from '@/features/clients/components/client-detail-address-card';
import { ClientDetailHeader } from '@/features/clients/components/client-detail-header';
import { ClientDetailSectionPlaceholder } from '@/features/clients/components/client-detail-section-placeholder';
import { ClientDetailSummaryCard } from '@/features/clients/components/client-detail-summary-card';
import { ClientNotFoundState } from '@/features/clients/components/client-not-found-state';
import { CreateClientDrawer } from '@/features/clients/components/create-client-drawer';
import { useClient } from '@/features/clients/hooks/use-client';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: client, isLoading, error, refetch } = useClient(clientId);

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading client..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <ClientNotFoundState />;
    }

    return (
      <PageContainer size="lg">
        <ErrorState
          message={extractApiErrorMessage(error)}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!client) {
    return <ClientNotFoundState />;
  }

  return (
    <PageContainer size="lg">
      <ClientDetailHeader
        client={client}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
      />

      <CreateClientDrawer
        open={editDrawerOpen}
        mode="edit"
        clientId={clientId}
        onOpenChange={setEditDrawerOpen}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ClientDetailSummaryCard client={client} />
        <ClientDetailAddressCard client={client} />
      </div>

      <div className="mt-6 space-y-6">
        <ClientDetailSectionPlaceholder
          title="Notes"
          description="Internal notes for this client will appear here."
          icon={FileText}
        />
        <ClientDetailSectionPlaceholder
          title="Activity"
          description="Client activity timeline will appear here."
          icon={Activity}
        />
        <ClientDetailSectionPlaceholder
          title="Documents"
          description="Uploaded documents will appear here."
          icon={FolderOpen}
        />
      </div>
    </PageContainer>
  );
}
