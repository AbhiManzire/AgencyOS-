export const clientTagsQueryKeys = {
  all: ['client-tags'] as const,
  list: (clientId: string) => [...clientTagsQueryKeys.all, 'list', clientId] as const,
};
