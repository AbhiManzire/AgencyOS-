import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SecurityModule } from './modules/security/security.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FilesModule } from './modules/files/files.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SalesModule } from './modules/sales/sales.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AutomationModule } from './modules/automation/automation.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { AiModule } from './modules/ai/ai.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttler.ttlMs', 60_000),
          limit: configService.get<number>('throttler.limit', 100),
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    RbacModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    SalesModule,
    FinanceModule,
    DashboardModule,
    ReportsModule,
    SettingsModule,
    SecurityModule,
    AuditModule,
    NotificationsModule,
    ActivitiesModule,
    CommentsModule,
    FilesModule,
    TimeEntriesModule,
    WorkflowsModule,
    AutomationModule,
    AiModule,
    IntegrationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
