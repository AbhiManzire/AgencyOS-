import { useQuery } from '@tanstack/react-query';
import { getLead } from '@/features/sales/leads/api/leads.api';
import { leadsQueryKeys } from '@/features/sales/leads/hooks/use-leads';

/** TanStack Query hook for GET /leads/:id. */
export function useLead(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leadsQueryKeys.detail(id),
    queryFn: () => getLead(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
