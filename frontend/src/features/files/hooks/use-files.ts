import { useQuery } from '@tanstack/react-query';
import { fileRecordToListItem } from '@/features/files/api/file.mapper';
import { listFiles } from '@/features/files/api/files.api';
import type { EntityFilesParams } from '@/features/files/api/file.types';
import { filesQueryKeys } from '@/features/files/hooks/files-query-keys';

/** TanStack Query hook for GET /files/:entityType/:entityId. */
export function useFiles(params: EntityFilesParams) {
  return useQuery({
    queryKey: filesQueryKeys.entity(params),
    queryFn: async () => {
      const records = await listFiles(params);
      return records.map(fileRecordToListItem);
    },
    enabled: params.entityType.length > 0 && params.entityId.length > 0,
  });
}
