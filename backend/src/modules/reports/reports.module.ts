import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsController } from './controllers/reports.controller';
import { ScheduledReportsController } from './controllers/scheduled-reports.controller';
import { PrismaAnalyticsRepository } from './repositories/prisma-analytics.repository';
import { PrismaReportsRepository } from './repositories/prisma-reports.repository';
import { PrismaScheduledReportRepository } from './repositories/prisma-scheduled-report.repository';
import {
  ANALYTICS_REPOSITORY,
  REPORTS_REPOSITORY,
} from './repositories/reports.repository.interface';
import { SCHEDULED_REPORT_REPOSITORY } from './repositories/scheduled-report.repository.interface';
import { ReportsService } from './services/reports.service';
import { ScheduledReportService } from './services/scheduled-report.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ScheduledReportsController, ReportsController],
  providers: [
    {
      provide: REPORTS_REPOSITORY,
      useClass: PrismaReportsRepository,
    },
    {
      provide: ANALYTICS_REPOSITORY,
      useClass: PrismaAnalyticsRepository,
    },
    {
      provide: SCHEDULED_REPORT_REPOSITORY,
      useClass: PrismaScheduledReportRepository,
    },
    ReportsService,
    ScheduledReportService,
  ],
  exports: [ReportsService, ScheduledReportService],
})
export class ReportsModule {}
