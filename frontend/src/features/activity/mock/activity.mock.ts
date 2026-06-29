import { Archive, FileText, Pencil, Plus, RotateCcw, UserPlus } from 'lucide-react';
import type { ActivityTimelineEntry } from '@/features/activity/types';

/** Mock activity timeline entries until the activities API is connected. */
export function getMockActivityTimeline(
  entityType: string,
  entityId: string,
): readonly ActivityTimelineEntry[] {
  void entityId;

  if (entityType !== 'client') {
    return [];
  }

  return [
    {
      id: 'mock-activity-1',
      icon: Plus,
      timestamp: '2026-06-20T10:30:00.000Z',
      actor: { name: 'Alex Morgan', initials: 'AM' },
      title: 'Client created',
      description: 'Acme Corp was added as a new client account.',
    },
    {
      id: 'mock-activity-2',
      icon: UserPlus,
      timestamp: '2026-06-21T14:15:00.000Z',
      actor: { name: 'Jordan Lee', initials: 'JL' },
      title: 'Primary contact added',
      description: 'Jane Doe was designated as the primary contact.',
    },
    {
      id: 'mock-activity-3',
      icon: Pencil,
      timestamp: '2026-06-22T09:00:00.000Z',
      actor: { name: 'Alex Morgan', initials: 'AM' },
      title: 'Client profile updated',
      description: 'Industry and website fields were updated.',
    },
    {
      id: 'mock-activity-4',
      icon: FileText,
      timestamp: '2026-06-23T16:45:00.000Z',
      actor: { name: 'Sam Patel', initials: 'SP' },
      title: 'Note added',
      description: 'Kickoff call scheduled for next week.',
    },
    {
      id: 'mock-activity-5',
      icon: Archive,
      timestamp: '2026-06-24T11:20:00.000Z',
      actor: { name: 'Jordan Lee', initials: 'JL' },
      title: 'Client archived',
      description: 'Account was archived after contract ended.',
    },
    {
      id: 'mock-activity-6',
      icon: RotateCcw,
      timestamp: '2026-06-25T08:10:00.000Z',
      actor: { name: 'Alex Morgan', initials: 'AM' },
      title: 'Client restored',
      description: 'Account was restored after contract renewal.',
    },
  ];
}
