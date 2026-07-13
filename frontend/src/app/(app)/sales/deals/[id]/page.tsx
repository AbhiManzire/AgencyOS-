'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  ErrorState,
  LoadingState,
  PageContainer,
  useToast,
} from '@/design-system';
import { ActivityTimeline, EntityFollowUpsPanel } from '@/features/activity';
import { CommentsPanel } from '@/features/comments';
import { FilePanel } from '@/features/files/components/file-panel';
import { DealDetailHeader } from '@/features/sales/components/deal-detail-header';
import { DealDetailOverviewCard } from '@/features/sales/components/deal-detail-overview-card';
import { DealDetailSummaryCard } from '@/features/sales/components/deal-detail-summary-card';
import { DealDetailTabs } from '@/features/sales/components/deal-detail-tabs';
import { DealFormDrawer } from '@/features/sales/components/deal-form-drawer';
import { DealNotFoundState } from '@/features/sales/components/deal-not-found-state';
import { DealTagsPanel } from '@/features/sales/components/deal-tags-panel';
import { LoseDealDialog } from '@/features/sales/components/lose-deal-dialog';
import { MoveDealStageDialog } from '@/features/sales/components/move-deal-stage-dialog';
import { ConvertDealToProjectDialog } from '@/features/sales/components/convert-deal-to-project-dialog';
import { WinDealDialog } from '@/features/sales/components/win-deal-dialog';
import { DealLineItemsTab } from '@/features/sales/deal-line-items/components/deal-line-items-tab';
import { DealFollowUpsTab } from '@/features/sales/follow-ups/components/deal-follow-ups-tab';
import {
  useArchiveDeal,
  useConvertDealToInvoice,
  useConvertDealToProject,
  useLoseDeal,
  useRestoreDeal,
  useUpdateDealStage,
  useWinDeal,
} from '@/features/sales/hooks/use-deal-actions';
import { useDeal } from '@/features/sales/hooks/use-deal';
import { DealProposalTab } from '@/features/sales/proposals/components/deal-proposal-tab';
import { DealQuotesTab } from '@/features/sales/quotes/components/deal-quotes-tab';
import type { DealStage } from '@/features/sales/types';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function DealDetailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const dealId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [loseOpen, setLoseOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [convertProjectOpen, setConvertProjectOpen] = useState(false);

  const { data: deal, isLoading, error, refetch } = useDeal(dealId);
  const { mutateAsync: archiveDeal, isPending: isArchiving } = useArchiveDeal();
  const { mutateAsync: restoreDeal, isPending: isRestoring } = useRestoreDeal();
  const { mutateAsync: convertToProject, isPending: isConvertingProject } =
    useConvertDealToProject();
  const { mutateAsync: convertToInvoice, isPending: isConvertingInvoice } =
    useConvertDealToInvoice();
  const { mutateAsync: winDeal, isPending: isWinning } = useWinDeal();
  const { mutateAsync: loseDeal, isPending: isLosing } = useLoseDeal();
  const { mutateAsync: moveStage, isPending: isMoving } = useUpdateDealStage();

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

  const archived =
    deal.stage === 'ARCHIVED' || deal.status === 'ARCHIVED' || deal.deletedAt !== null;

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

  const handleConvertToProject = async (options: { templateId?: string }): Promise<void> => {
    try {
      const updated = await convertToProject({ id: dealId, templateId: options.templateId });
      showToast('Deal converted to project', 'success');
      setConvertProjectOpen(false);
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

  const handleWin = async (options: {
    createProject: boolean;
    createInvoice: boolean;
    templateId?: string;
  }): Promise<void> => {
    try {
      const updated = await winDeal({ id: dealId, payload: options });
      showToast('Deal won — Client Success activated', 'success');
      setWinOpen(false);
      if (options.createProject && updated.convertedProjectId !== null) {
        router.push(`/projects/${updated.convertedProjectId}`);
        return;
      }
      router.push(`/clients/${updated.clientId}`);
    } catch (winError) {
      showToast(extractApiErrorMessage(winError), 'error');
    }
  };

  const handleLose = async (payload: {
    lossReason: string;
    competitor?: string | null;
    lossNotes?: string | null;
  }): Promise<void> => {
    try {
      await loseDeal({ id: dealId, payload });
      showToast('Deal marked as lost', 'success');
      setLoseOpen(false);
      await refetch();
    } catch (loseError) {
      showToast(extractApiErrorMessage(loseError), 'error');
    }
  };

  const handleMoveStage = async (stage: DealStage): Promise<void> => {
    try {
      await moveStage({ id: dealId, payload: { stage } });
      showToast('Deal stage updated', 'success');
      setMoveOpen(false);
      await refetch();
    } catch (moveError) {
      showToast(extractApiErrorMessage(moveError), 'error');
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
        onWin={() => {
          setWinOpen(true);
        }}
        onLose={() => {
          setLoseOpen(true);
        }}
        onMoveStage={() => {
          setMoveOpen(true);
        }}
        onConvertToProject={() => {
          setConvertProjectOpen(true);
        }}
        onConvertToInvoice={() => {
          void handleConvertToInvoice();
        }}
        isArchivePending={isArchiving}
        isRestorePending={isRestoring}
        isWinPending={isWinning}
        isLosePending={isLosing}
        isMovePending={isMoving}
        isConvertProjectPending={isConvertingProject}
        isConvertInvoicePending={isConvertingInvoice}
      />

      <DealFormDrawer
        open={editDrawerOpen}
        mode="edit"
        dealId={dealId}
        onOpenChange={setEditDrawerOpen}
      />

      <WinDealDialog
        open={winOpen}
        isPending={isWinning}
        showOpenClientWorkspace={deal.stage === 'WON' || deal.status === 'WON'}
        onCancel={() => {
          setWinOpen(false);
        }}
        onOpenClientWorkspace={() => {
          setWinOpen(false);
          router.push(`/clients/${deal.clientId}`);
        }}
        onConfirm={(options) => {
          void handleWin(options);
        }}
      />

      <ConvertDealToProjectDialog
        open={convertProjectOpen}
        isPending={isConvertingProject}
        onCancel={() => {
          setConvertProjectOpen(false);
        }}
        onConfirm={(options) => {
          void handleConvertToProject(options);
        }}
      />

      <LoseDealDialog
        open={loseOpen}
        isPending={isLosing}
        onCancel={() => {
          setLoseOpen(false);
        }}
        onConfirm={(payload) => {
          void handleLose(payload);
        }}
      />

      <MoveDealStageDialog
        open={moveOpen}
        currentStage={deal.stage}
        isPending={isMoving}
        onCancel={() => {
          setMoveOpen(false);
        }}
        onConfirm={(stage) => {
          void handleMoveStage(stage);
        }}
      />

      <DealDetailTabs
        overview={
          <div className="grid gap-6 lg:grid-cols-2">
            <DealDetailOverviewCard deal={deal} />
            <DealDetailSummaryCard deal={deal} />
          </div>
        }
        products={<DealLineItemsTab dealId={dealId} currency={deal.currency} readOnly={archived} />}
        timeline={
          <Card>
            <CardContent className="pt-6">
              <ActivityTimeline entityType="deal" entityId={dealId} />
            </CardContent>
          </Card>
        }
        followUps={
          <div className="space-y-6">
            <DealFollowUpsTab dealId={dealId} ownerUserId={deal.ownerUserId} />
            <EntityFollowUpsPanel
              entityType="deal"
              entityId={dealId}
              defaultAssigneeUserId={deal.ownerUserId}
            />
          </div>
        }
        comments={<CommentsPanel entityType="deal" entityId={dealId} />}
        documents={<FilePanel entityType="deal" entityId={dealId} />}
        tags={<DealTagsPanel dealId={dealId} readOnly={archived} />}
        proposal={<DealProposalTab dealId={dealId} />}
        quote={<DealQuotesTab dealId={dealId} />}
      />
    </PageContainer>
  );
}
