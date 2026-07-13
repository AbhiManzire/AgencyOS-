import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AutomationScope } from '../automation.types';
import { ActionExecutorService } from './action-executor.service';
import { AutomationEngineService } from './automation-engine.service';
import { resolveActionDueAt } from './workflow-event-dispatcher.service';

@Injectable()
export class WorkflowRunnerService {
  private readonly logger = new Logger(WorkflowRunnerService.name);
  private readonly running = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationEngine: AutomationEngineService,
    private readonly actionExecutor: ActionExecutorService,
  ) {}

  async runExecution(scope: AutomationScope, executionId: string): Promise<void> {
    if (this.running.has(executionId)) {
      return;
    }

    this.running.add(executionId);
    const startedAt = Date.now();

    try {
      const execution = await this.automationEngine.startExecution(scope, executionId);
      const payload = asPayload(execution.triggerPayload);

      const actions = await this.prisma.workflowAction.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          workflowId: execution.workflowId,
        },
        orderBy: { sortOrder: 'asc' },
      });

      const results: Record<string, unknown>[] = [];
      const now = new Date();

      for (const action of actions) {
        const dueAt = resolveActionDueAt(
          action.delayType,
          action.delayValue,
          action.delayUntil,
          execution.startedAt ?? now,
        );

        if (dueAt !== null && dueAt.getTime() > Date.now()) {
          await this.automationEngine.deferExecution(
            scope,
            executionId,
            dueAt,
            `Action ${action.type} delayed until ${dueAt.toISOString()}`,
          );
          return;
        }

        const stepStarted = Date.now();
        try {
          const result = await this.actionExecutor.execute({
            scope,
            executionId,
            action,
            payload,
            actorUserId: execution.triggeredByUserId,
            recordEntityType: execution.recordEntityType,
            recordEntityId: execution.recordEntityId,
          });

          const durationMs = Date.now() - stepStarted;
          await this.automationEngine.appendLog(scope, executionId, {
            level: 'INFO',
            stepKey: action.type,
            message: result.message,
            details: {
              actionId: action.id,
              durationMs,
              ...(result.details ?? {}),
            },
          });

          results.push({
            actionId: action.id,
            type: action.type,
            message: result.message,
            durationMs,
          });
        } catch (error) {
          const durationMs = Date.now() - stepStarted;
          const message = error instanceof Error ? error.message : String(error);

          await this.automationEngine.appendLog(scope, executionId, {
            level: 'ERROR',
            stepKey: action.type,
            message,
            details: {
              actionId: action.id,
              durationMs,
            },
          });

          await this.automationEngine.scheduleRetry(scope, executionId, message);
          return;
        }
      }

      const durationMs = Date.now() - startedAt;
      await this.automationEngine.completeExecution(scope, executionId, 'SUCCEEDED', {
        durationMs,
        result: {
          actionsCompleted: results.length,
          steps: results,
        },
      });

      await this.automationEngine.appendLog(scope, executionId, {
        level: 'INFO',
        stepKey: 'complete',
        message: `Execution succeeded in ${String(durationMs)}ms`,
        details: { actionsCompleted: results.length },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Execution ${executionId} failed`,
        error instanceof Error ? error.stack : String(error),
      );

      try {
        await this.automationEngine.appendLog(scope, executionId, {
          level: 'ERROR',
          stepKey: 'runner',
          message,
        });
        await this.automationEngine.scheduleRetry(scope, executionId, message);
      } catch (retryError) {
        this.logger.error(
          `Failed to schedule retry for ${executionId}`,
          retryError instanceof Error ? retryError.stack : String(retryError),
        );
      }
    } finally {
      this.running.delete(executionId);
    }
  }
}

function asPayload(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
}
