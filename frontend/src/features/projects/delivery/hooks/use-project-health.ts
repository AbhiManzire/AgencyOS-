import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProjectHealth,
  refreshProjectHealth,
} from '@/features/projects/delivery/api/delivery.api';
import { deliveryQueryKeys } from '@/features/projects/delivery/hooks/delivery-query-keys';

/** TanStack Query hook for GET /projects/:id/health. */
export function useProjectHealth(projectId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: deliveryQueryKeys.health(projectId),
    queryFn: () => getProjectHealth(projectId),
    enabled: (options?.enabled ?? true) && projectId.length > 0,
  });
}

/** Recalculates project health via POST /projects/:id/health/refresh. */
export function useRefreshProjectHealth(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshProjectHealth(projectId),
    onSuccess: async (data) => {
      queryClient.setQueryData(deliveryQueryKeys.health(projectId), data);
      await queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.dashboard() });
    },
  });
}
