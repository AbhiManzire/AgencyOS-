import { Module } from '@nestjs/common';
import { LocalFilesystemStorageService } from './local-filesystem-storage.service';
import { LOCAL_STORAGE_SERVICE } from './local-storage.service.interface';

@Module({
  providers: [
    {
      provide: LOCAL_STORAGE_SERVICE,
      useClass: LocalFilesystemStorageService,
    },
  ],
  exports: [LOCAL_STORAGE_SERVICE],
})
export class StorageModule {}
