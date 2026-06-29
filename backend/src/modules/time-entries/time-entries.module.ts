import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { TasksModule } from '../tasks/tasks.module';
import { TaskTimeEntriesController } from './controllers/task-time-entries.controller';
import { TimeEntriesController } from './controllers/time-entries.controller';
import { TimeEntryDomainService } from './domain/time-entry-domain.service';
import { PrismaTimeEntryRepository } from './repositories/prisma-time-entry.repository';
import { TIME_ENTRY_REPOSITORY } from './repositories/time-entry.repository.interface';
import { TimeEntryService } from './services/time-entry.service';

@Module({
  imports: [TasksModule, ActivitiesModule],
  providers: [
    {
      provide: TIME_ENTRY_REPOSITORY,
      useClass: PrismaTimeEntryRepository,
    },
    TimeEntryDomainService,
    TimeEntryService,
  ],
  controllers: [TaskTimeEntriesController, TimeEntriesController],
  exports: [TIME_ENTRY_REPOSITORY, TimeEntryDomainService, TimeEntryService],
})
export class TimeEntriesModule {}
