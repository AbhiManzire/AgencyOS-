import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeQuickAction } from '@/features/sales/workspace/api/workspace.api';
import type { QuickActionPayload } from '@/features/sales/workspace/api/workspace.types';
import { invalidateWorkspaceCaches } from '@/features/sales/workspace/hooks/use-workspace-dashboard';

/** Executes a sales workspace quick action and refreshes My Work caches. */
export function useQuickAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuickActionPayload) => executeQuickAction(payload),
    onSuccess: async () => {
      await invalidateWorkspaceCaches(queryClient);
    },
  });
}
