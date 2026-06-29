import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UploadFileParams } from '@/features/files/api/file.types';
import { uploadFile } from '@/features/files/api/files.api';
import { invalidateEntityFiles } from '@/features/files/hooks/files-query-keys';

export function useUploadFile(params: { readonly entityType: string; readonly entityId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      uploadFile({
        entityType: params.entityType,
        entityId: params.entityId,
        file,
      } satisfies UploadFileParams),
    onSuccess: async () => {
      await invalidateEntityFiles(queryClient, params);
    },
  });
}
