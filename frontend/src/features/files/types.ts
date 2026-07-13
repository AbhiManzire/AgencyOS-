import type { FileDocumentFolder } from '@/features/files/api/file.types';

export interface FileListItem {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly size: number;
  readonly folder: FileDocumentFolder | null;
  readonly uploadedBy: string;
  readonly createdAt: string;
}
