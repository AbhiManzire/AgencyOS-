export { ProjectsModule } from './projects.module';
export { ProjectsController } from './controllers/projects.controller';
export {
  PROJECT_DOMAIN_ERROR_CODES,
  ProjectDomainError,
  type ProjectDomainErrorCode,
} from './domain/project-domain.errors';
export { ProjectDomainService } from './domain/project-domain.service';
export { PROJECT_CREATABLE_STATUSES } from './domain/project-domain.types';
export {
  PROJECT_REPOSITORY,
  type CreateProjectData,
  type FindByIdOptions,
  type ListProjectsParams,
  type ListProjectsResult,
  type ProjectRecord,
  type ProjectRepository,
  type ProjectScope,
  type UpdateProjectData,
} from './repositories/project.repository.interface';
export { ProjectService } from './services/project.service';
export {
  type CreateProjectCommand,
  type GetProjectOptions,
  type ListProjectsQuery,
  type ProjectApplicationContext,
  type UpdateProjectCommand,
} from './services/project-application.types';
export { CreateProjectDto } from './dto/create-project.dto';
export { UpdateProjectDto } from './dto/update-project.dto';
export { ListProjectsQueryDto } from './dto/list-projects-query.dto';
export { ProjectMapper } from './mappers/project.mapper';
