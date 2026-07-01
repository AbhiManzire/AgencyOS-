import type { LucideIcon } from 'lucide-react';

export interface ActivityActor {
  readonly id?: string;
  readonly name: string;
  readonly initials?: string;
}

/** Display model for a single activity timeline entry. */
export interface ActivityTimelineEntry {
  readonly id: string;
  readonly activityType?: string;
  readonly icon?: LucideIcon;
  readonly timestamp: string | Date;
  readonly actor: ActivityActor;
  readonly title: string;
  readonly description?: string;
}
