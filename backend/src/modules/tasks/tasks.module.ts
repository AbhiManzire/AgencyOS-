import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { ProjectsModule } from '../projects/projects.module';
import {
  PROJECT_MILESTONE_REPOSITORY,
  type ProjectMilestoneRepository,
} from '../projects/repositories/project-milestone.repository.interface';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../projects/repositories/project.repository.interface';
import { TaskDependenciesController } from './controllers/task-dependencies.controller';
import { TaskSubtasksController } from './controllers/task-subtasks.controller';
import { TaskTagsController } from './controllers/task-tags.controller';
import { TasksController } from './controllers/tasks.controller';
import { TaskDomainService } from './domain/task-domain.service';
import { PrismaTaskDependencyRepository } from './repositories/prisma-task-dependency.repository';
import { PrismaTaskRepository } from './repositories/prisma-task.repository';
import { PrismaTaskTagRepository } from './repositories/prisma-task-tag.repository';
import {
  TASK_DEPENDENCY_REPOSITORY,
  TASK_REPOSITORY,
  TASK_TAG_REPOSITORY,
  type TaskDependencyRepository,
  type TaskRepository,
} from './repositories/task.repository.interface';
import { TaskTagService } from './services/task-tag.service';
import { TaskService } from './services/task.service';

@Module({
  imports: [ProjectsModule, ActivitiesModule],
  providers: [
    {
      provide: TASK_REPOSITORY,
      useClass: PrismaTaskRepository,
    },
    {
      provide: TASK_DEPENDENCY_REPOSITORY,
      useClass: PrismaTaskDependencyRepository,
    },
    {
      provide: TASK_TAG_REPOSITORY,
      useClass: PrismaTaskTagRepository,
    },
    {
      provide: TaskDomainService,
      useFactory: (
        taskRepository: TaskRepository,
        projectRepository: ProjectRepository,
        projectMilestoneRepository: ProjectMilestoneRepository,
        taskDependencyRepository: TaskDependencyRepository,
      ) =>
        new TaskDomainService(
          taskRepository,
          projectRepository,
          projectMilestoneRepository,
          taskDependencyRepository,
        ),
      inject: [
        TASK_REPOSITORY,
        PROJECT_REPOSITORY,
        PROJECT_MILESTONE_REPOSITORY,
        TASK_DEPENDENCY_REPOSITORY,
      ],
    },
    TaskService,
    TaskTagService,
  ],
  controllers: [
    TasksController,
    TaskSubtasksController,
    TaskDependenciesController,
    TaskTagsController,
  ],
  exports: [TASK_REPOSITORY, TaskDomainService, TaskService, TaskTagService],
})
export class TasksModule {}
