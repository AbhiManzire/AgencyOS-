import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import {
  PROJECT_MILESTONE_REPOSITORY,
  type ProjectMilestoneRepository,
} from '../projects/repositories/project-milestone.repository.interface';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../projects/repositories/project.repository.interface';
import { TasksController } from './controllers/tasks.controller';
import { TaskSubtasksController } from './controllers/task-subtasks.controller';
import { TaskDomainService } from './domain/task-domain.service';
import { PrismaTaskRepository } from './repositories/prisma-task.repository';
import { TASK_REPOSITORY, type TaskRepository } from './repositories/task.repository.interface';
import { TaskService } from './services/task.service';

@Module({
  imports: [ProjectsModule],
  providers: [
    {
      provide: TASK_REPOSITORY,
      useClass: PrismaTaskRepository,
    },
    {
      provide: TaskDomainService,
      useFactory: (
        taskRepository: TaskRepository,
        projectRepository: ProjectRepository,
        projectMilestoneRepository: ProjectMilestoneRepository,
      ) => new TaskDomainService(taskRepository, projectRepository, projectMilestoneRepository),
      inject: [TASK_REPOSITORY, PROJECT_REPOSITORY, PROJECT_MILESTONE_REPOSITORY],
    },
    TaskService,
  ],
  controllers: [TasksController, TaskSubtasksController],
  exports: [TASK_REPOSITORY, TaskDomainService, TaskService],
})
export class TasksModule {}
