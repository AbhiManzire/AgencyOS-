import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { FileDomainService } from '../domain/file-domain.service';
import { FILE_DOMAIN_ERROR_CODES, FileDomainError } from '../domain/file-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  LOCAL_STORAGE_SERVICE,
  type LocalStorageService,
} from '../../storage/local-storage.service.interface';
import {
  FILE_REPOSITORY,
  type CreateFileData,
  type FileEntityScope,
  type FileRepository,
  type FileScope,
} from '../repositories/file.repository.interface';
import type {
  FileApplicationContext,
  FileDownloadResult,
  FileRecord,
  UploadFileCommand,
} from './file-application.types';

@Injectable()
export class FileService {
  constructor(
    @Inject(FILE_REPOSITORY)
    private readonly fileRepository: FileRepository,
    @Inject(LOCAL_STORAGE_SERVICE)
    private readonly storageService: LocalStorageService,
    private readonly fileDomainService: FileDomainService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async listFilesByEntity(
    scope: FileScope,
    entityType: string,
    entityId: string,
  ): Promise<readonly FileRecord[]> {
    const entityScope: FileEntityScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: entityType.trim(),
      entityId,
    };

    return this.fileRepository.listByEntity(entityScope);
  }

  async uploadFile(
    scope: FileScope,
    command: UploadFileCommand,
    context: FileApplicationContext,
  ): Promise<FileRecord> {
    const maxFileSizeBytes = this.configService.get<number>('storage.maxFileSizeBytes', 10_485_760);

    this.fileDomainService.validateUpload({
      buffer: command.buffer,
      maxFileSizeBytes,
    });

    const fileId = randomUUID();
    const extension = this.fileDomainService.extractExtension(command.originalName);
    const fileName = this.fileDomainService.buildStoredFileName(fileId, extension);
    const storageKey = this.fileDomainService.buildStorageKey({
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: command.entityType.trim(),
      entityId: command.entityId,
      fileName,
    });

    const now = new Date();

    const data: CreateFileData = {
      id: fileId,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: command.entityType.trim(),
      entityId: command.entityId,
      fileName,
      originalName: command.originalName.trim(),
      mimeType:
        command.mimeType.trim().length > 0 ? command.mimeType.trim() : 'application/octet-stream',
      extension,
      size: command.buffer.length,
      storageKey,
      uploadedByUserId: context.actorUserId,
      createdAt: now,
    };

    return this.runInTransaction(async () => {
      await this.storageService.save({
        storageKey,
        buffer: command.buffer,
      });

      try {
        return await this.fileRepository.create(data);
      } catch (error) {
        await this.storageService.delete(storageKey);
        throw error;
      }
    });
  }

  async downloadFile(scope: FileScope, fileId: string): Promise<FileDownloadResult> {
    const record = await this.requireFile(scope, fileId);
    const buffer = await this.storageService.read(record.storageKey);

    return { record, buffer };
  }

  async deleteFile(scope: FileScope, fileId: string): Promise<FileRecord> {
    const record = await this.requireFile(scope, fileId);

    return this.runInTransaction(async () => {
      const deleted = await this.fileRepository.delete(scope, fileId);
      if (deleted === null) {
        throw new FileDomainError(FILE_DOMAIN_ERROR_CODES.FILE_NOT_FOUND, 'File was not found.');
      }

      await this.storageService.delete(record.storageKey);
      return deleted;
    });
  }

  private async requireFile(scope: FileScope, fileId: string): Promise<FileRecord> {
    const file = await this.fileRepository.findById(scope, fileId);

    if (file === null) {
      throw new FileDomainError(FILE_DOMAIN_ERROR_CODES.FILE_NOT_FOUND, 'File was not found.');
    }

    if (file.tenantId !== scope.tenantId || file.workspaceId !== scope.workspaceId) {
      throw new FileDomainError(
        FILE_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'File does not belong to the requested workspace.',
      );
    }

    return file;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}
