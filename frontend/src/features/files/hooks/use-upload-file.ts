import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FileDocumentFolder, UploadFileParams } from '@/features/files/api/file.types';
import { uploadFile } from '@/features/files/api/files.api';
import { invalidateEntityFiles } from '@/features/files/hooks/files-query-keys';

export function useUploadFile(params: { readonly entityType: string; readonly entityId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: File | { readonly file: File; readonly folder?: FileDocumentFolder }) => {
      const file = input instanceof File ? input : input.file;
      const folder = input instanceof File ? undefined : input.folder;

      return uploadFile({
        entityType: params.entityType,
        entityId: params.entityId,
        file,
        ...(folder !== undefined ? { folder } : {}),
      } satisfies UploadFileParams);
    },
    onSuccess: async () => {
      await invalidateEntityFiles(queryClient, params);
    },
  });
}
