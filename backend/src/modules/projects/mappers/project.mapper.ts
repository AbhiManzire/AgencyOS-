import type {
  CreateProjectCommand,
  ListProjectsQuery,
  RestoreProjectCommand,
  UpdateProjectCommand,
} from '../services/project-application.types';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ListProjectsQueryDto } from '../dto/list-projects-query.dto';
import { RestoreProjectDto } from '../dto/restore-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const ProjectMapper = {
  toCreateProjectCommand(dto: CreateProjectDto): CreateProjectCommand {
    return {
      clientId: dto.clientId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      status: dto.status,
      projectManagerUserId: dto.projectManagerUserId,
      departmentId: dto.departmentId,
      dealId: dto.dealId,
      templateId: dto.templateId,
      primaryContactId: dto.primaryContactId,
      serviceType: dto.serviceType,
      serviceLabel: dto.serviceLabel,
      priority: dto.priority,
      startDate: dto.startDate,
      targetEndDate: dto.targetEndDate,
      budgetAmount: dto.budgetAmount,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      isBillable: dto.isBillable,
    };
  },

  toUpdateProjectCommand(dto: UpdateProjectDto): UpdateProjectCommand {
    return {
      name: dto.name,
      code: dto.code,
      description: dto.description,
      status: dto.status,
      projectManagerUserId: dto.projectManagerUserId,
      departmentId: dto.departmentId,
      dealId: dto.dealId,
      templateId: dto.templateId,
      primaryContactId: dto.primaryContactId,
      serviceType: dto.serviceType,
      serviceLabel: dto.serviceLabel,
      healthStatus: dto.healthStatus,
      healthScore: dto.healthScore,
      healthCalculatedAt: dto.healthCalculatedAt,
      priority: dto.priority,
      startDate: dto.startDate,
      targetEndDate: dto.targetEndDate,
      budgetAmount: dto.budgetAmount,
      estimatedHours: dto.estimatedHours,
      actualHours: dto.actualHours,
      isBillable: dto.isBillable,
    };
  },

  toRestoreProjectCommand(dto: RestoreProjectDto): RestoreProjectCommand {
    return {
      targetStatus: dto.targetStatus,
    };
  },

  toListProjectsQuery(dto: ListProjectsQueryDto): ListProjectsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      status: dto.status,
      clientId: dto.clientId,
      includeArchived: dto.includeArchived,
      archivedOnly: dto.archivedOnly,
      q: dto.q,
      projectManagerUserId: dto.projectManagerUserId,
      departmentId: dto.departmentId,
      priority: dto.priority,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },
};
