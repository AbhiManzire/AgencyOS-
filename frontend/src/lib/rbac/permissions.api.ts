import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type { PermissionCatalogItem, WorkspacePermissions } from '@/lib/rbac/types';

/** Fetches the current user's workspace-scoped permissions. */
export async function fetchMyPermissions(): Promise<WorkspacePermissions> {
  const response =
    await apiClient.get<ApiSuccessResponse<WorkspacePermissions>>('/rbac/me/permissions');
  return response.data.data;
}

/** Fetches the platform permission catalog. */
export async function fetchPermissionCatalog(): Promise<readonly PermissionCatalogItem[]> {
  const response = await apiClient.get<ApiSuccessResponse<PermissionCatalogItem[]>>(
    '/rbac/permissions/catalog',
  );
  return response.data.data;
}
