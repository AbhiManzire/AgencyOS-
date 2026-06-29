export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');

export interface FileScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface FileEntityScope extends FileScope {
  readonly entityType: string;
  readonly entityId: string;
}

export interface FileRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly fileName: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly size: number;
  readonly storageKey: string;
  readonly uploadedByUserId: string;
  readonly uploaderDisplayName: string | null;
  readonly uploaderEmail: string | null;
  readonly createdAt: Date;
}

export interface CreateFileData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly fileName: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly size: number;
  readonly storageKey: string;
  readonly uploadedByUserId: string;
  readonly createdAt: Date;
}

export interface FileRepository {
  create(data: CreateFileData): Promise<FileRecord>;
  findById(scope: FileScope, id: string): Promise<FileRecord | null>;
  listByEntity(scope: FileEntityScope): Promise<readonly FileRecord[]>;
  delete(scope: FileScope, id: string): Promise<FileRecord | null>;
}
