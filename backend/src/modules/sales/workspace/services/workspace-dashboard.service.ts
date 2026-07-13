import { Injectable } from '@nestjs/common';
import type { LeadStatus, Prisma } from '@prisma/client';
import { DEAL_OPEN_STAGES } from '../../deals/domain/deal-domain.types';
import { NotificationService } from '../../../notifications/services/notification.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  WorkspaceApplicationContext,
  WorkspaceCountCard,
  WorkspaceDashboardResult,
  WorkspaceScope,
} from './workspace-application.types';

const CARD_TAKE = 5;
const INACTIVE_LEAD_STATUSES: LeadStatus[] = ['CONVERTED', 'ARCHIVED', 'DISQUALIFIED'];

@Injectable()
export class WorkspaceDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getDashboard(
    scope: WorkspaceScope,
    context: WorkspaceApplicationContext,
  ): Promise<WorkspaceDashboardResult> {
    const userId = context.actorUserId.trim();
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const todayEnd = endOfUtcDay(now);
    const weekEnd = addUtcDays(todayStart, 7);

    const [
      todaysTasks,
      todaysCalls,
      todaysMeetings,
      todaysFollowUps,
      overdue,
      assignedLeads,
      assignedDeals,
      dealsClosingThisWeek,
      upcomingReminders,
      unreadNotifications,
      openDealsAgg,
      tasksCompletedToday,
      callsCompletedToday,
      meetingsCompletedToday,
      leadStats,
      dealOutcomeStats,
    ] = await Promise.all([
      this.countTasksCard(scope, userId, {
        status: { in: ['PENDING', 'OVERDUE'] },
        dueAt: { gte: todayStart, lte: todayEnd },
      }),
      this.countTasksCard(scope, userId, {
        type: 'CALL',
        status: { in: ['PENDING', 'OVERDUE'] },
        dueAt: { gte: todayStart, lte: todayEnd },
      }),
      this.countTasksCard(scope, userId, {
        type: 'MEETING',
        status: { in: ['PENDING', 'OVERDUE'] },
        dueAt: { gte: todayStart, lte: todayEnd },
      }),
      this.countFollowUpsCard(scope, userId, {
        status: 'PENDING',
        scheduledAt: { gte: todayStart, lte: todayEnd },
      }),
      this.countTasksCard(scope, userId, {
        status: 'OVERDUE',
      }),
      this.countLeadsCard(scope, userId),
      this.countDealsCard(scope, userId, {
        status: 'OPEN',
        stage: { in: [...DEAL_OPEN_STAGES] },
      }),
      this.countDealsCard(scope, userId, {
        status: 'OPEN',
        stage: { in: [...DEAL_OPEN_STAGES] },
        expectedCloseDate: { gte: todayStart, lt: weekEnd },
      }),
      this.countRemindersCard(scope, userId, {
        status: 'PENDING',
        remindAt: { gte: now },
      }),
      this.notificationService.unreadCount(scope, userId),
      this.aggregateOpenPipeline(scope, userId),
      this.prisma.salesTask.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          ownerUserId: userId,
          deletedAt: null,
          status: 'COMPLETED',
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.salesTask.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          ownerUserId: userId,
          deletedAt: null,
          type: 'CALL',
          status: 'COMPLETED',
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.salesTask.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          ownerUserId: userId,
          deletedAt: null,
          type: 'MEETING',
          status: 'COMPLETED',
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.aggregateLeadConversion(scope, userId),
      this.aggregateDealWinRate(scope, userId),
    ]);

    return {
      todaysTasks,
      todaysCalls,
      todaysMeetings,
      todaysFollowUps,
      overdue,
      assignedLeads,
      assignedDeals,
      dealsClosingThisWeek,
      upcomingReminders,
      unreadNotifications,
      widgets: {
        todaysRevenueTarget: openDealsAgg.weighted,
        currentPipeline: openDealsAgg.totalValue,
        tasksCompletedToday,
        callsCompletedToday,
        meetingsCompletedToday,
        leadConversionRate: leadStats.rate,
        dealWinRate: dealOutcomeStats.rate,
      },
    };
  }

  private async countTasksCard(
    scope: WorkspaceScope,
    userId: string,
    extraWhere: Record<string, unknown>,
  ): Promise<WorkspaceCountCard> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ownerUserId: userId,
      deletedAt: null,
      ...extraWhere,
    };

    const [count, items] = await this.prisma.$transaction([
      this.prisma.salesTask.count({ where }),
      this.prisma.salesTask.findMany({
        where,
        take: CARD_TAKE,
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          priority: true,
          dueAt: true,
          leadId: true,
          dealId: true,
          clientId: true,
        },
      }),
    ]);

    return { count, items };
  }

  private async countFollowUpsCard(
    scope: WorkspaceScope,
    userId: string,
    extraWhere: Record<string, unknown>,
  ): Promise<WorkspaceCountCard> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      assignedUserId: userId,
      deletedAt: null,
      ...extraWhere,
    };

    const [count, items] = await this.prisma.$transaction([
      this.prisma.followUp.count({ where }),
      this.prisma.followUp.findMany({
        where,
        take: CARD_TAKE,
        orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          scheduledAt: true,
          reminderType: true,
          entityType: true,
          entityId: true,
        },
      }),
    ]);

    return { count, items };
  }

  private async countLeadsCard(scope: WorkspaceScope, userId: string): Promise<WorkspaceCountCard> {
    const where: Prisma.LeadWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      assignedToUserId: userId,
      deletedAt: null,
      status: { notIn: INACTIVE_LEAD_STATUSES },
    };

    const [count, items] = await this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        take: CARD_TAKE,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          company: true,
          status: true,
          priority: true,
          contactPerson: true,
        },
      }),
    ]);

    return { count, items };
  }

  private async countDealsCard(
    scope: WorkspaceScope,
    userId: string,
    extraWhere: Record<string, unknown>,
  ): Promise<WorkspaceCountCard> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ownerUserId: userId,
      deletedAt: null,
      ...extraWhere,
    };

    const [count, items] = await this.prisma.$transaction([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        take: CARD_TAKE,
        orderBy: { expectedCloseDate: 'asc' },
        select: {
          id: true,
          title: true,
          stage: true,
          status: true,
          value: true,
          expectedCloseDate: true,
          priority: true,
        },
      }),
    ]);

    return {
      count,
      items: items.map((item) => ({
        ...item,
        value: Number(item.value),
      })),
    };
  }

  private async countRemindersCard(
    scope: WorkspaceScope,
    userId: string,
    extraWhere: Record<string, unknown>,
  ): Promise<WorkspaceCountCard> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      assignedUserId: userId,
      deletedAt: null,
      ...extraWhere,
    };

    const [count, items] = await this.prisma.$transaction([
      this.prisma.reminder.count({ where }),
      this.prisma.reminder.findMany({
        where,
        take: CARD_TAKE,
        orderBy: { remindAt: 'asc' },
        select: {
          id: true,
          title: true,
          status: true,
          remindAt: true,
          entityType: true,
          entityId: true,
        },
      }),
    ]);

    return { count, items };
  }

  private async aggregateOpenPipeline(
    scope: WorkspaceScope,
    userId: string,
  ): Promise<{ totalValue: number; weighted: number }> {
    const deals = await this.prisma.deal.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ownerUserId: userId,
        deletedAt: null,
        status: 'OPEN',
        stage: { in: [...DEAL_OPEN_STAGES] },
      },
      select: { value: true, probability: true },
    });

    let totalValue = 0;
    let weighted = 0;
    for (const deal of deals) {
      const value = Number(deal.value);
      const probability = deal.probability ?? 0;
      totalValue += value;
      weighted += (value * probability) / 100;
    }

    return {
      totalValue: roundMoney(totalValue),
      weighted: roundMoney(weighted),
    };
  }

  private async aggregateLeadConversion(
    scope: WorkspaceScope,
    userId: string,
  ): Promise<{ rate: number | null }> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      assignedToUserId: userId,
      deletedAt: null,
    };

    const [total, converted] = await this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: 'CONVERTED' } }),
    ]);

    if (total === 0) {
      return { rate: null };
    }

    return { rate: roundRate(converted / total) };
  }

  private async aggregateDealWinRate(
    scope: WorkspaceScope,
    userId: string,
  ): Promise<{ rate: number | null }> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ownerUserId: userId,
      deletedAt: null,
      stage: { in: ['WON', 'LOST'] as const },
    };

    const [won, lost] = await this.prisma.$transaction([
      this.prisma.deal.count({ where: { ...where, stage: 'WON' } }),
      this.prisma.deal.count({ where: { ...where, stage: 'LOST' } }),
    ]);

    const closed = won + lost;
    if (closed === 0) {
      return { rate: null };
    }

    return { rate: roundRate(won / closed) };
  }
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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round(value * 10000) / 10000;
}
