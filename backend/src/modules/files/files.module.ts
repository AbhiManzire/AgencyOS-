import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { WorkflowEventsModule } from '../automation/workflow-events.module';
import { FilesController } from './controllers/files.controller';
import { FileDomainService } from './domain/file-domain.service';
import { PrismaFileRepository } from './repositories/prisma-file.repository';
import { FILE_REPOSITORY } from './repositories/file.repository.interface';
import { FileService } from './services/file.service';

@Module({
  imports: [StorageModule, WorkflowEventsModule],
  providers: [
    {
      provide: FILE_REPOSITORY,
      useClass: PrismaFileRepository,
    },
    FileDomainService,
    FileService,
  ],
  controllers: [FilesController],
  exports: [FILE_REPOSITORY, FileDomainService, FileService],
})
export class FilesModule {}
