import { useQuery } from '@tanstack/react-query';
import { getInvoice } from '@/features/finance/invoices/api/invoices.api';
import { invoicesQueryKeys } from '@/features/finance/invoices/hooks/use-invoices';

/** TanStack Query hook for GET /invoices/:id. */
export function useInvoice(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: invoicesQueryKeys.detail(id),
    queryFn: () => getInvoice(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
