import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVendor } from '@/features/finance/vendors/api/vendors.api';
import type { CreateVendorPayload } from '@/features/finance/vendors/api/vendor.types';
import { vendorsQueryKeys } from '@/features/finance/vendors/hooks/use-vendors';

/** TanStack Query mutation for POST /vendors. */
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVendorPayload) => createVendor(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.all });
    },
  });
}
