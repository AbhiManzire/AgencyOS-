import type { FileRecord } from '@/features/files/api/file.types';
import type { FileListItem } from '@/features/files/types';

function resolveUploaderName(
  displayName: string | null | undefined,
  email: string | null | undefined,
  userId: string,
): string {
  if (displayName !== null && displayName !== undefined && displayName.trim().length > 0) {
    return displayName.trim();
  }

  if (email !== null && email !== undefined && email.trim().length > 0) {
    return email.trim();
  }

  return userId;
}

/** Maps a file API record to a list item for UI rendering. */
export function fileRecordToListItem(record: FileRecord): FileListItem {
  return {
    id: record.id,
    originalName: record.originalName,
    mimeType: record.mimeType,
    extension: record.extension,
    size: record.size,
    folder: record.folder ?? null,
    uploadedBy: resolveUploaderName(
      record.uploaderDisplayName,
      record.uploaderEmail,
      record.uploadedByUserId,
    ),
    createdAt: record.createdAt,
  };
}
