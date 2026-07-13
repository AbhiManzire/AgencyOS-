import { useQuery } from '@tanstack/react-query';
import { getDefaultPipeline, listPipelines } from '@/features/sales/pipelines/api/pipelines.api';

export const pipelinesQueryKeys = {
  all: ['pipelines'] as const,
  list: () => [...pipelinesQueryKeys.all, 'list'] as const,
  default: () => [...pipelinesQueryKeys.all, 'default'] as const,
};

/** TanStack Query hook for GET /pipelines. */
export function usePipelines(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pipelinesQueryKeys.list(),
    queryFn: () => listPipelines(),
    enabled: options?.enabled ?? true,
  });
}

/** TanStack Query hook for GET /pipelines/default. */
export function useDefaultPipeline(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pipelinesQueryKeys.default(),
    queryFn: () => getDefaultPipeline(),
    enabled: options?.enabled ?? true,
  });
}
