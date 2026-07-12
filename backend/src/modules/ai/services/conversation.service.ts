import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AiConversation,
  AiConversationStatus,
  AiMessage,
  AiMessageRole,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiConversationRecord, AiMessageRecord, AiScope } from '../ai.types';
import type { CreateAiConversationDto } from '../dto/ai-conversation.dto';
import { AiAuditService } from './ai-audit.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAudit: AiAuditService,
  ) {}

  async create(
    scope: AiScope,
    ownerUserId: string,
    dto: CreateAiConversationDto,
    actorUserId: string | null,
  ): Promise<AiConversationRecord> {
    const now = new Date();
    const row = await this.prisma.aiConversation.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ownerUserId,
        title: dto.title ?? null,
        providerKind: dto.providerKind ?? null,
        model: dto.model ?? null,
        metadata: dto.metadata ?? undefined,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.aiAudit.write(scope, {
      actorUserId,
      entityType: 'AiConversation',
      entityId: row.id,
      summary: 'Created AI conversation.',
      metadata: { ownerUserId },
    });

    return this.toConversationRecord(row);
  }

  async appendMessage(
    scope: AiScope,
    conversationId: string,
    input: {
      role: AiMessageRole;
      content: string;
      tokenCount: number | null;
      createdByUserId: string | null;
      metadata: Prisma.InputJsonValue | null;
    },
    actorUserId: string | null,
  ): Promise<AiMessageRecord> {
    await this.findScopedConversation(scope, conversationId);

    const now = new Date();
    const row = await this.prisma.aiMessage.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        conversationId,
        role: input.role,
        content: input.content,
        tokenCount: input.tokenCount,
        createdByUserId: input.createdByUserId,
        metadata: input.metadata ?? undefined,
        createdAt: now,
      },
    });

    await this.prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: now },
    });

    await this.aiAudit.write(scope, {
      actorUserId,
      entityType: 'AiMessage',
      entityId: row.id,
      summary: `Appended ${input.role.toLowerCase()} message to conversation.`,
      metadata: { conversationId, role: input.role },
    });

    return this.toMessageRecord(row);
  }

  async list(
    scope: AiScope,
    ownerUserId: string | null,
    skip: number,
    take: number,
    status?: AiConversationStatus,
  ): Promise<{ items: readonly AiConversationRecord[]; total: number }> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
      ...(ownerUserId !== null ? { ownerUserId } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.aiConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.aiConversation.count({ where }),
    ]);

    return { items: rows.map((row) => this.toConversationRecord(row)), total };
  }

  private async findScopedConversation(scope: AiScope, id: string): Promise<AiConversation> {
    const row = await this.prisma.aiConversation.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    if (row === null) {
      throw new NotFoundException('AI conversation not found.');
    }

    return row;
  }

  private toConversationRecord(row: AiConversation): AiConversationRecord {
    return {
      id: row.id,
      ownerUserId: row.ownerUserId,
      title: row.title,
      status: row.status,
      providerKind: row.providerKind,
      model: row.model,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toMessageRecord(row: AiMessage): AiMessageRecord {
    return {
      id: row.id,
      conversationId: row.conversationId,
      role: row.role,
      content: row.content,
      tokenCount: row.tokenCount,
      createdByUserId: row.createdByUserId,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
