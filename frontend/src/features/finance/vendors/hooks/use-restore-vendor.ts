import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreVendor } from '@/features/finance/vendors/api/vendors.api';
import type { RestoreVendorPayload } from '@/features/finance/vendors/api/vendor.types';
import { vendorsQueryKeys } from '@/features/finance/vendors/hooks/use-vendors';

/** TanStack Query mutation for POST /vendors/:id/restore. */
export function useRestoreVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: RestoreVendorPayload }) =>
      restoreVendor(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
