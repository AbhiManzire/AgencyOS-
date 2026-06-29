import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/features/projects/api/projects.api';
import type { ListProjectsParams } from '@/features/projects/api/project.types';

export const projectsQueryKeys = {
  all: ['projects'] as const,
  list: (params: ListProjectsParams) => [...projectsQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...projectsQueryKeys.all, 'detail', id] as const,
};

/** TanStack Query hook for GET /projects with pagination and status filter. */
export function useProjects(params: ListProjectsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectsQueryKeys.list(params),
    queryFn: () => listProjects(params),
    enabled: options?.enabled ?? true,
  });
}
