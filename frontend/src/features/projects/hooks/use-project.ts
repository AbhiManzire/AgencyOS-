import { useQuery } from '@tanstack/react-query';
import { getProject } from '@/features/projects/api/projects.api';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

/** TanStack Query hook for GET /projects/:id. */
export function useProject(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: projectsQueryKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
