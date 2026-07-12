import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { RbacModule } from '../rbac/rbac.module';
import { SettingsController } from './controllers/settings.controller';
import { SETTINGS_REPOSITORY } from './repositories/settings.repository.interface';
import { PrismaSettingsRepository } from './repositories/prisma-settings.repository';
import { SettingsService } from './services/settings.service';

@Module({
  imports: [NotificationsModule, RbacModule],
  controllers: [SettingsController],
  providers: [
    {
      provide: SETTINGS_REPOSITORY,
      useClass: PrismaSettingsRepository,
    },
    SettingsService,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
