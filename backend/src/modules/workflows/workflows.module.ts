import { Module } from '@nestjs/common';
import { AutomationModule } from '../automation/automation.module';
import { WorkflowsController } from './controllers/workflows.controller';
import { WorkflowDomainService } from './domain/workflow-domain.service';
import { WORKFLOW_REPOSITORY } from './repositories/workflow.repository.interface';
import { PrismaWorkflowRepository } from './repositories/prisma-workflow.repository';
import { WorkflowService } from './services/workflow.service';

@Module({
  imports: [AutomationModule],
  providers: [
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: PrismaWorkflowRepository,
    },
    WorkflowDomainService,
    WorkflowService,
  ],
  controllers: [WorkflowsController],
  exports: [WORKFLOW_REPOSITORY, WorkflowDomainService, WorkflowService],
})
export class WorkflowsModule {}
