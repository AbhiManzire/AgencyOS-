import type {
  CreateProjectCommand,
  ListProjectsQuery,
  UpdateProjectCommand,
} from '../services/project-application.types';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ListProjectsQueryDto } from '../dto/list-projects-query.dto';
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
      priority: dto.priority,
      startDate: dto.startDate,
      targetEndDate: dto.targetEndDate,
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
      priority: dto.priority,
      startDate: dto.startDate,
      targetEndDate: dto.targetEndDate,
      isBillable: dto.isBillable,
    };
  },

  toListProjectsQuery(dto: ListProjectsQueryDto): ListProjectsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      status: dto.status,
      clientId: dto.clientId,
      includeArchived: dto.includeArchived,
    };
  },
};
