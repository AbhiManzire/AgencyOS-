import { useQuery } from '@tanstack/react-query';
import { getClientSuccessDashboard } from '@/features/clients/success/api/client-success.api';
import { clientSuccessQueryKeys } from '@/features/clients/success/hooks/client-success-query-keys';

/** TanStack Query hook for GET /clients/success/dashboard. */
export function useClientSuccessDashboard(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: clientSuccessQueryKeys.dashboard(),
    queryFn: () => getClientSuccessDashboard(),
    enabled: options?.enabled ?? true,
  });
}
