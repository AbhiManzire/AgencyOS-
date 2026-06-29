'use client';

import { Activity, FileText, FolderOpen } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer, useToast } from '@/design-system';
import { ArchiveClientDialog } from '@/features/clients/components/archive-client-dialog';
import { ClientDetailAddressCard } from '@/features/clients/components/client-detail-address-card';
import { ClientDetailHeader } from '@/features/clients/components/client-detail-header';
import { ClientDetailSectionPlaceholder } from '@/features/clients/components/client-detail-section-placeholder';
import { ClientDetailSummaryCard } from '@/features/clients/components/client-detail-summary-card';
import { ClientNotFoundState } from '@/features/clients/components/client-not-found-state';
import { CreateClientDrawer } from '@/features/clients/components/create-client-drawer';
import { ClientContactsTab, ClientDetailTabs } from '@/features/clients/contacts/components';
import { useArchiveClient } from '@/features/clients/hooks/use-archive-client';
import { useClient } from '@/features/clients/hooks/use-client';
import { useRestoreClient } from '@/features/clients/hooks/use-restore-client';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac';
import { isClientArchived } from '@/features/clients/utils/list-clients-query';

export default function ClientDetailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const { data: client, isLoading, error, refetch } = useClient(clientId);
  const { mutateAsync: archiveClient, isPending: isArchiving } = useArchiveClient();
  const { mutateAsync: restoreClient, isPending: isRestoring } = useRestoreClient();
  const { allowed: canManageContacts } = usePermission('clients.contacts.manage');

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

  const archived = isClientArchived(client);

  const handleConfirmArchive = async (): Promise<void> => {
    try {
      await archiveClient(clientId);
      showToast('Client archived successfully');
      setArchiveDialogOpen(false);
      router.push('/clients');
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (): Promise<void> => {
    try {
      await restoreClient({ id: clientId });
      showToast('Client restored successfully');
      await refetch();
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  return (
    <PageContainer size="lg">
      <ClientDetailHeader
        client={client}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
        onArchive={() => {
          setArchiveDialogOpen(true);
        }}
        onRestore={() => {
          void handleRestore();
        }}
        isRestorePending={isRestoring}
      />

      <CreateClientDrawer
        open={editDrawerOpen}
        mode="edit"
        clientId={clientId}
        onOpenChange={setEditDrawerOpen}
      />

      <ArchiveClientDialog
        open={archiveDialogOpen}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveDialogOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />

      <div className={archived ? 'text-muted-foreground' : undefined}>
        <ClientDetailTabs
          overview={
            <>
              <div className="grid gap-6 lg:grid-cols-2">
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
            </>
          }
          contacts={
            <ClientContactsTab clientId={clientId} readOnly={archived || !canManageContacts} />
          }
        />
      </div>
    </PageContainer>
  );
}
