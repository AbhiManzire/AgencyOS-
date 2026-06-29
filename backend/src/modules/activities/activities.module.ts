import { Module } from '@nestjs/common';
import { ActivitiesController } from './controllers/activities.controller';
import { ACTIVITY_REPOSITORY } from './repositories/activity.repository.interface';
import { PrismaActivityRepository } from './repositories/prisma-activity.repository';
import { ActivityService } from './services/activity.service';

@Module({
  providers: [
    {
      provide: ACTIVITY_REPOSITORY,
      useClass: PrismaActivityRepository,
    },
    ActivityService,
  ],
  controllers: [ActivitiesController],
  exports: [ACTIVITY_REPOSITORY, ActivityService],
})
export class ActivitiesModule {}
