import {
  ACTIVITY_TYPE_LABELS,
  type ActivityRecord,
  type ActivityType,
} from '@/features/activity/api/activity.types';
import type { ActivityTimelineEntry } from '@/features/activity/types';

function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return 'SY';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function resolveActorName(record: ActivityRecord): string {
  const displayName = record.userDisplayName?.trim();
  if (displayName !== undefined && displayName.length > 0) {
    return displayName;
  }

  const email = record.userEmail?.trim();
  if (email !== undefined && email.length > 0) {
    return email;
  }

  if (record.userId !== null && record.userId.length > 0) {
    return 'User';
  }

  return 'System';
}

export function activityTypeLabel(type: string): string {
  if (type in ACTIVITY_TYPE_LABELS) {
    return ACTIVITY_TYPE_LABELS[type as ActivityType];
  }

  return type
    .split(/[._]/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function activityRecordToTimelineEntry(record: ActivityRecord): ActivityTimelineEntry {
  const actorName = resolveActorName(record);

  return {
    id: record.id,
    activityType: record.type,
    typeLabel: activityTypeLabel(record.type),
    origin: record.origin,
    timestamp: record.createdAt,
    actor: {
      id: record.userId ?? undefined,
      name: actorName,
      initials: initialsFromName(actorName),
    },
    title: record.title,
    description: record.description ?? undefined,
  };
}
