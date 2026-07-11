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
import { ArchiveLeadDialog } from '@/features/sales/leads/components/archive-lead-dialog';
import { CreateLeadDrawer } from '@/features/sales/leads/components/create-lead-drawer';
import { LeadDetailHeader } from '@/features/sales/leads/components/lead-detail-header';
import { LeadDetailOverviewCard } from '@/features/sales/leads/components/lead-detail-overview-card';
import { LeadDetailQualificationCard } from '@/features/sales/leads/components/lead-detail-qualification-card';
import { LeadDetailTabs } from '@/features/sales/leads/components/lead-detail-tabs';
import { LeadNotFoundState } from '@/features/sales/leads/components/lead-not-found-state';
import { LeadTagsPanel } from '@/features/sales/leads/components/lead-tags-panel';
import { useArchiveLead } from '@/features/sales/leads/hooks/use-archive-lead';
import { useConvertLead } from '@/features/sales/leads/hooks/use-convert-lead';
import { useLead } from '@/features/sales/leads/hooks/use-lead';
import { useRestoreLead } from '@/features/sales/leads/hooks/use-restore-lead';
import { isLeadArchived } from '@/features/sales/leads/utils/list-leads-query';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac';

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

export default function LeadDetailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const leadId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const { data: lead, isLoading, error, refetch } = useLead(leadId);
  const { mutateAsync: archiveLead, isPending: isArchiving } = useArchiveLead();
  const { mutateAsync: restoreLead, isPending: isRestoring } = useRestoreLead();
  const { mutateAsync: convertLead, isPending: isConverting } = useConvertLead();
  const { allowed: canUpdateLead } = usePermission('sales.update');

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading lead..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <LeadNotFoundState />;
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

  if (!lead) {
    return <LeadNotFoundState />;
  }

  const archived = isLeadArchived(lead);

  const handleConfirmArchive = async (): Promise<void> => {
    try {
      await archiveLead(leadId);
      showToast('Lead archived successfully');
      setArchiveDialogOpen(false);
      router.push('/sales/leads');
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (): Promise<void> => {
    try {
      await restoreLead({ id: leadId });
      showToast('Lead restored successfully');
      await refetch();
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  const handleConvert = async (): Promise<void> => {
    try {
      const converted = await convertLead(leadId);
      showToast('Lead converted to client', 'success');
      if (converted.convertedClientId !== null) {
        router.push(`/clients/${converted.convertedClientId}`);
      } else {
        await refetch();
      }
    } catch (convertError) {
      showToast(extractApiErrorMessage(convertError), 'error');
    }
  };

  return (
    <PageContainer size="lg">
      <LeadDetailHeader
        lead={lead}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
        onArchive={() => {
          setArchiveDialogOpen(true);
        }}
        onRestore={() => {
          void handleRestore();
        }}
        onConvert={() => {
          void handleConvert();
        }}
        isRestorePending={isRestoring}
        isConvertPending={isConverting}
      />

      <CreateLeadDrawer
        open={editDrawerOpen}
        mode="edit"
        leadId={leadId}
        onOpenChange={setEditDrawerOpen}
      />

      <ArchiveLeadDialog
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
        <LeadDetailTabs
          overview={
            <div className="space-y-6">
              <LeadDetailOverviewCard lead={lead} />
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <LeadTagsPanel leadId={leadId} readOnly={archived || !canUpdateLead} />
                </CardContent>
              </Card>
            </div>
          }
          qualification={<LeadDetailQualificationCard lead={lead} />}
          notes={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4" aria-hidden="true" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentsPanel entityType="lead" entityId={leadId} />
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
                <ActivityTimeline entityType="lead" entityId={leadId} />
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
                <FilePanel entityType="lead" entityId={leadId} />
              </CardContent>
            </Card>
          }
        />
      </div>
    </PageContainer>
  );
}
