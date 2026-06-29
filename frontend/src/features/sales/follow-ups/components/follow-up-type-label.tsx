import type { FollowUpType } from '@/features/sales/follow-ups/types';
import { FOLLOW_UP_TYPE_LABELS } from '@/features/sales/follow-ups/forms/follow-up-form.validation';

export function formatFollowUpType(type: FollowUpType): string {
  return FOLLOW_UP_TYPE_LABELS[type];
}
