import type { LucideIcon } from 'lucide-react';
import type {
  ActivityOrigin,
  ActivityType,
  ListActivitiesFilters,
} from '@/features/activity/api/activity.types';

export interface ActivityActor {
  readonly id?: string;
  readonly name: string;
  readonly initials?: string;
}

/** Display model for a single activity timeline entry. */
export interface ActivityTimelineEntry {
  readonly id: string;
  readonly activityType?: string;
  readonly typeLabel?: string;
  readonly origin?: ActivityOrigin;
  readonly icon?: LucideIcon;
  readonly timestamp: string | Date;
  readonly actor: ActivityActor;
  readonly title: string;
  readonly description?: string;
}

export type ActivityTimelineFilters = Pick<
  ListActivitiesFilters,
  'type' | 'types' | 'userId' | 'origin' | 'createdFrom' | 'createdTo' | 'skip' | 'take'
>;

export type ManualActivityType = Extract<
  ActivityType,
  'CALL' | 'MEETING' | 'NOTE' | 'FOLLOW_UP' | 'EMAIL' | 'WHATSAPP' | 'CUSTOM'
>;
