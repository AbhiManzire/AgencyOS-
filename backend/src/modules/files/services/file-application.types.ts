import type { ClientDocumentFolder } from '@prisma/client';
import type { FileRecord, FileScope } from '../repositories/file.repository.interface';

export interface FileApplicationContext {
  readonly actorUserId: string;
}

export interface UploadFileCommand {
  readonly entityType: string;
  readonly entityId: string;
  readonly folder?: ClientDocumentFolder;
  readonly originalName: string;
  readonly mimeType: string;
  readonly buffer: Buffer;
}

export interface FileDownloadResult {
  readonly record: FileRecord;
  readonly buffer: Buffer;
}

export type { FileRecord, FileScope };
