import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProposal } from '@/features/sales/proposals/api/proposals.api';
import type { UpdateProposalPayload } from '@/features/sales/proposals/api/proposal.types';
import { proposalsQueryKeys } from '@/features/sales/proposals/hooks/use-proposal';

export function useUpdateProposal(proposalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProposalPayload) => updateProposal(proposalId, payload),
    onSuccess: async (proposal) => {
      await queryClient.setQueryData(proposalsQueryKeys.detail(proposalId), proposal);
    },
  });
}
