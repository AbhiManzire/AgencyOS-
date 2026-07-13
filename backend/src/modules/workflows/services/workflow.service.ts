import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { WorkflowExecutionRecord } from '../../automation/automation.types';
import { AutomationEngineService } from '../../automation/services/automation-engine.service';
import { resolveActionDueAt } from '../../automation/services/workflow-event-dispatcher.service';
import { WorkflowRunnerService } from '../../automation/services/workflow-runner.service';
import { WorkflowDomainService } from '../domain/workflow-domain.service';
import { WORKFLOW_DOMAIN_ERROR_CODES, WorkflowDomainError } from '../domain/workflow-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WORKFLOW_REPOSITORY,
  type CreateWorkflowActionData,
  type CreateWorkflowConditionData,
  type CreateWorkflowData,
  type CreateWorkflowTriggerData,
  type UpdateWorkflowData,
  type WorkflowRepository,
  type WorkflowScope,
} from '../repositories/workflow.repository.interface';
import type {
  CreateWorkflowCommand,
  ExecuteWorkflowCommand,
  ListWorkflowsQuery,
  ListWorkflowsResult,
  UpdateWorkflowCommand,
  WorkflowApplicationContext,
  WorkflowRecord,
} from './workflow-application.types';

@Injectable()
export class WorkflowService {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowDomainService: WorkflowDomainService,
    private readonly prisma: PrismaService,
    private readonly automationEngineService: AutomationEngineService,
    private readonly workflowRunnerService: WorkflowRunnerService,
  ) {}

  async createWorkflow(
    scope: WorkflowScope,
    command: CreateWorkflowCommand,
    context: WorkflowApplicationContext,
  ): Promise<WorkflowRecord> {
    this.workflowDomainService.validateCreate({
      name: command.name,
      status: command.status,
      triggers: command.triggers,
      actions: command.actions,
      conditions: command.conditions,
    });

    const now = new Date();
    const workflowId = randomUUID();

    const data: CreateWorkflowData = {
      id: workflowId,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      name: this.workflowDomainService.normalizeName(command.name),
      description: this.workflowDomainService.normalizeOptionalDescription(command.description),
      status: command.status ?? 'ACTIVE',
      isEnabled: command.isEnabled ?? true,
      triggers: this.mapTriggers(scope, workflowId, command.triggers, now),
      actions: this.mapActions(scope, workflowId, command.actions, now),
      conditions: this.mapConditions(scope, workflowId, command.conditions ?? [], now),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.workflowRepository.create(data));
  }

  async updateWorkflow(
    scope: WorkflowScope,
    workflowId: string,
    command: UpdateWorkflowCommand,
    context: WorkflowApplicationContext,
  ): Promise<WorkflowRecord> {
    const existing = await this.requireWorkflow(scope, workflowId);
    this.workflowDomainService.assertWorkflowIsActive(existing);
    this.workflowDomainService.validateUpdate({
      name: command.name,
      status: command.status,
      triggers: command.triggers,
      actions: command.actions,
      conditions: command.conditions,
    });

    const now = new Date();
    const data: UpdateWorkflowData = {
      ...(command.name !== undefined
        ? { name: this.workflowDomainService.normalizeName(command.name) }
        : {}),
      ...(command.description !== undefined
        ? {
            description: this.workflowDomainService.normalizeOptionalDescription(
              command.description,
            ),
          }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.isEnabled !== undefined ? { isEnabled: command.isEnabled } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
      ...(command.triggers !== undefined
        ? { triggers: this.mapTriggers(scope, workflowId, command.triggers, now) }
        : {}),
      ...(command.actions !== undefined
        ? { actions: this.mapActions(scope, workflowId, command.actions, now) }
        : {}),
      ...(command.conditions !== undefined
        ? { conditions: this.mapConditions(scope, workflowId, command.conditions, now) }
        : {}),
    };

    const updated = await this.runInTransaction(() =>
      this.workflowRepository.update(scope, workflowId, data),
    );

    if (updated === null) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.WORKFLOW_NOT_FOUND,
        'Workflow was not found.',
      );
    }

    return updated;
  }

  async enableWorkflow(
    scope: WorkflowScope,
    workflowId: string,
    context: WorkflowApplicationContext,
  ): Promise<WorkflowRecord> {
    return this.updateWorkflow(scope, workflowId, { isEnabled: true, status: 'ACTIVE' }, context);
  }

  async disableWorkflow(
    scope: WorkflowScope,
    workflowId: string,
    context: WorkflowApplicationContext,
  ): Promise<WorkflowRecord> {
    return this.updateWorkflow(
      scope,
      workflowId,
      { isEnabled: false, status: 'INACTIVE' },
      context,
    );
  }

  async archiveWorkflow(
    scope: WorkflowScope,
    workflowId: string,
    context: WorkflowApplicationContext,
  ): Promise<WorkflowRecord> {
    const existing = await this.requireWorkflow(scope, workflowId);
    this.workflowDomainService.assertWorkflowIsActive(existing);

    const now = new Date();
    const archived = await this.runInTransaction(() =>
      this.workflowRepository.softDelete(scope, workflowId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
        status: 'INACTIVE',
        isEnabled: false,
      }),
    );

    if (archived === null) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.WORKFLOW_NOT_FOUND,
        'Workflow was not found.',
      );
    }

    return archived;
  }

  async executeWorkflow(
    scope: WorkflowScope,
    workflowId: string,
    command: ExecuteWorkflowCommand,
    context: WorkflowApplicationContext,
  ): Promise<WorkflowExecutionRecord> {
    const workflow = await this.requireWorkflow(scope, workflowId);
    const now = new Date();
    const firstAction = workflow.actions.length > 0 ? workflow.actions[0] : undefined;
    const scheduledFor =
      firstAction !== undefined
        ? resolveActionDueAt(
            firstAction.delayType,
            firstAction.delayValue,
            firstAction.delayUntil,
            now,
          )
        : null;
    const isImmediate = scheduledFor === null || scheduledFor.getTime() <= now.getTime();

    const execution = await this.automationEngineService.enqueueExecution(scope, {
      workflowId,
      triggerType: 'CUSTOM_EVENT',
      triggerPayload: {
        eventKey: 'MANUAL_EXECUTE',
        ...(command.payload ?? {}),
      },
      triggeredByUserId: context.actorUserId || null,
      scheduledFor: isImmediate ? null : scheduledFor,
    });

    if (isImmediate) {
      void this.workflowRunnerService.runExecution(scope, execution.id).catch(() => undefined);
    }

    return execution;
  }

  async listWorkflowExecutions(
    scope: WorkflowScope,
    workflowId: string,
    query: { skip?: number; take?: number } = {},
  ) {
    await this.requireWorkflow(scope, workflowId);
    return this.automationEngineService.listExecutions(scope, {
      workflowId,
      skip: query.skip,
      take: query.take,
    });
  }

  async getWorkflow(scope: WorkflowScope, workflowId: string): Promise<WorkflowRecord> {
    return this.requireWorkflow(scope, workflowId);
  }

  async listWorkflows(
    scope: WorkflowScope,
    query: ListWorkflowsQuery = {},
  ): Promise<ListWorkflowsResult> {
    return this.workflowRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      status: query.status,
    });
  }

  private mapTriggers(
    scope: WorkflowScope,
    workflowId: string,
    triggers: CreateWorkflowCommand['triggers'],
    now: Date,
  ): CreateWorkflowTriggerData[] {
    return triggers.map((trigger, index) => ({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      workflowId,
      type: trigger.type,
      config: trigger.config ?? {},
      sortOrder: trigger.sortOrder ?? index,
      createdAt: now,
      updatedAt: now,
    }));
  }

  private mapActions(
    scope: WorkflowScope,
    workflowId: string,
    actions: CreateWorkflowCommand['actions'],
    now: Date,
  ): CreateWorkflowActionData[] {
    return actions.map((action, index) => ({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      workflowId,
      type: action.type,
      config: action.config ?? {},
      sortOrder: action.sortOrder ?? index,
      maxRetries: action.maxRetries ?? 0,
      retryDelayMs: action.retryDelayMs ?? 1000,
      delayType: action.delayType ?? 'IMMEDIATE',
      delayValue: action.delayValue ?? null,
      delayUntil: action.delayUntil ?? null,
      createdAt: now,
      updatedAt: now,
    }));
  }

  private mapConditions(
    scope: WorkflowScope,
    workflowId: string,
    conditions: NonNullable<CreateWorkflowCommand['conditions']>,
    now: Date,
  ): CreateWorkflowConditionData[] {
    return conditions.map((condition, index) => ({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      workflowId,
      parentId: condition.parentId ?? null,
      clientKey: condition.key,
      clientParentKey: condition.parentKey ?? null,
      nodeType: condition.nodeType ?? 'CONDITION',
      logic: condition.logic ?? 'AND',
      field: condition.field ?? null,
      operator: condition.operator ?? null,
      value: condition.value ?? null,
      sortOrder: condition.sortOrder ?? index,
      createdAt: now,
      updatedAt: now,
    }));
  }

  private async requireWorkflow(scope: WorkflowScope, workflowId: string): Promise<WorkflowRecord> {
    const workflow = await this.workflowRepository.findById(scope, workflowId);

    if (workflow === null) {
      throw new WorkflowDomainError(
        WORKFLOW_DOMAIN_ERROR_CODES.WORKFLOW_NOT_FOUND,
        'Workflow was not found.',
      );
    }

    return workflow;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}
