import type {
  CreateProjectTemplateCommand,
  UpdateProjectTemplateCommand,
} from '../services/project-template-application.types';
import { CreateProjectTemplateDto } from '../dto/create-project-template.dto';
import { UpdateProjectTemplateDto } from '../dto/update-project-template.dto';

/** Maps HTTP DTOs to application commands — no business logic. */
export const ProjectTemplateMapper = {
  toCreateTemplateCommand(dto: CreateProjectTemplateDto): CreateProjectTemplateCommand {
    return {
      name: dto.name,
      description: dto.description,
      serviceType: dto.serviceType,
      defaultDurationDays: dto.defaultDurationDays,
      defaultEstimatedHours: dto.defaultEstimatedHours,
      milestones: dto.milestones,
      tasks: dto.tasks,
      deliverables: dto.deliverables,
      requiredDocuments: dto.requiredDocuments,
    };
  },

  toUpdateTemplateCommand(dto: UpdateProjectTemplateDto): UpdateProjectTemplateCommand {
    return {
      name: dto.name,
      description: dto.description,
      serviceType: dto.serviceType,
      defaultDurationDays: dto.defaultDurationDays,
      defaultEstimatedHours: dto.defaultEstimatedHours,
      isActive: dto.isActive,
      milestones: dto.milestones,
      tasks: dto.tasks,
      deliverables: dto.deliverables,
      requiredDocuments: dto.requiredDocuments,
    };
  },
};
