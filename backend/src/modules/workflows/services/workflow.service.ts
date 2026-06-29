import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WorkflowDomainService } from '../domain/workflow-domain.service';
import { WORKFLOW_DOMAIN_ERROR_CODES, WorkflowDomainError } from '../domain/workflow-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WORKFLOW_REPOSITORY,
  type CreateWorkflowActionData,
  type CreateWorkflowData,
  type CreateWorkflowTriggerData,
  type WorkflowRepository,
  type WorkflowScope,
} from '../repositories/workflow.repository.interface';
import type {
  CreateWorkflowCommand,
  ListWorkflowsQuery,
  ListWorkflowsResult,
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
    });

    const now = new Date();
    const workflowId = randomUUID();

    const triggers: CreateWorkflowTriggerData[] = command.triggers.map((trigger, index) => ({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      workflowId,
      type: trigger.type,
      sortOrder: trigger.sortOrder ?? index,
      createdAt: now,
      updatedAt: now,
    }));

    const actions: CreateWorkflowActionData[] = command.actions.map((action, index) => ({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      workflowId,
      type: action.type,
      config: action.config ?? {},
      sortOrder: action.sortOrder ?? index,
      createdAt: now,
      updatedAt: now,
    }));

    const data: CreateWorkflowData = {
      id: workflowId,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      name: this.workflowDomainService.normalizeName(command.name),
      description: this.workflowDomainService.normalizeOptionalDescription(command.description),
      status: command.status ?? 'ACTIVE',
      triggers,
      actions,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.workflowRepository.create(data));
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
