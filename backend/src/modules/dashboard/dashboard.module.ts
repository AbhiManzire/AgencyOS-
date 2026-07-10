import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DASHBOARD_REPOSITORY } from './repositories/dashboard.repository.interface';
import { PrismaDashboardRepository } from './repositories/prisma-dashboard.repository';
import { DashboardService } from './services/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: PrismaDashboardRepository,
    },
    DashboardService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
