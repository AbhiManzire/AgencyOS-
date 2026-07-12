import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SecurityController } from './controllers/security.controller';
import { SECURITY_REPOSITORY } from './repositories/security.repository.interface';
import { PrismaSecurityRepository } from './repositories/prisma-security.repository';
import { SecurityService } from './services/security.service';

@Module({
  imports: [AuditModule],
  controllers: [SecurityController],
  providers: [
    {
      provide: SECURITY_REPOSITORY,
      useClass: PrismaSecurityRepository,
    },
    SecurityService,
  ],
  exports: [SecurityService],
})
export class SecurityModule {}
