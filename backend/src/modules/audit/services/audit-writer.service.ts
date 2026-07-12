import { Injectable } from '@nestjs/common';
import type { AuditLogRecord, AuditScope, WriteAuditLogInput } from '../audit.types';
import { AuditService } from './audit.service';

/** Thin facade other modules use to persist audit events. */
@Injectable()
export class AuditWriterService {
  constructor(private readonly auditService: AuditService) {}

  async write(scope: AuditScope, input: WriteAuditLogInput): Promise<AuditLogRecord> {
    return this.auditService.create(scope, input);
  }
}
