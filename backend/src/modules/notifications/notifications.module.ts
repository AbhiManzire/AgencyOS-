import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { EMAIL_SERVICE } from './email.service.interface';
import { LoggingEmailService } from './logging-email.service';
import { NOTIFICATION_REPOSITORY } from './repositories/notification.repository.interface';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: LoggingEmailService,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    NotificationService,
  ],
  exports: [EMAIL_SERVICE, NotificationService],
})
export class NotificationsModule {}
