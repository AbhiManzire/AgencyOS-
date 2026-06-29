import { Injectable } from '@nestjs/common';
import { Prisma, type Workflow, type WorkflowAction, type WorkflowTrigger } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateWorkflowData,
  ListWorkflowsParams,
  ListWorkflowsResult,
  WorkflowActionRecord,
  WorkflowRecord,
  WorkflowRepository,
  WorkflowScope,
  WorkflowTriggerRecord,
} from './workflow.repository.interface';

type WorkflowWithRelations = Workflow & {
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
};

@Injectable()
export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWorkflowData): Promise<WorkflowRecord> {
    const workflow = await this.prisma.workflow.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
        status: data.status ?? 'ACTIVE',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
        triggers: {
          create: data.triggers.map((trigger) => ({
            id: trigger.id,
            tenantId: trigger.tenantId,
            workspaceId: trigger.workspaceId,
            type: trigger.type,
            sortOrder: trigger.sortOrder,
            createdAt: trigger.createdAt,
            updatedAt: trigger.updatedAt,
          })),
        },
        actions: {
          create: data.actions.map((action) => ({
            id: action.id,
            tenantId: action.tenantId,
            workspaceId: action.workspaceId,
            type: action.type,
            config: action.config ?? {},
            sortOrder: action.sortOrder,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
          })),
        },
      },
      include: workflowInclude,
    });

    return toWorkflowRecord(workflow);
  }

  async findById(scope: WorkflowScope, id: string): Promise<WorkflowRecord | null> {
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: workflowInclude,
    });

    return workflow ? toWorkflowRecord(workflow) : null;
  }

  async list(params: ListWorkflowsParams): Promise<ListWorkflowsResult> {
    const where: Prisma.WorkflowWhereInput = {
      tenantId: params.scope.tenantId,
      workspaceId: params.scope.workspaceId,
      deletedAt: null,
      ...(params.status !== undefined ? { status: params.status } : {}),
    };

    const [workflows, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        include: workflowInclude,
        orderBy: { updatedAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.workflow.count({ where }),
    ]);

    return {
      items: workflows.map(toWorkflowRecord),
      total,
    };
  }
}

const workflowInclude = {
  triggers: { orderBy: { sortOrder: 'asc' as const } },
  actions: { orderBy: { sortOrder: 'asc' as const } },
};

function toWorkflowRecord(workflow: WorkflowWithRelations): WorkflowRecord {
  return {
    id: workflow.id,
    tenantId: workflow.tenantId,
    workspaceId: workflow.workspaceId,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    triggers: workflow.triggers.map(toWorkflowTriggerRecord),
    actions: workflow.actions.map(toWorkflowActionRecord),
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
    createdByUserId: workflow.createdByUserId,
    updatedByUserId: workflow.updatedByUserId,
    deletedAt: workflow.deletedAt,
    deletedByUserId: workflow.deletedByUserId,
  };
}

function toWorkflowTriggerRecord(trigger: WorkflowTrigger): WorkflowTriggerRecord {
  return {
    id: trigger.id,
    tenantId: trigger.tenantId,
    workspaceId: trigger.workspaceId,
    workflowId: trigger.workflowId,
    type: trigger.type,
    sortOrder: trigger.sortOrder,
    createdAt: trigger.createdAt,
    updatedAt: trigger.updatedAt,
  };
}

function toWorkflowActionRecord(action: WorkflowAction): WorkflowActionRecord {
  return {
    id: action.id,
    tenantId: action.tenantId,
    workspaceId: action.workspaceId,
    workflowId: action.workflowId,
    type: action.type,
    config: action.config,
    sortOrder: action.sortOrder,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  };
}
