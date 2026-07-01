'use client';

import { FileText, FileType } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  LoadingState,
  PageContainer,
} from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { ActivityTimeline } from '@/features/activity';
import { ClientDetailSectionPlaceholder } from '@/features/clients/components/client-detail-section-placeholder';
import { CommentsPanel } from '@/features/comments';
import { DealDetailHeader } from '@/features/sales/components/deal-detail-header';
import { DealDetailOverviewCard } from '@/features/sales/components/deal-detail-overview-card';
import { DealDetailSummaryCard } from '@/features/sales/components/deal-detail-summary-card';
import { DealDetailTabs } from '@/features/sales/components/deal-detail-tabs';
import { DealFormDrawer } from '@/features/sales/components/deal-form-drawer';
import { DealNotFoundState } from '@/features/sales/components/deal-not-found-state';
import { DealFollowUpsTab } from '@/features/sales/follow-ups/components/deal-follow-ups-tab';
import { DealProposalTab } from '@/features/sales/proposals/components/deal-proposal-tab';
import { useDeal } from '@/features/sales/hooks/use-deal';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const dealId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: deal, isLoading, error, refetch } = useDeal(dealId);

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

  return (
    <PageContainer size="lg">
      <DealDetailHeader
        deal={deal}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
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
          quote={
            <ClientDetailSectionPlaceholder
              title="Quote"
              description="Quotes linked to this deal will appear here."
              icon={FileType}
            />
          }
          documents={
            <ClientDetailSectionPlaceholder
              title="Documents"
              description="Deal documents will appear here."
              icon={FileText}
            />
          }
        />
      </div>
    </PageContainer>
  );
}
