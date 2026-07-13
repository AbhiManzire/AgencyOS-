import { Injectable } from '@nestjs/common';
import type {
  FollowUpPriority,
  FollowUpReminderType,
  SalesTaskPriority,
  SalesTaskType,
} from '@prisma/client';
import { DEAL_OPEN_STAGES } from '../../deals/domain/deal-domain.types';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  WorkspaceApplicationContext,
  WorkspaceQueueItem,
  WorkspaceQueueKind,
  WorkspaceQueuePriority,
  WorkspaceQueueResult,
  WorkspaceScope,
} from './workspace-application.types';

const PRIORITY_RANK: Record<WorkspaceQueuePriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

@Injectable()
export class WorkspaceQueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(
    scope: WorkspaceScope,
    context: WorkspaceApplicationContext,
    skip = 0,
    take = 25,
  ): Promise<WorkspaceQueueResult> {
    const userId = context.actorUserId.trim();
    const now = new Date();
    const weekEnd = addUtcDays(startOfUtcDay(now), 7);

    const [tasks, followUps, reminders, deals, proposals] = await Promise.all([
      this.prisma.salesTask.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          ownerUserId: userId,
          deletedAt: null,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          dueAt: true,
          status: true,
          leadId: true,
          dealId: true,
          clientId: true,
        },
      }),
      this.prisma.followUp.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          assignedUserId: userId,
          deletedAt: null,
          status: 'PENDING',
        },
        select: {
          id: true,
          title: true,
          priority: true,
          scheduledAt: true,
          status: true,
          reminderType: true,
          entityType: true,
          entityId: true,
        },
      }),
      this.prisma.reminder.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          assignedUserId: userId,
          deletedAt: null,
          status: 'PENDING',
        },
        select: {
          id: true,
          title: true,
          remindAt: true,
          status: true,
          entityType: true,
          entityId: true,
        },
      }),
      this.prisma.deal.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          ownerUserId: userId,
          deletedAt: null,
          status: 'OPEN',
          stage: { in: [...DEAL_OPEN_STAGES] },
          expectedCloseDate: { gte: startOfUtcDay(now), lt: weekEnd },
        },
        select: {
          id: true,
          title: true,
          priority: true,
          expectedCloseDate: true,
          status: true,
          clientId: true,
          leadId: true,
        },
      }),
      this.prisma.proposal.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          status: { in: ['DRAFT', 'REVIEW', 'SENT', 'VIEWED'] },
          deal: {
            ownerUserId: userId,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          validUntil: true,
          dealId: true,
          updatedAt: true,
        },
        take: 50,
      }),
    ]);

    const items: WorkspaceQueueItem[] = [
      ...tasks.map((task) => ({
        id: `sales_task:${task.id}`,
        kind: mapTaskTypeToKind(task.type),
        title: task.title,
        priority: mapPriority(task.priority),
        dueAt: task.dueAt.toISOString(),
        status: task.status,
        sourceType: 'sales_task' as const,
        sourceId: task.id,
        leadId: task.leadId,
        dealId: task.dealId,
        clientId: task.clientId,
        deepLink: `/sales/workspace/tasks/${task.id}`,
      })),
      ...followUps.map((followUp) => ({
        id: `follow_up:${followUp.id}`,
        kind: mapReminderTypeToKind(followUp.reminderType),
        title: followUp.title,
        priority: mapPriority(followUp.priority),
        dueAt: followUp.scheduledAt.toISOString(),
        status: followUp.status,
        sourceType: 'follow_up' as const,
        sourceId: followUp.id,
        leadId: followUp.entityType === 'lead' ? followUp.entityId : null,
        dealId: followUp.entityType === 'deal' ? followUp.entityId : null,
        clientId: followUp.entityType === 'client' ? followUp.entityId : null,
        deepLink: `/sales/follow-ups/${followUp.id}`,
      })),
      ...reminders.map((reminder) => ({
        id: `reminder:${reminder.id}`,
        kind: 'REMINDER' as const,
        title: reminder.title,
        priority: 'MEDIUM' as const,
        dueAt: reminder.remindAt.toISOString(),
        status: reminder.status,
        sourceType: 'reminder' as const,
        sourceId: reminder.id,
        leadId: reminder.entityType === 'lead' ? reminder.entityId : null,
        dealId: reminder.entityType === 'deal' ? reminder.entityId : null,
        clientId: reminder.entityType === 'client' ? reminder.entityId : null,
        deepLink: `/sales/reminders/${reminder.id}`,
      })),
      ...deals.map((deal) => ({
        id: `deal:${deal.id}`,
        kind: 'DEAL_ACTION' as const,
        title: deal.title,
        priority: mapPriority(deal.priority),
        dueAt: deal.expectedCloseDate
          ? new Date(`${formatDateOnlyUtc(deal.expectedCloseDate)}T09:00:00.000Z`).toISOString()
          : null,
        status: deal.status,
        sourceType: 'deal' as const,
        sourceId: deal.id,
        leadId: deal.leadId,
        dealId: deal.id,
        clientId: deal.clientId,
        deepLink: `/sales/deals/${deal.id}`,
      })),
      ...proposals.map((proposal) => ({
        id: `proposal:${proposal.id}`,
        kind: 'PROPOSAL' as const,
        title: proposal.title,
        priority: 'MEDIUM' as const,
        dueAt: proposal.validUntil
          ? new Date(`${formatDateOnlyUtc(proposal.validUntil)}T09:00:00.000Z`).toISOString()
          : proposal.updatedAt.toISOString(),
        status: proposal.status,
        sourceType: 'proposal' as const,
        sourceId: proposal.id,
        dealId: proposal.dealId,
        deepLink: `/sales/proposals/${proposal.id}`,
      })),
    ];

    items.sort((a, b) => {
      const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
      const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
      return aDue - bDue;
    });

    const total = items.length;
    const page = items.slice(skip, skip + take);

    return { items: page, total };
  }
}

function mapTaskTypeToKind(type: SalesTaskType): WorkspaceQueueKind {
  switch (type) {
    case 'CALL':
      return 'CALL';
    case 'MEETING':
      return 'MEETING';
    case 'PROPOSAL':
      return 'PROPOSAL';
    default:
      return 'TASK';
  }
}

function mapReminderTypeToKind(type: FollowUpReminderType): WorkspaceQueueKind {
  switch (type) {
    case 'CALL':
      return 'CALL';
    case 'MEETING':
      return 'MEETING';
    case 'FOLLOW_UP':
      return 'LEAD_FOLLOW_UP';
    default:
      return 'LEAD_FOLLOW_UP';
  }
}

function mapPriority(
  priority: SalesTaskPriority | FollowUpPriority | null | undefined,
): WorkspaceQueuePriority {
  switch (priority) {
    case 'URGENT':
      return 'URGENT';
    case 'HIGH':
      return 'HIGH';
    case 'LOW':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDateOnlyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}
