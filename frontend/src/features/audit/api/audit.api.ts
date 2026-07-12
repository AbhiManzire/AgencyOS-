import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type { ListAuditLogsParams, ListAuditLogsResult } from '@/features/audit/api/audit.types';

function cleanParams(params: Record<string, string | number | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).length > 0) {
      out[key] = String(value);
    }
  }
  return out;
}

export async function listAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<ListAuditLogsResult> {
  const response = await apiClient.get<ApiSuccessResponse<ListAuditLogsResult>>('/audit-logs', {
    params: cleanParams({
      from: params.from,
      to: params.to,
      action: params.action,
      category: params.category,
      actorUserId: params.actorUserId,
      search: params.search,
      skip: params.skip,
      take: params.take,
      sortDir: params.sortDir,
    }),
  });
  return response.data.data;
}
