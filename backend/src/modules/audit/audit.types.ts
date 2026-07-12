import type { AuditAction, Prisma } from '@prisma/client';

export interface AuditScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface AuditLogRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly actorUserId: string | null;
  readonly action: AuditAction;
  readonly category: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly summary: string;
  readonly metadata: Prisma.JsonValue | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly occurredAt: string;
  readonly createdAt: string;
}

export interface WriteAuditLogInput {
  readonly actorUserId?: string | null;
  readonly action: AuditAction;
  readonly category: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly summary: string;
  readonly metadata?: Prisma.InputJsonValue;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly occurredAt?: Date;
}

export interface ListAuditLogsParams {
  readonly scope: AuditScope;
  readonly from?: Date;
  readonly to?: Date;
  readonly action?: AuditAction;
  readonly category?: string;
  readonly actorUserId?: string;
  readonly search?: string;
  readonly skip: number;
  readonly take: number;
  readonly sortDir: 'asc' | 'desc';
}

export interface ListAuditLogsResult {
  readonly items: readonly AuditLogRecord[];
  readonly total: number;
}
