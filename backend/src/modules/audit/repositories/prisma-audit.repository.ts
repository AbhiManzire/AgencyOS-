import { Injectable } from '@nestjs/common';
import type { AuditLog, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuditLogRecord,
  AuditScope,
  ListAuditLogsParams,
  ListAuditLogsResult,
  WriteAuditLogInput,
} from '../audit.types';
import type { AuditRepository } from './audit.repository.interface';

@Injectable()
export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(scope: AuditScope, input: WriteAuditLogInput): Promise<AuditLogRecord> {
    const now = input.occurredAt ?? new Date();
    const created = await this.prisma.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        category: input.category,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        occurredAt: now,
        createdAt: now,
      },
    });

    return toAuditLogRecord(created);
  }

  async findById(scope: AuditScope, id: string): Promise<AuditLogRecord | null> {
    const row = await this.prisma.auditLog.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    return row === null ? null : toAuditLogRecord(row);
  }

  async list(params: ListAuditLogsParams): Promise<ListAuditLogsResult> {
    const { scope, from, to, action, category, actorUserId, search, skip, take, sortDir } = params;

    const where: Prisma.AuditLogWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(action !== undefined ? { action } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(actorUserId !== undefined ? { actorUserId } : {}),
      ...(from !== undefined || to !== undefined
        ? {
            occurredAt: {
              ...(from !== undefined ? { gte: from } : {}),
              ...(to !== undefined ? { lte: to } : {}),
            },
          }
        : {}),
      ...(search !== undefined && search.trim().length > 0
        ? {
            OR: [
              { summary: { contains: search.trim(), mode: 'insensitive' } },
              { category: { contains: search.trim(), mode: 'insensitive' } },
              { entityType: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { occurredAt: sortDir },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map(toAuditLogRecord),
      total,
    };
  }
}

function toAuditLogRecord(row: AuditLog): AuditLogRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    actorUserId: row.actorUserId,
    action: row.action,
    category: row.category,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
    metadata: row.metadata,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
