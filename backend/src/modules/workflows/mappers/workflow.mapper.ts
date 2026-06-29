import type { Prisma } from '@prisma/client';
import type { CreateWorkflowCommand } from '../services/workflow-application.types';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { ListWorkflowsQueryDto } from '../dto/list-workflows-query.dto';
import type { ListWorkflowsQuery } from '../services/workflow-application.types';

export const WorkflowMapper = {
  toCreateWorkflowCommand(dto: CreateWorkflowDto): CreateWorkflowCommand {
    return {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      triggers: dto.triggers.map((trigger) => ({
        type: trigger.type,
        sortOrder: trigger.sortOrder,
      })),
      actions: dto.actions.map((action) => ({
        type: action.type,
        config: action.config as Prisma.InputJsonValue | undefined,
        sortOrder: action.sortOrder,
      })),
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
