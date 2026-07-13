export const deliveryQueryKeys = {
  all: ['projects', 'delivery'] as const,
  dashboard: () => [...deliveryQueryKeys.all, 'dashboard'] as const,
  health: (projectId: string) => [...deliveryQueryKeys.all, 'health', projectId] as const,
  hours: (projectId: string) => [...deliveryQueryKeys.all, 'hours', projectId] as const,
  workspace: (projectId: string) => [...deliveryQueryKeys.all, 'workspace', projectId] as const,
  portal: (projectId: string) => [...deliveryQueryKeys.all, 'portal', projectId] as const,
};
