'use client';

import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '@/features/audit/api/audit.api';
import type { ListAuditLogsParams } from '@/features/audit/api/audit.types';
import { auditQueryKeys } from '@/features/audit/hooks/audit-query-keys';

const STALE_TIME = 30_000;

export function useAuditLogs(params: ListAuditLogsParams = {}) {
  return useQuery({
    queryKey: auditQueryKeys.list(params),
    queryFn: () => listAuditLogs(params),
    staleTime: STALE_TIME,
  });
}
