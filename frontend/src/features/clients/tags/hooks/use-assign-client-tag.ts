import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignClientTag } from '@/features/clients/tags/api/client-tags.api';
import type { AssignClientTagPayload } from '@/features/clients/tags/api/client-tag.types';
import { clientTagsQueryKeys } from '@/features/clients/tags/hooks/client-tags-query-keys';

/** Assigns (or creates) a tag on a client. */
export function useAssignClientTag(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignClientTagPayload) => assignClientTag(clientId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientTagsQueryKeys.list(clientId) });
    },
  });
}
