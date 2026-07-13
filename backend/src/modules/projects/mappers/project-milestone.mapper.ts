import type {
  CreateProjectMilestoneCommand,
  UpdateProjectMilestoneCommand,
} from '../services/project-milestone-application.types';
import { CreateProjectMilestoneDto } from '../dto/create-project-milestone.dto';
import { UpdateProjectMilestoneDto } from '../dto/update-project-milestone.dto';

export const ProjectMilestoneMapper = {
  toCreateProjectMilestoneCommand(dto: CreateProjectMilestoneDto): CreateProjectMilestoneCommand {
    return {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      ownerUserId: dto.ownerUserId,
      completionPercent: dto.completionPercent,
      dependsOnMilestoneIds: dto.dependsOnMilestoneIds,
    };
  },

  toUpdateProjectMilestoneCommand(dto: UpdateProjectMilestoneDto): UpdateProjectMilestoneCommand {
    return {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      ownerUserId: dto.ownerUserId,
      completionPercent: dto.completionPercent,
      dependsOnMilestoneIds: dto.dependsOnMilestoneIds,
    };
  },
};
