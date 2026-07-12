import { Injectable } from '@nestjs/common';
import { AuditAction, type Prisma } from '@prisma/client';
import { AuditWriterService } from '../../audit/services/audit-writer.service';
import type { AiScope } from '../ai.types';

export interface WriteAiAuditInput {
  readonly actorUserId?: string | null;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly summary: string;
  readonly metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AiAuditService {
  constructor(private readonly auditWriter: AuditWriterService) {}

  async write(scope: AiScope, input: WriteAiAuditInput): Promise<void> {
    await this.auditWriter.write(scope, {
      actorUserId: input.actorUserId,
      action: AuditAction.AI_CHANGE,
      category: 'ai',
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata,
    });
  }
}
