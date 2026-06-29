import { Archive, FileText, Pencil, Plus, RotateCcw, UserPlus } from 'lucide-react';
import type { ActivityTimelineEntry } from '@/features/activity/types';

/** Workspace-level mock activities for the executive dashboard. */
export const DASHBOARD_MOCK_ACTIVITIES: readonly ActivityTimelineEntry[] = [
  {
    id: 'dashboard-activity-1',
    icon: Plus,
    timestamp: '2026-06-28T09:15:00.000Z',
    actor: { name: 'Alex Morgan', initials: 'AM' },
    title: 'Client created',
    description: 'Northwind Digital was added as a new client account.',
  },
  {
    id: 'dashboard-activity-2',
    icon: UserPlus,
    timestamp: '2026-06-28T08:40:00.000Z',
    actor: { name: 'Jordan Lee', initials: 'JL' },
    title: 'Primary contact added',
    description: 'Chris Nguyen was designated as the primary contact for Acme Corp.',
  },
  {
    id: 'dashboard-activity-3',
    icon: Pencil,
    timestamp: '2026-06-27T16:20:00.000Z',
    actor: { name: 'Sam Patel', initials: 'SP' },
    title: 'Client profile updated',
    description: 'Website and industry fields were updated for Brightline Studio.',
  },
  {
    id: 'dashboard-activity-4',
    icon: FileText,
    timestamp: '2026-06-27T11:05:00.000Z',
    actor: { name: 'Alex Morgan', initials: 'AM' },
    title: 'Note added',
    description: 'Q3 planning session scheduled with Summit Brands.',
  },
  {
    id: 'dashboard-activity-5',
    icon: Archive,
    timestamp: '2026-06-26T14:30:00.000Z',
    actor: { name: 'Jordan Lee', initials: 'JL' },
    title: 'Client archived',
    description: 'Legacy Retail Co. was archived after contract completion.',
  },
  {
    id: 'dashboard-activity-6',
    icon: RotateCcw,
    timestamp: '2026-06-26T10:00:00.000Z',
    actor: { name: 'Sam Patel', initials: 'SP' },
    title: 'Client restored',
    description: 'Harbor Logistics account was restored after renewal.',
  },
  {
    id: 'dashboard-activity-7',
    icon: UserPlus,
    timestamp: '2026-06-25T15:45:00.000Z',
    actor: { name: 'Alex Morgan', initials: 'AM' },
    title: 'Contact added',
    description: 'Morgan Ellis was added to Pixel Forge.',
  },
  {
    id: 'dashboard-activity-8',
    icon: Pencil,
    timestamp: '2026-06-25T09:30:00.000Z',
    actor: { name: 'Jordan Lee', initials: 'JL' },
    title: 'Client status changed',
    description: 'Greenfield Apps moved from Prospect to Active.',
  },
  {
    id: 'dashboard-activity-9',
    icon: Plus,
    timestamp: '2026-06-24T13:10:00.000Z',
    actor: { name: 'Sam Patel', initials: 'SP' },
    title: 'Client created',
    description: 'Atlas Media Group was onboarded as a new account.',
  },
  {
    id: 'dashboard-activity-10',
    icon: FileText,
    timestamp: '2026-06-24T08:55:00.000Z',
    actor: { name: 'Alex Morgan', initials: 'AM' },
    title: 'Kickoff completed',
    description: 'Discovery workshop notes recorded for Vertex Health.',
  },
];

/** Returns the latest dashboard activities sorted by timestamp descending. */
export function getDashboardRecentActivities(limit = 10): readonly ActivityTimelineEntry[] {
  return [...DASHBOARD_MOCK_ACTIVITIES]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, limit);
}
