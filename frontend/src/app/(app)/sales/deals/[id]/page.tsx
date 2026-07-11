'use client';

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
import { ActivityTimeline } from '@/features/activity';
import { CommentsPanel } from '@/features/comments';
import { FilePanel } from '@/features/files/components/file-panel';
import { DealDetailHeader } from '@/features/sales/components/deal-detail-header';
import { DealDetailOverviewCard } from '@/features/sales/components/deal-detail-overview-card';
import { DealDetailSummaryCard } from '@/features/sales/components/deal-detail-summary-card';
import { DealDetailTabs } from '@/features/sales/components/deal-detail-tabs';
import { DealFormDrawer } from '@/features/sales/components/deal-form-drawer';
import { DealNotFoundState } from '@/features/sales/components/deal-not-found-state';
import { DealFollowUpsTab } from '@/features/sales/follow-ups/components/deal-follow-ups-tab';
import {
  useArchiveDeal,
  useConvertDealToInvoice,
  useConvertDealToProject,
  useRestoreDeal,
} from '@/features/sales/hooks/use-deal-actions';
import { DealProposalTab } from '@/features/sales/proposals/components/deal-proposal-tab';
import { DealQuotesTab } from '@/features/sales/quotes/components/deal-quotes-tab';
import { useDeal } from '@/features/sales/hooks/use-deal';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function DealDetailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const dealId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: deal, isLoading, error, refetch } = useDeal(dealId);
  const { mutateAsync: archiveDeal, isPending: isArchiving } = useArchiveDeal();
  const { mutateAsync: restoreDeal, isPending: isRestoring } = useRestoreDeal();
  const { mutateAsync: convertToProject, isPending: isConvertingProject } =
    useConvertDealToProject();
  const { mutateAsync: convertToInvoice, isPending: isConvertingInvoice } =
    useConvertDealToInvoice();

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading deal..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <DealNotFoundState />;
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

  if (!deal) {
    return <DealNotFoundState />;
  }

  const handleArchive = async (): Promise<void> => {
    try {
      await archiveDeal(dealId);
      showToast('Deal archived', 'success');
      await refetch();
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (): Promise<void> => {
    try {
      await restoreDeal(dealId);
      showToast('Deal restored', 'success');
      await refetch();
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  const handleConvertToProject = async (): Promise<void> => {
    try {
      const updated = await convertToProject(dealId);
      showToast('Deal converted to project', 'success');
      if (updated.convertedProjectId !== null) {
        router.push(`/projects/${updated.convertedProjectId}`);
      } else {
        await refetch();
      }
    } catch (convertError) {
      showToast(extractApiErrorMessage(convertError), 'error');
    }
  };

  const handleConvertToInvoice = async (): Promise<void> => {
    try {
      const invoice = await convertToInvoice({ id: dealId });
      showToast('Invoice created from deal', 'success');
      router.push(`/finance/invoices/${invoice.id}`);
    } catch (convertError) {
      showToast(extractApiErrorMessage(convertError), 'error');
    }
  };

  return (
    <PageContainer size="lg">
      <DealDetailHeader
        deal={deal}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
        onArchive={() => {
          void handleArchive();
        }}
        onRestore={() => {
          void handleRestore();
        }}
        onConvertToProject={() => {
          void handleConvertToProject();
        }}
        onConvertToInvoice={() => {
          void handleConvertToInvoice();
        }}
        isArchivePending={isArchiving}
        isRestorePending={isRestoring}
        isConvertProjectPending={isConvertingProject}
        isConvertInvoicePending={isConvertingInvoice}
      />

      <DealFormDrawer
        open={editDrawerOpen}
        mode="edit"
        dealId={dealId}
        onOpenChange={setEditDrawerOpen}
      />

      <div className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <DealDetailOverviewCard deal={deal} />
          <DealDetailSummaryCard deal={deal} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline entityType="deal" entityId={dealId} />
          </CardContent>
        </Card>

        <DealDetailTabs
          followUps={<DealFollowUpsTab dealId={dealId} ownerUserId={deal.ownerUserId} />}
          comments={<CommentsPanel entityType="deal" entityId={dealId} />}
          proposal={<DealProposalTab dealId={dealId} />}
          quote={<DealQuotesTab dealId={dealId} />}
          documents={<FilePanel entityType="deal" entityId={dealId} />}
        />
      </div>
    </PageContainer>
  );
}
