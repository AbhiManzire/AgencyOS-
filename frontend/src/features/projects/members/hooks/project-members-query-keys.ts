export const projectMembersQueryKeys = {
  all: (projectId: string) => ['projects', projectId, 'members'] as const,
  list: (projectId: string) => [...projectMembersQueryKeys.all(projectId), 'list'] as const,
};
