import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AUDIT_REPOSITORY } from './repositories/audit.repository.interface';
import { PrismaAuditRepository } from './repositories/prisma-audit.repository';
import { AuditWriterService } from './services/audit-writer.service';
import { AuditService } from './services/audit.service';

@Module({
  controllers: [AuditController],
  providers: [
    {
      provide: AUDIT_REPOSITORY,
      useClass: PrismaAuditRepository,
    },
    AuditService,
    AuditWriterService,
  ],
  exports: [AuditService, AuditWriterService],
})
export class AuditModule {}
