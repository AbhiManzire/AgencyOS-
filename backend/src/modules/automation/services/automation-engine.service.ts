import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AppendLogInput,
  AutomationScope,
  EnqueueExecutionInput,
  ListExecutionsQuery,
  ListExecutionsResult,
  TerminalExecutionStatus,
  WorkflowExecutionLogRecord,
  WorkflowExecutionRecord,
  WorkflowExecutionWithLogsRecord,
  WorkflowScheduleRecord,
} from '../automation.types';
import { DEFAULT_MAX_ATTEMPTS, DEFAULT_RETRY_DELAY_MS } from '../automation.types';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import { RetryPolicyService } from './retry-policy.service';

const STARTABLE_STATUSES = new Set(['PENDING', 'RETRYING']);

@Injectable()
export class AutomationEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
    private readonly retryPolicy: RetryPolicyService,
  ) {}

  async enqueueExecution(
    scope: AutomationScope,
    input: EnqueueExecutionInput,
  ): Promise<WorkflowExecutionRecord> {
    await this.requireWorkflow(scope, input.workflowId);

    const executionId = randomUUID();
    const now = new Date();
    const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

    const execution = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workflowExecution.create({
        data: {
          id: executionId,
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          workflowId: input.workflowId,
          status: 'PENDING',
          triggerType: input.triggerType ?? null,
          triggerPayload:
            input.triggerPayload === undefined
              ? undefined
              : (input.triggerPayload as Prisma.InputJsonValue),
          attempt: 0,
          maxAttempts,
          triggeredByUserId: input.triggeredByUserId ?? null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.workflowExecutionLog.create({
        data: {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          executionId,
          level: 'INFO',
          message: 'Execution enqueued.',
          details: {
            triggerType: input.triggerType ?? null,
            workflowId: input.workflowId,
          },
          occurredAt: now,
          createdAt: now,
        },
      });

      return created;
    });

    return this.toExecutionRecord(execution);
  }

  async startExecution(
    scope: AutomationScope,
    executionId: string,
  ): Promise<WorkflowExecutionRecord> {
    const execution = await this.requireExecution(scope, executionId);

    if (!STARTABLE_STATUSES.has(execution.status)) {
      throw new BadRequestException(`Execution cannot be started from status ${execution.status}.`);
    }

    const now = new Date();

    const updated = await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'RUNNING',
        startedAt: now,
        nextRetryAt: null,
        updatedAt: now,
      },
    });

    return this.toExecutionRecord(updated);
  }

  async completeExecution(
    scope: AutomationScope,
    executionId: string,
    status: TerminalExecutionStatus,
    errorMessage?: string,
  ): Promise<WorkflowExecutionRecord> {
    await this.requireExecution(scope, executionId);

    const now = new Date();

    const updated = await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        finishedAt: now,
        errorMessage: errorMessage ?? null,
        nextRetryAt: null,
        updatedAt: now,
      },
    });

    return this.toExecutionRecord(updated);
  }

  async scheduleRetry(
    scope: AutomationScope,
    executionId: string,
  ): Promise<WorkflowExecutionRecord> {
    const execution = await this.requireExecution(scope, executionId);

    if (!this.retryPolicy.shouldRetry(execution.attempt, execution.maxAttempts)) {
      return this.completeExecution(
        scope,
        executionId,
        'FAILED',
        'Maximum retry attempts exceeded.',
      );
    }

    const retryDelayMs = await this.resolveRetryDelayMs(scope, execution.workflowId);
    const nextRetryAt = this.retryPolicy.computeNextRetryAt(execution.attempt, retryDelayMs);
    const now = new Date();
    const nextAttempt = execution.attempt + 1;

    const updated = await this.prisma.$transaction(async (tx) => {
      const record = await tx.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'RETRYING',
          attempt: nextAttempt,
          nextRetryAt,
          updatedAt: now,
        },
      });

      await tx.workflowExecutionLog.create({
        data: {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          executionId,
          level: 'WARN',
          message: 'Execution scheduled for retry.',
          details: {
            attempt: nextAttempt,
            nextRetryAt: nextRetryAt.toISOString(),
            retryDelayMs,
          },
          occurredAt: now,
          createdAt: now,
        },
      });

      return record;
    });

    return this.toExecutionRecord(updated);
  }

  async appendLog(
    scope: AutomationScope,
    executionId: string,
    input: AppendLogInput,
  ): Promise<WorkflowExecutionLogRecord> {
    await this.requireExecution(scope, executionId);

    const now = new Date();

    const log = await this.prisma.workflowExecutionLog.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        executionId,
        level: input.level,
        stepKey: input.stepKey ?? null,
        message: input.message,
        details: input.details === undefined ? undefined : (input.details as Prisma.InputJsonValue),
        occurredAt: now,
        createdAt: now,
      },
    });

    return this.toLogRecord(log);
  }

  async listExecutions(
    scope: AutomationScope,
    query: ListExecutionsQuery = {},
  ): Promise<ListExecutionsResult> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 25;

    const where: Prisma.WorkflowExecutionWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(query.workflowId !== undefined ? { workflowId: query.workflowId } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workflowExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.workflowExecution.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toExecutionRecord(item)),
      total,
    };
  }

  async getExecution(
    scope: AutomationScope,
    executionId: string,
  ): Promise<WorkflowExecutionWithLogsRecord> {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: {
        id: executionId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
      include: {
        logs: {
          orderBy: { occurredAt: 'asc' },
        },
      },
    });

    if (execution === null) {
      throw new NotFoundException('Workflow execution was not found.');
    }

    return {
      ...this.toExecutionRecord(execution),
      logs: execution.logs.map((log) => this.toLogRecord(log)),
    };
  }

  async evaluateWorkflowConditions(
    scope: AutomationScope,
    workflowId: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    await this.requireWorkflow(scope, workflowId);

    const conditions = await this.prisma.workflowCondition.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        workflowId,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return this.conditionEvaluator.evaluateAll(
      conditions.map((condition) => ({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
      })),
      payload,
    );
  }

  async listDueSchedules(
    scope: AutomationScope,
    now: Date,
  ): Promise<readonly WorkflowScheduleRecord[]> {
    const schedules = await this.prisma.workflowSchedule.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        isActive: true,
        deletedAt: null,
        nextRunAt: {
          lte: now,
        },
      },
      orderBy: { nextRunAt: 'asc' },
    });

    return schedules.map((schedule) => this.toScheduleRecord(schedule));
  }

  private async requireWorkflow(scope: AutomationScope, workflowId: string): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (workflow === null) {
      throw new NotFoundException('Workflow was not found.');
    }
  }

  private async requireExecution(
    scope: AutomationScope,
    executionId: string,
  ): Promise<WorkflowExecutionRecord> {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: {
        id: executionId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    if (execution === null) {
      throw new NotFoundException('Workflow execution was not found.');
    }

    return this.toExecutionRecord(execution);
  }

  private async resolveRetryDelayMs(scope: AutomationScope, workflowId: string): Promise<number> {
    const action = await this.prisma.workflowAction.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        workflowId,
      },
      orderBy: { sortOrder: 'asc' },
      select: { retryDelayMs: true },
    });

    return action?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  }

  private toExecutionRecord(
    execution: Prisma.WorkflowExecutionGetPayload<object>,
  ): WorkflowExecutionRecord {
    return {
      id: execution.id,
      tenantId: execution.tenantId,
      workspaceId: execution.workspaceId,
      workflowId: execution.workflowId,
      status: execution.status,
      triggerType: execution.triggerType,
      triggerPayload: execution.triggerPayload,
      attempt: execution.attempt,
      maxAttempts: execution.maxAttempts,
      nextRetryAt: execution.nextRetryAt,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      errorMessage: execution.errorMessage,
      triggeredByUserId: execution.triggeredByUserId,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  }

  private toLogRecord(
    log: Prisma.WorkflowExecutionLogGetPayload<object>,
  ): WorkflowExecutionLogRecord {
    return {
      id: log.id,
      tenantId: log.tenantId,
      workspaceId: log.workspaceId,
      executionId: log.executionId,
      level: log.level,
      stepKey: log.stepKey,
      message: log.message,
      details: log.details,
      occurredAt: log.occurredAt,
      createdAt: log.createdAt,
    };
  }

  private toScheduleRecord(
    schedule: Prisma.WorkflowScheduleGetPayload<object>,
  ): WorkflowScheduleRecord {
    return {
      id: schedule.id,
      tenantId: schedule.tenantId,
      workspaceId: schedule.workspaceId,
      workflowId: schedule.workflowId,
      frequency: schedule.frequency,
      cronExpression: schedule.cronExpression,
      timezone: schedule.timezone,
      nextRunAt: schedule.nextRunAt,
      lastRunAt: schedule.lastRunAt,
      isActive: schedule.isActive,
      config: schedule.config,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      deletedAt: schedule.deletedAt,
    };
  }
}
