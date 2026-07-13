/** Optional document folder for client (and other entity) file uploads. */
export type FileDocumentFolder =
  'CONTRACTS' | 'INVOICES' | 'PROPOSALS' | 'NDA' | 'PURCHASE_ORDERS' | 'DESIGN_FILES' | 'OTHER';

/** File row returned by the files API. */
export interface FileRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly folder?: FileDocumentFolder | null;
  readonly fileName: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly size: number;
  readonly storageKey: string;
  readonly uploadedByUserId: string;
  readonly uploaderDisplayName: string | null;
  readonly uploaderEmail: string | null;
  readonly createdAt: string;
}

export interface EntityFilesParams {
  readonly entityType: string;
  readonly entityId: string;
}

export interface UploadFileParams extends EntityFilesParams {
  readonly file: File;
  readonly folder?: FileDocumentFolder;
}
