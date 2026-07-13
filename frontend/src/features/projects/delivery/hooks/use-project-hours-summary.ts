import { useQuery } from '@tanstack/react-query';
import { getProjectHoursSummary } from '@/features/projects/delivery/api/delivery.api';
import { deliveryQueryKeys } from '@/features/projects/delivery/hooks/delivery-query-keys';

/** TanStack Query hook for GET /projects/:id/hours-summary. */
export function useProjectHoursSummary(
  projectId: string,
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: deliveryQueryKeys.hours(projectId),
    queryFn: () => getProjectHoursSummary(projectId),
    enabled: (options?.enabled ?? true) && projectId.length > 0,
  });
}
