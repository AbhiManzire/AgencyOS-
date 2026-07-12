export interface TenantWorkspaceScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface ActorContext {
  readonly actorUserId: string;
}

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

/** Reads a single header value from Nest `@Headers()` map. */
export function readHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = headers[name] ?? headers[name.toLowerCase()];
  const raw = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Resolves tenant + workspace scope from request headers. */
export function resolveTenantWorkspaceScope(
  headers: Record<string, string | string[] | undefined>,
): TenantWorkspaceScope {
  return {
    tenantId: readHeader(headers, TENANT_HEADER),
    workspaceId: readHeader(headers, WORKSPACE_HEADER),
  };
}

/** Resolves actor user id from request headers. */
export function resolveActorContext(
  headers: Record<string, string | string[] | undefined>,
): ActorContext {
  return {
    actorUserId: readHeader(headers, USER_HEADER),
  };
}
