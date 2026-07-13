import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateDashboardSummary } from '@/features/dashboard/hooks/invalidate-dashboard-summary';
import {
  createProjectFromClient,
  createProjectFromDeal,
} from '@/features/projects/delivery/api/delivery.api';
import type {
  CreateProjectFromClientPayload,
  CreateProjectFromDealPayload,
} from '@/features/projects/delivery/api/delivery.types';
import { deliveryQueryKeys } from '@/features/projects/delivery/hooks/delivery-query-keys';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

/** Creates a project from a client via POST /projects/from-client. */
export function useCreateProjectFromClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectFromClientPayload) => createProjectFromClient(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}

/** Creates a project from a deal via POST /projects/from-deal. */
export function useCreateProjectFromDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectFromDealPayload) => createProjectFromDeal(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: deliveryQueryKeys.all }),
        invalidateDashboardSummary(queryClient),
      ]);
    },
  });
}
