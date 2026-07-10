import { Module } from '@nestjs/common';
import { ReportsController } from './controllers/reports.controller';
import { REPORTS_REPOSITORY } from './repositories/reports.repository.interface';
import { PrismaReportsRepository } from './repositories/prisma-reports.repository';
import { ReportsService } from './services/reports.service';

@Module({
  controllers: [ReportsController],
  providers: [
    {
      provide: REPORTS_REPOSITORY,
      useClass: PrismaReportsRepository,
    },
    ReportsService,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
