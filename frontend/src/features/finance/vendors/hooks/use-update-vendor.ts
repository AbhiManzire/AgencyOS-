import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVendor } from '@/features/finance/vendors/api/vendors.api';
import type { UpdateVendorPayload } from '@/features/finance/vendors/api/vendor.types';
import { vendorsQueryKeys } from '@/features/finance/vendors/hooks/use-vendors';

/** TanStack Query mutation for PATCH /vendors/:id. */
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVendorPayload }) =>
      updateVendor(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
