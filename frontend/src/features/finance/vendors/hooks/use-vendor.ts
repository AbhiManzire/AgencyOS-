import { useQuery } from '@tanstack/react-query';
import { getVendor } from '@/features/finance/vendors/api/vendors.api';
import { vendorsQueryKeys } from '@/features/finance/vendors/hooks/use-vendors';

/** TanStack Query hook for GET /vendors/:id. */
export function useVendor(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: vendorsQueryKeys.detail(id),
    queryFn: () => getVendor(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
