import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import type {
  AuditLogRecord,
  AuditScope,
  ListAuditLogsResult,
  WriteAuditLogInput,
} from '../audit.types';
import { AUDIT_REPOSITORY, type AuditRepository } from '../repositories/audit.repository.interface';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: AuditRepository,
  ) {}

  async list(scope: AuditScope, query: ListAuditLogsQueryDto): Promise<ListAuditLogsResult> {
    return this.auditRepository.list({
      scope,
      from: query.from !== undefined ? new Date(query.from) : undefined,
      to: query.to !== undefined ? new Date(query.to) : undefined,
      action: query.action,
      category: query.category,
      actorUserId: query.actorUserId,
      search: query.search,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
      sortDir: query.sortDir ?? 'desc',
    });
  }

  async getById(scope: AuditScope, id: string): Promise<AuditLogRecord> {
    const record = await this.auditRepository.findById(scope, id);
    if (record === null) {
      throw new NotFoundException('Audit log not found.');
    }
    return record;
  }

  async create(scope: AuditScope, input: WriteAuditLogInput): Promise<AuditLogRecord> {
    return this.auditRepository.create(scope, input);
  }
}
