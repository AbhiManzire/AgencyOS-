'use client';

import { useParams } from 'next/navigation';
import { PageContainer } from '@/design-system';
import { ProposalEditorLoader } from '@/features/sales/proposals/components/proposal-editor';
import { useProposal } from '@/features/sales/proposals/hooks/use-proposal';

export default function ProposalEditorPage() {
  const params = useParams<{ id: string }>();
  const proposalId = params.id;
  const { data: proposal, isLoading, error, refetch } = useProposal(proposalId);

  return (
    <PageContainer size="2xl">
      <ProposalEditorLoader
        isLoading={isLoading}
        error={error}
        proposal={proposal}
        onRetry={() => {
          void refetch();
        }}
      />
    </PageContainer>
  );
}
