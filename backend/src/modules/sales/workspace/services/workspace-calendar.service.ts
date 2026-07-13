import { BadRequestException, Injectable } from '@nestjs/common';
import { DEAL_OPEN_STAGES } from '../../deals/domain/deal-domain.types';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  WorkspaceApplicationContext,
  WorkspaceCalendarEvent,
  WorkspaceCalendarResult,
  WorkspaceCalendarView,
  WorkspaceScope,
} from './workspace-application.types';

@Injectable()
export class WorkspaceCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendar(
    scope: WorkspaceScope,
    context: WorkspaceApplicationContext,
    view: WorkspaceCalendarView,
    fromInput?: string,
    toInput?: string,
  ): Promise<WorkspaceCalendarResult> {
    const userId = context.actorUserId.trim();
    const { from, to } = resolveRange(view, fromInput, toInput);

    const [tasks, followUps, reminders, deals, activities] = await Promise.all([
      this.prisma.salesTask.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          ownerUserId: userId,
          deletedAt: null,
          dueAt: { gte: from, lte: to },
          status: { not: 'CANCELLED' },
        },
        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          dueAt: true,
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
          scheduledAt: { gte: from, lte: to },
          status: { not: 'CANCELLED' },
        },
        select: {
          id: true,
          title: true,
          priority: true,
          scheduledAt: true,
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
          remindAt: { gte: from, lte: to },
          status: { not: 'CANCELLED' },
        },
        select: {
          id: true,
          title: true,
          remindAt: true,
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
          expectedCloseDate: { gte: from, lte: to },
        },
        select: {
          id: true,
          title: true,
          priority: true,
          expectedCloseDate: true,
          clientId: true,
          leadId: true,
        },
      }),
      this.prisma.activity.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          userId,
          createdAt: { gte: from, lte: to },
        },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          entityType: true,
          entityId: true,
        },
        take: 200,
      }),
    ]);

    const events: WorkspaceCalendarEvent[] = [
      ...tasks.map((task) => ({
        id: `sales_task:${task.id}`,
        kind: task.type,
        title: task.title,
        startAt: task.dueAt.toISOString(),
        entityType: resolveTaskEntityType(task),
        entityId: resolveTaskEntityId(task),
        sourceType: 'sales_task' as const,
        sourceId: task.id,
        priority: task.priority,
      })),
      ...followUps.map((followUp) => ({
        id: `follow_up:${followUp.id}`,
        kind: followUp.reminderType,
        title: followUp.title,
        startAt: followUp.scheduledAt.toISOString(),
        entityType: followUp.entityType,
        entityId: followUp.entityId,
        sourceType: 'follow_up' as const,
        sourceId: followUp.id,
        priority: followUp.priority,
      })),
      ...reminders.map((reminder) => ({
        id: `reminder:${reminder.id}`,
        kind: 'REMINDER',
        title: reminder.title,
        startAt: reminder.remindAt.toISOString(),
        entityType: reminder.entityType,
        entityId: reminder.entityId,
        sourceType: 'reminder' as const,
        sourceId: reminder.id,
        priority: 'MEDIUM' as const,
      })),
      ...deals.map((deal) => {
        const closeDate = deal.expectedCloseDate
          ? new Date(`${formatDateOnlyUtc(deal.expectedCloseDate)}T09:00:00.000Z`)
          : from;
        return {
          id: `deal:${deal.id}`,
          kind: 'DEAL_ACTION',
          title: deal.title,
          startAt: closeDate.toISOString(),
          entityType: 'deal',
          entityId: deal.id,
          sourceType: 'deal' as const,
          sourceId: deal.id,
          priority: deal.priority,
        };
      }),
      ...activities.map((activity) => ({
        id: `activity:${activity.id}`,
        kind: activity.type,
        title: activity.title,
        startAt: activity.createdAt.toISOString(),
        entityType: activity.entityType,
        entityId: activity.entityId,
        sourceType: 'activity' as const,
        sourceId: activity.id,
      })),
    ];

    events.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));

    return {
      events,
      view,
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }
}

function resolveRange(
  view: WorkspaceCalendarView,
  fromInput?: string,
  toInput?: string,
): { from: Date; to: Date } {
  if (fromInput && toInput) {
    assertDateOnly(fromInput, 'from');
    assertDateOnly(toInput, 'to');
    return {
      from: new Date(`${fromInput}T00:00:00.000Z`),
      to: new Date(`${toInput}T23:59:59.999Z`),
    };
  }

  const now = new Date();
  const todayStart = startOfUtcDay(now);

  switch (view) {
    case 'day':
      return { from: todayStart, to: endOfUtcDay(now) };
    case 'week':
      return { from: todayStart, to: endOfUtcDay(addUtcDays(todayStart, 6)) };
    case 'agenda':
      return { from: todayStart, to: endOfUtcDay(addUtcDays(todayStart, 13)) };
    case 'month':
    default: {
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const monthEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
      );
      return { from: monthStart, to: monthEnd };
    }
  }
}

function assertDateOnly(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${field} must be YYYY-MM-DD.`);
  }
}

function resolveTaskEntityType(task: {
  leadId: string | null;
  dealId: string | null;
  clientId: string | null;
}): string | null {
  if (task.leadId) return 'lead';
  if (task.dealId) return 'deal';
  if (task.clientId) return 'client';
  return null;
}

function resolveTaskEntityId(task: {
  leadId: string | null;
  dealId: string | null;
  clientId: string | null;
}): string | null {
  return task.leadId ?? task.dealId ?? task.clientId ?? null;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
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
