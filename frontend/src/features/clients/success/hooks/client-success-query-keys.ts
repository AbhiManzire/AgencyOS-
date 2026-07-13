export const clientSuccessQueryKeys = {
  all: ['clients', 'success'] as const,
  dashboard: () => [...clientSuccessQueryKeys.all, 'dashboard'] as const,
  metrics: (clientId: string) => [...clientSuccessQueryKeys.all, 'metrics', clientId] as const,
  health: (clientId: string) => [...clientSuccessQueryKeys.all, 'health', clientId] as const,
  workspace: (clientId: string) => [...clientSuccessQueryKeys.all, 'workspace', clientId] as const,
  renewals: (clientId: string, params?: object) =>
    [...clientSuccessQueryKeys.all, 'renewals', clientId, params ?? {}] as const,
};
