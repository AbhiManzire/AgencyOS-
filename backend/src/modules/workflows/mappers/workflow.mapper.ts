import type { Prisma } from '@prisma/client';
import type {
  CreateWorkflowCommand,
  ExecuteWorkflowCommand,
  ListWorkflowsQuery,
  UpdateWorkflowCommand,
} from '../services/workflow-application.types';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { ExecuteWorkflowDto } from '../dto/execute-workflow.dto';
import { ListWorkflowsQueryDto } from '../dto/list-workflows-query.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';

export const WorkflowMapper = {
  toCreateWorkflowCommand(dto: CreateWorkflowDto): CreateWorkflowCommand {
    return {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      isEnabled: dto.isEnabled,
      triggers: dto.triggers.map((trigger) => ({
        type: trigger.type,
        config: trigger.config as Prisma.InputJsonValue | undefined,
        sortOrder: trigger.sortOrder,
      })),
      actions: dto.actions.map((action) => ({
        type: action.type,
        config: action.config as Prisma.InputJsonValue | undefined,
        sortOrder: action.sortOrder,
        maxRetries: action.maxRetries,
        retryDelayMs: action.retryDelayMs,
        delayType: action.delayType,
        delayValue: action.delayValue,
        delayUntil:
          action.delayUntil === undefined || action.delayUntil === null
            ? action.delayUntil
            : new Date(action.delayUntil),
      })),
      conditions: dto.conditions?.map((condition) => ({
        key: condition.key,
        parentKey: condition.parentKey,
        parentId: condition.parentId,
        nodeType: condition.nodeType,
        logic: condition.logic,
        field: condition.field,
        operator: condition.operator,
        value: condition.value as Prisma.InputJsonValue | null | undefined,
        sortOrder: condition.sortOrder,
      })),
    };
  },

  toUpdateWorkflowCommand(dto: UpdateWorkflowDto): UpdateWorkflowCommand {
    return {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      isEnabled: dto.isEnabled,
      triggers: dto.triggers?.map((trigger) => ({
        type: trigger.type,
        config: trigger.config as Prisma.InputJsonValue | undefined,
        sortOrder: trigger.sortOrder,
      })),
      actions: dto.actions?.map((action) => ({
        type: action.type,
        config: action.config as Prisma.InputJsonValue | undefined,
        sortOrder: action.sortOrder,
        maxRetries: action.maxRetries,
        retryDelayMs: action.retryDelayMs,
        delayType: action.delayType,
        delayValue: action.delayValue,
        delayUntil:
          action.delayUntil === undefined || action.delayUntil === null
            ? action.delayUntil
            : new Date(action.delayUntil),
      })),
      conditions: dto.conditions?.map((condition) => ({
        key: condition.key,
        parentKey: condition.parentKey,
        parentId: condition.parentId,
        nodeType: condition.nodeType,
        logic: condition.logic,
        field: condition.field,
        operator: condition.operator,
        value: condition.value as Prisma.InputJsonValue | null | undefined,
        sortOrder: condition.sortOrder,
      })),
    };
  },

  toExecuteWorkflowCommand(dto: ExecuteWorkflowDto): ExecuteWorkflowCommand {
    return {
      payload: dto.payload,
    };
  },

  toListWorkflowsQuery(dto: ListWorkflowsQueryDto): ListWorkflowsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      status: dto.status,
    };
  },
};
