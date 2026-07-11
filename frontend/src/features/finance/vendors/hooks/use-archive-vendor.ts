import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveVendor } from '@/features/finance/vendors/api/vendors.api';
import { vendorsQueryKeys } from '@/features/finance/vendors/hooks/use-vendors';

/** TanStack Query mutation for DELETE /vendors/:id (archive). */
export function useArchiveVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveVendor(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: vendorsQueryKeys.detail(id) }),
      ]);
    },
  });
}
