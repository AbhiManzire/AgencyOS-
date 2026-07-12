import type {
  AuditLogRecord,
  AuditScope,
  ListAuditLogsParams,
  ListAuditLogsResult,
  WriteAuditLogInput,
} from '../audit.types';

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export interface AuditRepository {
  create(scope: AuditScope, input: WriteAuditLogInput): Promise<AuditLogRecord>;
  findById(scope: AuditScope, id: string): Promise<AuditLogRecord | null>;
  list(params: ListAuditLogsParams): Promise<ListAuditLogsResult>;
}
