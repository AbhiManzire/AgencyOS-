import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Workflow,
  type WorkflowAction,
  type WorkflowCondition,
  type WorkflowTrigger,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateWorkflowConditionData,
  CreateWorkflowData,
  ListWorkflowsParams,
  ListWorkflowsResult,
  SoftDeleteWorkflowData,
  UpdateWorkflowData,
  WorkflowActionRecord,
  WorkflowConditionRecord,
  WorkflowRecord,
  WorkflowRepository,
  WorkflowScope,
  WorkflowTriggerRecord,
} from './workflow.repository.interface';

type WorkflowWithRelations = Workflow & {
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
};

@Injectable()
export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateWorkflowData): Promise<WorkflowRecord> {
    const conditionCreates = resolveConditionCreates(data.conditions ?? []);

    const workflow = await this.prisma.workflow.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
        status: data.status ?? 'ACTIVE',
        isEnabled: data.isEnabled ?? true,
        version: 1,
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
            config: trigger.config ?? {},
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
            maxRetries: action.maxRetries ?? 0,
            retryDelayMs: action.retryDelayMs ?? 1000,
            delayType: action.delayType ?? 'IMMEDIATE',
            delayValue: action.delayValue ?? null,
            delayUntil: action.delayUntil ?? null,
            createdAt: action.createdAt,
            updatedAt: action.updatedAt,
          })),
        },
        conditions: {
          create: conditionCreates,
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

  async update(
    scope: WorkflowScope,
    id: string,
    data: UpdateWorkflowData,
  ): Promise<WorkflowRecord | null> {
    const existing = await this.prisma.workflow.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: { id: true, version: true },
    });

    if (existing === null) {
      return null;
    }

    await this.prisma.$transaction(async (tx) => {
      if (data.triggers !== undefined) {
        await tx.workflowTrigger.deleteMany({ where: { workflowId: id } });
        if (data.triggers.length > 0) {
          await tx.workflowTrigger.createMany({
            data: data.triggers.map((trigger) => ({
              id: trigger.id,
              tenantId: trigger.tenantId,
              workspaceId: trigger.workspaceId,
              workflowId: id,
              type: trigger.type,
              config: trigger.config ?? {},
              sortOrder: trigger.sortOrder,
              createdAt: trigger.createdAt,
              updatedAt: trigger.updatedAt,
            })),
          });
        }
      }

      if (data.actions !== undefined) {
        await tx.workflowAction.deleteMany({ where: { workflowId: id } });
        if (data.actions.length > 0) {
          await tx.workflowAction.createMany({
            data: data.actions.map((action) => ({
              id: action.id,
              tenantId: action.tenantId,
              workspaceId: action.workspaceId,
              workflowId: id,
              type: action.type,
              config: action.config ?? {},
              sortOrder: action.sortOrder,
              maxRetries: action.maxRetries ?? 0,
              retryDelayMs: action.retryDelayMs ?? 1000,
              delayType: action.delayType ?? 'IMMEDIATE',
              delayValue: action.delayValue ?? null,
              delayUntil: action.delayUntil ?? null,
              createdAt: action.createdAt,
              updatedAt: action.updatedAt,
            })),
          });
        }
      }

      if (data.conditions !== undefined) {
        await tx.workflowCondition.deleteMany({ where: { workflowId: id } });
        const conditionCreates = resolveConditionCreates(data.conditions);
        if (conditionCreates.length > 0) {
          await tx.workflowCondition.createMany({
            data: conditionCreates.map((condition) => ({
              ...condition,
              workflowId: id,
            })),
          });
        }
      }

      await tx.workflow.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.isEnabled !== undefined ? { isEnabled: data.isEnabled } : {}),
          version: data.version ?? existing.version + 1,
          updatedAt: data.updatedAt,
          updatedByUserId: data.updatedByUserId ?? null,
        },
      });
    });

    return this.findById(scope, id);
  }

  async softDelete(
    scope: WorkflowScope,
    id: string,
    data: SoftDeleteWorkflowData,
  ): Promise<WorkflowRecord | null> {
    const existing = await this.findById(scope, id);
    if (existing === null) {
      return null;
    }

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
        status: data.status,
        isEnabled: data.isEnabled,
      },
      include: workflowInclude,
    });

    return toWorkflowRecord(workflow);
  }
}

const workflowInclude = {
  triggers: { orderBy: { sortOrder: 'asc' as const } },
  actions: { orderBy: { sortOrder: 'asc' as const } },
  conditions: { orderBy: { sortOrder: 'asc' as const } },
};

function resolveConditionCreates(conditions: readonly CreateWorkflowConditionData[]): {
  id: string;
  tenantId: string;
  workspaceId: string;
  parentId: string | null;
  nodeType: 'CONDITION' | 'GROUP';
  logic: 'AND' | 'OR';
  field: string | null;
  operator: CreateWorkflowConditionData['operator'];
  value: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}[] {
  const idByClientKey = new Map<string, string>();

  for (const condition of conditions) {
    if (condition.clientKey) {
      idByClientKey.set(condition.clientKey, condition.id);
    }
  }

  return conditions.map((condition) => {
    let parentId = condition.parentId ?? null;
    if (
      parentId === null &&
      condition.clientParentKey !== undefined &&
      condition.clientParentKey !== null
    ) {
      parentId = idByClientKey.get(condition.clientParentKey) ?? null;
    }

    return {
      id: condition.id,
      tenantId: condition.tenantId,
      workspaceId: condition.workspaceId,
      parentId,
      nodeType: condition.nodeType ?? 'CONDITION',
      logic: condition.logic ?? 'AND',
      field: condition.field ?? null,
      operator: condition.operator ?? null,
      value: condition.value === undefined ? undefined : (condition.value ?? Prisma.JsonNull),
      sortOrder: condition.sortOrder,
      createdAt: condition.createdAt,
      updatedAt: condition.updatedAt,
    };
  });
}

function toWorkflowRecord(workflow: WorkflowWithRelations): WorkflowRecord {
  return {
    id: workflow.id,
    tenantId: workflow.tenantId,
    workspaceId: workflow.workspaceId,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    version: workflow.version,
    isEnabled: workflow.isEnabled,
    triggers: workflow.triggers.map(toWorkflowTriggerRecord),
    actions: workflow.actions.map(toWorkflowActionRecord),
    conditions: workflow.conditions.map(toWorkflowConditionRecord),
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
    config: trigger.config,
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
    maxRetries: action.maxRetries,
    retryDelayMs: action.retryDelayMs,
    delayType: action.delayType,
    delayValue: action.delayValue,
    delayUntil: action.delayUntil,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  };
}

function toWorkflowConditionRecord(condition: WorkflowCondition): WorkflowConditionRecord {
  return {
    id: condition.id,
    tenantId: condition.tenantId,
    workspaceId: condition.workspaceId,
    workflowId: condition.workflowId,
    parentId: condition.parentId,
    nodeType: condition.nodeType,
    logic: condition.logic,
    field: condition.field,
    operator: condition.operator,
    value: condition.value,
    sortOrder: condition.sortOrder,
    createdAt: condition.createdAt,
    updatedAt: condition.updatedAt,
  };
}
