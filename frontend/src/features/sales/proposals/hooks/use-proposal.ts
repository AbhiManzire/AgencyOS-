import { useQuery } from '@tanstack/react-query';
import { getProposal } from '@/features/sales/proposals/api/proposals.api';
import { normalizeProposalSections } from '@/features/sales/proposals/proposal-sections';

export const proposalsQueryKeys = {
  all: ['proposals'] as const,
  detail: (id: string) => [...proposalsQueryKeys.all, 'detail', id] as const,
};

export function useProposal(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: proposalsQueryKeys.detail(id),
    queryFn: async () => {
      const record = await getProposal(id);
      return {
        ...record,
        sections: normalizeProposalSections(record.sections),
      };
    },
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
