import { useQuery } from '@tanstack/react-query';
import { getProjectDeliveryDashboard } from '@/features/projects/delivery/api/delivery.api';
import { deliveryQueryKeys } from '@/features/projects/delivery/hooks/delivery-query-keys';

/** TanStack Query hook for GET /projects/delivery/dashboard. */
export function useProjectDeliveryDashboard(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: deliveryQueryKeys.dashboard(),
    queryFn: () => getProjectDeliveryDashboard(),
    enabled: options?.enabled ?? true,
  });
}
