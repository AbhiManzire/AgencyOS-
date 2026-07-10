import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unassignClientTag } from '@/features/clients/tags/api/client-tags.api';
import { clientTagsQueryKeys } from '@/features/clients/tags/hooks/client-tags-query-keys';

/** Removes a tag assignment from a client. */
export function useUnassignClientTag(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => unassignClientTag(clientId, tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientTagsQueryKeys.list(clientId) });
    },
  });
}
