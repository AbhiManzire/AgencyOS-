import type {
  CreateProjectMemberCommand,
  UpdateProjectMemberCommand,
} from '../services/project-member-application.types';
import { CreateProjectMemberDto } from '../dto/create-project-member.dto';
import { UpdateProjectMemberDto } from '../dto/update-project-member.dto';

export const ProjectMemberMapper = {
  toCreateProjectMemberCommand(dto: CreateProjectMemberDto): CreateProjectMemberCommand {
    return {
      userId: dto.userId,
      role: dto.role,
      allocationPercent: dto.allocationPercent,
      startDate: dto.startDate,
      status: dto.status,
    };
  },

  toUpdateProjectMemberCommand(dto: UpdateProjectMemberDto): UpdateProjectMemberCommand {
    return {
      role: dto.role,
      allocationPercent: dto.allocationPercent,
      startDate: dto.startDate,
      status: dto.status,
    };
  },
};
