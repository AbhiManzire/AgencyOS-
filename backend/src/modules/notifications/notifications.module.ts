import { Module } from '@nestjs/common';
import { EMAIL_SERVICE } from './email.service.interface';
import { LoggingEmailService } from './logging-email.service';

@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: LoggingEmailService,
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class NotificationsModule {}
