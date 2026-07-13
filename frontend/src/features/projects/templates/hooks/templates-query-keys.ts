export const templatesQueryKeys = {
  all: ['project-templates'] as const,
  lists: () => [...templatesQueryKeys.all, 'list'] as const,
  list: (params?: object) => [...templatesQueryKeys.lists(), params ?? {}] as const,
  details: () => [...templatesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...templatesQueryKeys.details(), id] as const,
};
