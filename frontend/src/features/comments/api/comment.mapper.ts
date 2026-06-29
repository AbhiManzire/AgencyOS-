import type { CommentRecord } from '@/features/comments/api/comment.types';
import type { CommentListItem } from '@/features/comments/types';

function resolveAuthorName(
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

function resolveAuthorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

/** Maps a comment API record to a list item for UI rendering. */
export function commentRecordToListItem(record: CommentRecord): CommentListItem {
  const authorName = resolveAuthorName(
    record.authorDisplayName,
    record.authorEmail,
    record.authorUserId,
  );

  return {
    id: record.id,
    message: record.message,
    author: {
      userId: record.authorUserId,
      name: authorName,
      initials: resolveAuthorInitials(authorName),
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
