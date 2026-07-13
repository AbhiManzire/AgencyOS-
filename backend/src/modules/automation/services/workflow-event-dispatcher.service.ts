import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Prisma, WorkflowActionDelayType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AutomationScope, WorkflowDispatchInput } from '../automation.types';
import { AutomationEngineService } from './automation-engine.service';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import type { WorkflowRunnerService } from './workflow-runner.service';

@Injectable()
export class WorkflowEventDispatcher {
  private readonly logger = new Logger(WorkflowEventDispatcher.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
    private readonly automationEngine: AutomationEngineService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async dispatch(input: WorkflowDispatchInput): Promise<void> {
    const triggerType = input.triggerType;
    const now = new Date();

    const workflows = await this.prisma.workflow.findMany({
      where: {
        tenantId: input.scope.tenantId,
        workspaceId: input.scope.workspaceId,
        status: 'ACTIVE',
        isEnabled: true,
        deletedAt: null,
        triggers: {
          some: {
            type: triggerType,
          },
        },
      },
      include: {
        triggers: {
          where: { type: triggerType },
          orderBy: { sortOrder: 'asc' },
        },
        conditions: {
          orderBy: { sortOrder: 'asc' },
        },
        actions: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });

    for (const workflow of workflows) {
      try {
        if (triggerType === 'CUSTOM_EVENT') {
          const matchesCustom = workflow.triggers.some((trigger) => {
            const config = asRecord(trigger.config);
            const eventKey = typeof config.eventKey === 'string' ? config.eventKey : null;
            return eventKey !== null && eventKey === input.customEventKey;
          });

          if (!matchesCustom) {
            continue;
          }
        }

        const conditionsPass = this.conditionEvaluator.evaluateTree(
          workflow.conditions.map((condition) => ({
            id: condition.id,
            parentId: condition.parentId,
            nodeType: condition.nodeType,
            logic: condition.logic,
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            sortOrder: condition.sortOrder,
          })),
          input.payload,
        );

        if (!conditionsPass) {
          const skipped = await this.automationEngine.enqueueExecution(input.scope, {
            workflowId: workflow.id,
            triggerType,
            triggerPayload: input.payload,
            triggeredByUserId: input.actorUserId ?? null,
            recordEntityType: input.entityType ?? null,
            recordEntityId: input.entityId ?? null,
          });

          await this.automationEngine.completeExecution(input.scope, skipped.id, 'SKIPPED', {
            errorMessage: 'Workflow conditions were not met.',
          });
          await this.automationEngine.appendLog(input.scope, skipped.id, {
            level: 'INFO',
            stepKey: 'conditions',
            message: 'Execution SKIPPED — conditions failed.',
          });

          this.logger.log(
            `Workflow ${workflow.id} skipped for trigger ${triggerType}: conditions failed`,
          );
          continue;
        }

        let scheduledFor: Date | null = null;
        if (workflow.actions.length > 0) {
          const firstAction = workflow.actions[0];
          scheduledFor = resolveActionDueAt(
            firstAction.delayType,
            firstAction.delayValue,
            firstAction.delayUntil,
            now,
          );
        }
        const isImmediate = scheduledFor === null || scheduledFor.getTime() <= now.getTime();

        const execution = await this.automationEngine.enqueueExecution(input.scope, {
          workflowId: workflow.id,
          triggerType,
          triggerPayload: input.payload,
          triggeredByUserId: input.actorUserId ?? null,
          recordEntityType: input.entityType ?? null,
          recordEntityId: input.entityId ?? null,
          scheduledFor: isImmediate ? null : scheduledFor,
        });

        if (isImmediate) {
          this.kickOffExecution(input.scope, execution.id);
        }
      } catch (error) {
        this.logger.error(
          `Failed to dispatch workflow ${workflow.id} for ${triggerType}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private kickOffExecution(scope: AutomationScope, executionId: string): void {
    void Promise.resolve()
      .then(async () => {
        let runner: WorkflowRunnerService | undefined;
        try {
          // Lazy resolve avoids circular provider graphs between dispatcher and runner.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { WorkflowRunnerService: Runner } = require('./workflow-runner.service') as {
            WorkflowRunnerService: new (...args: never[]) => WorkflowRunnerService;
          };
          runner = this.moduleRef.get(Runner, { strict: false });
        } catch {
          runner = undefined;
        }

        if (runner === undefined) {
          this.logger.warn(
            `WorkflowRunnerService unavailable; execution ${executionId} remains PENDING`,
          );
          return;
        }
        await runner.runExecution(scope, executionId);
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Fire-and-forget run failed for execution ${executionId}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }
}

export function resolveActionDueAt(
  delayType: WorkflowActionDelayType,
  delayValue: number | null | undefined,
  delayUntil: Date | null | undefined,
  from: Date = new Date(),
): Date | null {
  switch (delayType) {
    case 'IMMEDIATE':
      return null;
    case 'MINUTES':
      return new Date(from.getTime() + Math.max(0, delayValue ?? 0) * 60_000);
    case 'HOURS':
      return new Date(from.getTime() + Math.max(0, delayValue ?? 0) * 3_600_000);
    case 'DAYS':
      return new Date(from.getTime() + Math.max(0, delayValue ?? 0) * 86_400_000);
    case 'SPECIFIC_DATE':
      return delayUntil ?? null;
    case 'RECURRING':
      return (
        delayUntil ?? (delayValue != null ? new Date(from.getTime() + delayValue * 60_000) : null)
      );
    default:
      return null;
  }
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}
