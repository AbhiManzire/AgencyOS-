import { Module } from '@nestjs/common';
import { AutomationExecutionsController } from './controllers/automation-executions.controller';
import { AutomationEngineService } from './services/automation-engine.service';
import { ConditionEvaluatorService } from './services/condition-evaluator.service';
import { RetryPolicyService } from './services/retry-policy.service';

@Module({
  providers: [ConditionEvaluatorService, RetryPolicyService, AutomationEngineService],
  controllers: [AutomationExecutionsController],
  exports: [AutomationEngineService],
})
export class AutomationModule {}
