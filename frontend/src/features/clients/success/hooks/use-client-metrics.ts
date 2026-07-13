import { useQuery } from '@tanstack/react-query';
import { getClientMetrics } from '@/features/clients/success/api/client-success.api';
import { clientSuccessQueryKeys } from '@/features/clients/success/hooks/client-success-query-keys';

/** TanStack Query hook for GET /clients/:id/metrics. */
export function useClientMetrics(clientId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: clientSuccessQueryKeys.metrics(clientId),
    queryFn: () => getClientMetrics(clientId),
    enabled: (options?.enabled ?? true) && clientId.length > 0,
  });
}
