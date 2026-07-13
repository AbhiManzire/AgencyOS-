import { useQuery } from '@tanstack/react-query';
import { getProjectTemplate } from '@/features/projects/templates/api/templates.api';
import { templatesQueryKeys } from '@/features/projects/templates/hooks/templates-query-keys';

/** TanStack Query hook for GET /project-templates/:id. */
export function useProjectTemplate(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: templatesQueryKeys.detail(id),
    queryFn: () => getProjectTemplate(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
