import { useQuery } from '@tanstack/react-query';
import {
  listProjectDepartments,
  listProjectWorkspaceOwners,
} from '@/features/projects/api/projects.api';

export const projectMetaQueryKeys = {
  owners: ['projects', 'workspace-owners'] as const,
  departments: ['projects', 'departments'] as const,
};

export function useProjectWorkspaceOwners(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: projectMetaQueryKeys.owners,
    queryFn: listProjectWorkspaceOwners,
    enabled: options?.enabled ?? true,
  });
}

export function useProjectDepartments(options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: projectMetaQueryKeys.departments,
    queryFn: listProjectDepartments,
    enabled: options?.enabled ?? true,
  });
}
