import { useQuery } from '@tanstack/react-query';
import { getDealDashboard, getDealForecast } from '@/features/sales/api/deals.api';
import { dealsQueryKeys } from '@/features/sales/hooks/use-deals';
import type { DealForecastPeriod } from '@/features/sales/types';

export const dealMetricsQueryKeys = {
  dashboard: () => [...dealsQueryKeys.all, 'dashboard'] as const,
  forecast: (period: DealForecastPeriod) => [...dealsQueryKeys.all, 'forecast', period] as const,
};

/** TanStack Query hook for GET /deals/dashboard. */
export function useDealDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealMetricsQueryKeys.dashboard(),
    queryFn: () => getDealDashboard(),
    enabled: options?.enabled ?? true,
  });
}

/** TanStack Query hook for GET /deals/forecast. */
export function useDealForecast(period: DealForecastPeriod, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealMetricsQueryKeys.forecast(period),
    queryFn: () => getDealForecast(period),
    enabled: options?.enabled ?? true,
  });
}
