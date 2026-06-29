export interface FileListItem {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly extension: string;
  readonly size: number;
  readonly uploadedBy: string;
  readonly createdAt: string;
}
