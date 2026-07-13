import { useQuery } from '@tanstack/react-query';
import { listProjectTemplates } from '@/features/projects/templates/api/templates.api';
import type { ListProjectTemplatesParams } from '@/features/projects/templates/api/template.types';
import { templatesQueryKeys } from '@/features/projects/templates/hooks/templates-query-keys';

/** TanStack Query hook for GET /project-templates. */
export function useProjectTemplates(
  params: ListProjectTemplatesParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: templatesQueryKeys.list(params),
    queryFn: () => listProjectTemplates(params),
    enabled: options?.enabled ?? true,
  });
}
