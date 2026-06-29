export const projectMilestonesQueryKeys = {
  all: (projectId: string) => ['projects', projectId, 'milestones'] as const,
  list: (projectId: string) => [...projectMilestonesQueryKeys.all(projectId), 'list'] as const,
};
