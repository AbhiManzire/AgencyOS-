import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AutomationExecutionsController } from './controllers/automation-executions.controller';
import { ActionExecutorService } from './services/action-executor.service';
import { AutomationSchedulerService } from './services/automation-scheduler.service';
import { WorkflowRunnerService } from './services/workflow-runner.service';
import { WorkflowEventsModule } from './workflow-events.module';

@Module({
  imports: [WorkflowEventsModule, ActivitiesModule, NotificationsModule],
  providers: [ActionExecutorService, WorkflowRunnerService, AutomationSchedulerService],
  controllers: [AutomationExecutionsController],
  exports: [WorkflowEventsModule, WorkflowRunnerService],
})
export class AutomationModule {}
