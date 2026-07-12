export const securityQueryKeys = {
  all: ['security'] as const,
  settings: () => [...securityQueryKeys.all, 'settings'] as const,
  tokens: () => [...securityQueryKeys.all, 'tokens'] as const,
};
