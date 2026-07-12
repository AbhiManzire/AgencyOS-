import type { ListAuditLogsParams } from '@/features/audit/api/audit.types';

export const auditQueryKeys = {
  all: ['audit'] as const,
  list: (params?: ListAuditLogsParams) => [...auditQueryKeys.all, 'list', params ?? {}] as const,
};
