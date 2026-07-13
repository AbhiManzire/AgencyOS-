import type {
  CreateSalesTaskCommand,
  ListSalesTasksQuery,
  ReassignSalesTaskCommand,
  RescheduleSalesTaskCommand,
  UpdateSalesTaskCommand,
} from '../services/sales-task-application.types';
import { CreateSalesTaskDto } from '../dto/create-sales-task.dto';
import { ListSalesTasksQueryDto } from '../dto/list-sales-tasks-query.dto';
import { ReassignSalesTaskDto } from '../dto/reassign-sales-task.dto';
import { RescheduleSalesTaskDto } from '../dto/reschedule-sales-task.dto';
import { UpdateSalesTaskDto } from '../dto/update-sales-task.dto';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const SalesTaskMapper = {
  toCreateSalesTaskCommand(dto: CreateSalesTaskDto): CreateSalesTaskCommand {
    return {
      type: dto.type,
      title: dto.title,
      description: dto.description,
      ownerUserId: dto.ownerUserId,
      dueDate: dto.dueDate,
      dueTime: dto.dueTime,
      priority: dto.priority,
      leadId: dto.leadId,
      dealId: dto.dealId,
      clientId: dto.clientId,
      metadata: dto.metadata,
    };
  },

  toUpdateSalesTaskCommand(dto: UpdateSalesTaskDto): UpdateSalesTaskCommand {
    return {
      type: dto.type,
      title: dto.title,
      description: dto.description,
      ownerUserId: dto.ownerUserId,
      dueDate: dto.dueDate,
      dueTime: dto.dueTime,
      priority: dto.priority,
      leadId: dto.leadId,
      dealId: dto.dealId,
      clientId: dto.clientId,
      status: dto.status,
      metadata: dto.metadata,
    };
  },

  toListSalesTasksQuery(dto: ListSalesTasksQueryDto): ListSalesTasksQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      ownerUserId: dto.ownerUserId,
      status: dto.status,
      type: dto.type,
      from: dto.from,
      to: dto.to,
      leadId: dto.leadId,
      dealId: dto.dealId,
      clientId: dto.clientId,
    };
  },

  toRescheduleCommand(dto: RescheduleSalesTaskDto): RescheduleSalesTaskCommand {
    return {
      dueDate: dto.dueDate,
      dueTime: dto.dueTime,
    };
  },

  toReassignCommand(dto: ReassignSalesTaskDto): ReassignSalesTaskCommand {
    return {
      ownerUserId: dto.ownerUserId,
    };
  },
};
