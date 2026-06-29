import type { QueryClient } from '@tanstack/react-query';

export const followUpsQueryKeys = {
  all: ['followUps'] as const,
  list: (dealId: string) => [...followUpsQueryKeys.all, dealId] as const,
};

export async function invalidateDealFollowUpCaches(
  queryClient: QueryClient,
  dealId: string,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: followUpsQueryKeys.list(dealId) });
}
