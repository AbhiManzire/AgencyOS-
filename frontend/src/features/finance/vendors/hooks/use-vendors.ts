import { useQuery } from '@tanstack/react-query';
import { listVendors } from '@/features/finance/vendors/api/vendors.api';
import type { ListVendorsParams } from '@/features/finance/vendors/api/vendor.types';

export const vendorsQueryKeys = {
  all: ['vendors'] as const,
  list: (params: ListVendorsParams) => [...vendorsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...vendorsQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /vendors. */
export function useVendors(
  params: ListVendorsParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: vendorsQueryKeys.list(params),
    queryFn: () => listVendors(params),
    enabled: options?.enabled ?? true,
  });
}
