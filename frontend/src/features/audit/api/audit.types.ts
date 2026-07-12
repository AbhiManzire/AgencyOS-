export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'SETTINGS_CHANGE'
  | 'FINANCE_CHANGE'
  | 'SALES_CHANGE'
  | 'PROJECT_CHANGE'
  | 'TASK_CHANGE'
  | 'USER_CHANGE'
  | 'SECURITY_CHANGE'
  | 'OTHER';

export interface AuditLogRecord {
  readonly id: string;
  readonly actorUserId: string | null;
  readonly actorDisplayName: string | null;
  readonly action: AuditAction;
  readonly category: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly summary: string;
  readonly metadata: Record<string, unknown> | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly occurredAt: string;
  readonly createdAt: string;
}

export interface ListAuditLogsParams {
  readonly from?: string;
  readonly to?: string;
  readonly action?: string;
  readonly category?: string;
  readonly actorUserId?: string;
  readonly search?: string;
  readonly skip?: number;
  readonly take?: number;
  readonly sortDir?: 'asc' | 'desc';
}

export interface ListAuditLogsResult {
  readonly items: readonly AuditLogRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'ARCHIVE',
  'RESTORE',
  'PERMISSION_CHANGE',
  'ROLE_CHANGE',
  'SETTINGS_CHANGE',
  'FINANCE_CHANGE',
  'SALES_CHANGE',
  'PROJECT_CHANGE',
  'TASK_CHANGE',
  'USER_CHANGE',
  'SECURITY_CHANGE',
  'OTHER',
] as const;
