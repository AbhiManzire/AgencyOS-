'use client';

import { Activity, FileText, FolderOpen } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  LoadingState,
  PageContainer,
  useToast,
} from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { ArchiveClientDialog } from '@/features/clients/components/archive-client-dialog';
import { ClientDetailAddressCard } from '@/features/clients/components/client-detail-address-card';
import { ClientDetailHeader } from '@/features/clients/components/client-detail-header';
import { ClientDetailSummaryCard } from '@/features/clients/components/client-detail-summary-card';
import { ClientNotFoundState } from '@/features/clients/components/client-not-found-state';
import { ClientTagsPanel } from '@/features/clients/components/client-tags-panel';
import { CreateClientDrawer } from '@/features/clients/components/create-client-drawer';
import { ClientDetailTabs } from '@/features/clients/contacts/components/client-detail-tabs';
import { useArchiveClient } from '@/features/clients/hooks/use-archive-client';
import { useClient } from '@/features/clients/hooks/use-client';
import { useRestoreClient } from '@/features/clients/hooks/use-restore-client';
import { isClientArchived } from '@/features/clients/utils/list-clients-query';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac';

const ClientContactsTab = dynamic(
  () =>
    import('@/features/clients/contacts/components/client-contacts-tab').then((mod) => ({
      default: mod.ClientContactsTab,
    })),
  { loading: () => <LoadingState label="Loading contacts..." /> },
);

const CommentsPanel = dynamic(
  () =>
    import('@/features/comments/components/comments-panel').then((mod) => ({
      default: mod.CommentsPanel,
    })),
  { loading: () => <LoadingState label="Loading notes..." /> },
);

const ActivityTimeline = dynamic(
  () =>
    import('@/features/activity/components/activity-timeline').then((mod) => ({
      default: mod.ActivityTimeline,
    })),
  { loading: () => <LoadingState label="Loading activity..." /> },
);

const FilePanel = dynamic(
  () =>
    import('@/features/files/components/file-panel').then((mod) => ({
      default: mod.FilePanel,
    })),
  { loading: () => <LoadingState label="Loading documents..." /> },
);

export default function ClientDetailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const {
    data: client,
    isLoading,
    error,
    refetch,
  } = useClient(clientId, {
    includeArchived: true,
  });
  const { mutateAsync: archiveClient, isPending: isArchiving } = useArchiveClient();
  const { mutateAsync: restoreClient, isPending: isRestoring } = useRestoreClient();
  const { allowed: canManageContacts } = usePermission('clients.contacts.manage');
  const { allowed: canUpdateClient } = usePermission('clients.update');

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
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <ClientDetailSummaryCard client={client} />
                <ClientDetailAddressCard client={client} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientTagsPanel clientId={clientId} readOnly={archived || !canUpdateClient} />
                </CardContent>
              </Card>
            </div>
          }
          contacts={
            <ClientContactsTab clientId={clientId} readOnly={archived || !canManageContacts} />
          }
          notes={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4" aria-hidden="true" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentsPanel entityType="client" entityId={clientId} />
              </CardContent>
            </Card>
          }
          activity={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4" aria-hidden="true" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline
                  entityType="client"
                  entityId={clientId}
                  emptyDescription="Client activity will appear here as records change."
                />
              </CardContent>
            </Card>
          }
          documents={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="size-4" aria-hidden="true" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilePanel entityType="client" entityId={clientId} />
              </CardContent>
            </Card>
          }
        />
      </div>
    </PageContainer>
  );
}
