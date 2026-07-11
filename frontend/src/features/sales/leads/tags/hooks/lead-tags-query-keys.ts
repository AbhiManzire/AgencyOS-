export const leadTagsQueryKeys = {
  all: ['lead-tags'] as const,
  list: (leadId: string) => [...leadTagsQueryKeys.all, 'list', leadId] as const,
};
