import { Global, Module } from '@nestjs/common';
import { ConditionEvaluatorService } from './services/condition-evaluator.service';
import { RetryPolicyService } from './services/retry-policy.service';
import { AutomationEngineService } from './services/automation-engine.service';
import { WorkflowEventDispatcher } from './services/workflow-event-dispatcher.service';

/**
 * Thin module exporting only the event dispatcher so domain modules can emit
 * workflow events without importing the full automation runtime graph.
 */
@Global()
@Module({
  providers: [
    ConditionEvaluatorService,
    RetryPolicyService,
    AutomationEngineService,
    WorkflowEventDispatcher,
  ],
  exports: [WorkflowEventDispatcher, AutomationEngineService, ConditionEvaluatorService],
})
export class WorkflowEventsModule {}
