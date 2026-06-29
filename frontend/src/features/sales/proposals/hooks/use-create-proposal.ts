import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProposal } from '@/features/sales/proposals/api/proposals.api';
import type { CreateProposalPayload } from '@/features/sales/proposals/api/proposal.types';
import { proposalsQueryKeys } from '@/features/sales/proposals/hooks/use-proposal';

export function useCreateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProposalPayload) => createProposal(payload),
    onSuccess: async (proposal) => {
      await queryClient.invalidateQueries({ queryKey: proposalsQueryKeys.detail(proposal.id) });
    },
  });
}
