import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../clients/repositories/client.repository.interface';
import { ProjectMembersController } from './controllers/project-members.controller';
import { ProjectMilestonesController } from './controllers/project-milestones.controller';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectMemberDomainService } from './domain/project-member-domain.service';
import { ProjectMilestoneDomainService } from './domain/project-milestone-domain.service';
import { ProjectDomainService } from './domain/project-domain.service';
import { PROJECT_MEMBER_REPOSITORY } from './repositories/project-member.repository.interface';
import { PrismaProjectMemberRepository } from './repositories/prisma-project-member.repository';
import { PROJECT_MILESTONE_REPOSITORY } from './repositories/project-milestone.repository.interface';
import { PrismaProjectMilestoneRepository } from './repositories/prisma-project-milestone.repository';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from './repositories/project.repository.interface';
import { PrismaProjectRepository } from './repositories/prisma-project.repository';
import { ProjectMemberService } from './services/project-member.service';
import { ProjectMilestoneService } from './services/project-milestone.service';
import { ProjectService } from './services/project.service';

@Module({
  imports: [ClientsModule],
  providers: [
    {
      provide: PROJECT_REPOSITORY,
      useClass: PrismaProjectRepository,
    },
    {
      provide: PROJECT_MEMBER_REPOSITORY,
      useClass: PrismaProjectMemberRepository,
    },
    {
      provide: PROJECT_MILESTONE_REPOSITORY,
      useClass: PrismaProjectMilestoneRepository,
    },
    {
      provide: ProjectDomainService,
      useFactory: (projectRepository: ProjectRepository, clientRepository: ClientRepository) =>
        new ProjectDomainService(projectRepository, clientRepository),
      inject: [PROJECT_REPOSITORY, CLIENT_REPOSITORY],
    },
    ProjectMemberDomainService,
    ProjectMilestoneDomainService,
    ProjectService,
    ProjectMemberService,
    ProjectMilestoneService,
  ],
  controllers: [ProjectsController, ProjectMembersController, ProjectMilestonesController],
  exports: [
    PROJECT_REPOSITORY,
    PROJECT_MEMBER_REPOSITORY,
    PROJECT_MILESTONE_REPOSITORY,
    ProjectDomainService,
    ProjectMemberDomainService,
    ProjectMilestoneDomainService,
    ProjectService,
    ProjectMemberService,
    ProjectMilestoneService,
  ],
})
export class ProjectsModule {}
