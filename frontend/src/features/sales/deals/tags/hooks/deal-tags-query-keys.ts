export const dealTagsQueryKeys = {
  all: ['deal-tags'] as const,
  list: (dealId: string) => [...dealTagsQueryKeys.all, 'list', dealId] as const,
};
