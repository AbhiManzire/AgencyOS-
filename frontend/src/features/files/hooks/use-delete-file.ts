import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteFile } from '@/features/files/api/files.api';
import { invalidateEntityFiles } from '@/features/files/hooks/files-query-keys';

export function useDeleteFile(params: { readonly entityType: string; readonly entityId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: async () => {
      await invalidateEntityFiles(queryClient, params);
    },
  });
}
