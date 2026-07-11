import { useQuery } from '@tanstack/react-query';
import { listProposals } from '@/features/sales/proposals/api/proposals.api';
import type { ListProposalsParams } from '@/features/sales/proposals/api/proposal.types';
import { proposalsQueryKeys } from '@/features/sales/proposals/hooks/use-proposal';
import { normalizeProposalSections } from '@/features/sales/proposals/proposal-sections';

/** TanStack Query hook for GET /proposals. */
export function useProposals(params: ListProposalsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: proposalsQueryKeys.list(params),
    queryFn: async () => {
      const result = await listProposals(params);
      return {
        ...result,
        items: result.items.map((item) => ({
          ...item,
          sections: normalizeProposalSections(item.sections),
        })),
      };
    },
    enabled: options?.enabled ?? true,
  });
}
