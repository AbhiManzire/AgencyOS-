import type { EntityFilesParams } from '@/features/files/api/file.types';

export const filesQueryKeys = {
  all: ['files'] as const,
  entity: (params: EntityFilesParams) =>
    [...filesQueryKeys.all, params.entityType, params.entityId] as const,
};

export function invalidateEntityFiles(
  queryClient: import('@tanstack/react-query').QueryClient,
  params: EntityFilesParams,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: filesQueryKeys.entity(params) });
}
