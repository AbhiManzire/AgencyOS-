import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesController } from './controllers/activities.controller';
import { FollowUpsController } from './follow-ups/controllers/follow-ups.controller';
import { FollowUpDomainService } from './follow-ups/domain/follow-up-domain.service';
import { FOLLOW_UP_REPOSITORY } from './follow-ups/repositories/follow-up.repository.interface';
import { PrismaEntityFollowUpRepository } from './follow-ups/repositories/prisma-follow-up.repository';
import { FollowUpSchedulerService } from './follow-ups/services/follow-up-scheduler.service';
import { FollowUpService } from './follow-ups/services/follow-up.service';
import { ACTIVITY_REPOSITORY } from './repositories/activity.repository.interface';
import { PrismaActivityRepository } from './repositories/prisma-activity.repository';
import { ActivityService } from './services/activity.service';

@Module({
  imports: [NotificationsModule],
  providers: [
    {
      provide: ACTIVITY_REPOSITORY,
      useClass: PrismaActivityRepository,
    },
    {
      provide: FOLLOW_UP_REPOSITORY,
      useClass: PrismaEntityFollowUpRepository,
    },
    ActivityService,
    FollowUpDomainService,
    FollowUpService,
    FollowUpSchedulerService,
  ],
  controllers: [ActivitiesController, FollowUpsController],
  exports: [ACTIVITY_REPOSITORY, ActivityService, FOLLOW_UP_REPOSITORY, FollowUpService],
})
export class ActivitiesModule {}
