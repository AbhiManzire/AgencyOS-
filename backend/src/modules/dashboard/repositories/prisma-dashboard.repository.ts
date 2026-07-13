import { Injectable } from '@nestjs/common';
import {
  ApprovalStatus,
  ClientActivityType,
  ClientStatus,
  DealStage,
  InvitationStatus,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  RecurringFrequency,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  DashboardAdminSummary,
  DashboardScope,
  DashboardSummaryAggregates,
} from '../dashboard.types';
import type { DashboardRepository } from './dashboard.repository.interface';

const OPEN_TASK_STATUSES: readonly TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.BLOCKED,
];
const INVOICED_STATUSES: readonly InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.VIEWED,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
];
const OUTSTANDING_STATUSES: readonly InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.VIEWED,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.OVERDUE,
];
const OPEN_DEAL_STAGES: readonly DealStage[] = [
  DealStage.QUALIFICATION,
  DealStage.DISCOVERY,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.VERBAL_COMMIT,
];
const NON_REJECTED_APPROVAL: readonly ApprovalStatus[] = [
  ApprovalStatus.APPROVED,
  ApprovalStatus.PENDING,
  ApprovalStatus.NOT_REQUIRED,
];
const LOST_CLIENT_STATUSES: readonly ClientStatus[] = [
  ClientStatus.INACTIVE,
  ClientStatus.ARCHIVED,
];
const LOST_STATUS_SET = new Set<string>(LOST_CLIENT_STATUSES);
const STANDARD_MONTH_CAPACITY_MINUTES = 160 * 60;

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummaryAggregates(
    scope: DashboardScope,
    asOf: Date,
  ): Promise<DashboardSummaryAggregates> {
    const { monthStart, monthEnd, dayStart, dayEnd } = resolveUtcWindows(asOf);
    const baseScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
    };
    const endingSoonEnd = addUtcDays(dayStart, 7);

    const [
      workspace,
      invoicedMonthly,
      collectedMonthly,
      outstandingAmount,
      overdueAmount,
      outstandingCount,
      clientsTotal,
      clientsActive,
      clientsNew,
      statusChangeActivities,
      clientsLostFallback,
      projectsTotal,
      projectsActive,
      projectsPlanning,
      projectsOnHold,
      projectsCancelled,
      projectsInvoiceReady,
      projectsCompletedThisMonth,
      projectsCompleted,
      projectsAtRisk,
      projectsEndingSoon,
      projectsOverBudget,
      tasksDueToday,
      tasksOverdue,
      tasksOpenTotal,
      tasksOpenGlobal,
      tasksCompleted,
      tasksBlocked,
      tasksAssignedDueToday,
      tasksAssignedOverdue,
      tasksDueThisWeek,
      leadCount,
      qualifiedLeads,
      openDeals,
      wonRevenue,
      lostRevenue,
      wonDealsCount,
      lostDealsCount,
      allDealsAggregate,
      openDealsForPipeline,
      expensesMonthly,
      monthlyCollections,
      allTimePayments,
      allTimeExpenses,
      allTimePurchasePayments,
      recurringInvoices,
      timeLoggedMinutes,
      activeEmployeeCount,
      distinctTimeEntryUsers,
    ] = await Promise.all([
      this.prisma.workspace.findFirst({
        where: {
          id: scope.workspaceId,
          tenantId: scope.tenantId,
          deletedAt: null,
        },
        select: { currency: true },
      }),
      this.sumInvoiceLineTotals(scope, {
        status: { in: [...INVOICED_STATUSES] },
        issueDate: { gte: monthStart, lt: monthEnd },
      }),
      this.sumCompletedPayments(scope, {
        paidAt: { gte: monthStart, lt: monthEnd },
      }),
      this.sumInvoiceBalanceDue(scope, {
        status: { in: [...OUTSTANDING_STATUSES] },
      }),
      this.sumInvoiceBalanceDue(scope, {
        status: InvoiceStatus.OVERDUE,
      }),
      this.prisma.invoice.count({
        where: {
          ...baseScope,
          status: { in: [...OUTSTANDING_STATUSES] },
        },
      }),
      this.prisma.client.count({
        where: baseScope,
      }),
      this.prisma.client.count({
        where: {
          ...baseScope,
          status: ClientStatus.ACTIVE,
        },
      }),
      this.prisma.client.count({
        where: {
          ...baseScope,
          OR: [
            { becameClientAt: { gte: monthStart, lt: monthEnd } },
            {
              becameClientAt: null,
              status: ClientStatus.ACTIVE,
              createdAt: { gte: monthStart, lt: monthEnd },
            },
          ],
        },
      }),
      this.prisma.clientActivity.findMany({
        where: {
          tenantId: scope.tenantId,
          activityType: ClientActivityType.STATUS_CHANGE,
          occurredAt: { gte: monthStart, lt: monthEnd },
          client: {
            workspaceId: scope.workspaceId,
            deletedAt: null,
          },
        },
        select: { metadata: true },
      }),
      this.prisma.client.count({
        where: {
          ...baseScope,
          status: { in: [...LOST_CLIENT_STATUSES] },
          updatedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      this.prisma.project.count({
        where: baseScope,
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: 'ACTIVE',
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: 'PLANNING',
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: 'ON_HOLD',
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: 'CANCELLED',
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: 'INVOICE_READY',
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: 'COMPLETED',
          completedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: 'COMPLETED',
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: { in: ['ACTIVE', 'ON_HOLD'] },
          targetEndDate: { not: null, lt: dayStart },
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          status: { in: ['ACTIVE', 'ON_HOLD'] },
          targetEndDate: {
            not: null,
            gte: dayStart,
            lt: endingSoonEnd,
          },
        },
      }),
      this.countProjectsOverBudget(scope, baseScope),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: { in: [...OPEN_TASK_STATUSES] },
          dueDate: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: { in: [...OPEN_TASK_STATUSES] },
          dueDate: { not: null, lt: dayStart },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: { in: [...OPEN_TASK_STATUSES] },
          assigneeUserId: { not: null },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: { in: [...OPEN_TASK_STATUSES] },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: TaskStatus.COMPLETED,
          assigneeUserId: { not: null },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: TaskStatus.BLOCKED,
          assigneeUserId: { not: null },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: { in: [...OPEN_TASK_STATUSES] },
          assigneeUserId: { not: null },
          dueDate: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: { in: [...OPEN_TASK_STATUSES] },
          assigneeUserId: { not: null },
          dueDate: { not: null, lt: dayStart },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseScope,
          parentTaskId: null,
          status: { in: [...OPEN_TASK_STATUSES] },
          assigneeUserId: { not: null },
          dueDate: {
            not: null,
            gte: dayStart,
            lt: endingSoonEnd,
          },
        },
      }),
      this.prisma.lead.count({
        where: baseScope,
      }),
      this.prisma.lead.count({
        where: {
          ...baseScope,
          status: 'QUALIFIED',
        },
      }),
      this.prisma.deal.count({
        where: {
          ...baseScope,
          stage: { in: [...OPEN_DEAL_STAGES] },
        },
      }),
      this.sumDealValue(scope, { stage: DealStage.WON }),
      this.sumDealValue(scope, { stage: DealStage.LOST }),
      this.prisma.deal.count({
        where: { ...baseScope, stage: DealStage.WON },
      }),
      this.prisma.deal.count({
        where: { ...baseScope, stage: DealStage.LOST },
      }),
      this.prisma.deal.aggregate({
        where: baseScope,
        _sum: { value: true },
        _count: { _all: true },
      }),
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          stage: { in: [...OPEN_DEAL_STAGES] },
        },
        select: { value: true, probability: true },
      }),
      this.sumExpenses(scope, {
        expenseDate: { gte: monthStart, lt: monthEnd },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.sumCompletedPayments(scope, {
        paidAt: { gte: monthStart, lt: monthEnd },
      }),
      this.sumCompletedPayments(scope, {}),
      this.sumExpenses(scope, {
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.sumPurchasePayments(scope, {}),
      this.prisma.recurringInvoice.findMany({
        where: {
          ...baseScope,
          isActive: true,
        },
        select: { frequency: true, template: true },
      }),
      this.prisma.timeEntry.aggregate({
        where: {
          ...baseScope,
          startTime: { gte: monthStart, lt: monthEnd },
          durationMinutes: { not: null },
        },
        _sum: { durationMinutes: true },
      }),
      this.prisma.employee.count({
        where: {
          ...baseScope,
          isActive: true,
        },
      }),
      this.prisma.timeEntry.findMany({
        where: {
          ...baseScope,
          startTime: { gte: monthStart, lt: monthEnd },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    let pipelineValue = 0;
    let expectedRevenue = 0;
    for (const deal of openDealsForPipeline) {
      const value = decimalToNumber(deal.value);
      pipelineValue += value;
      expectedRevenue += value * ((deal.probability ?? 0) / 100);
    }

    const totalDealsCount = allDealsAggregate._count._all;
    const totalDealsValue = decimalToNumber(allDealsAggregate._sum.value);
    const averageDealSize = totalDealsCount > 0 ? totalDealsValue / totalDealsCount : 0;
    const conversionRate =
      wonDealsCount + lostDealsCount > 0 ? wonDealsCount / (wonDealsCount + lostDealsCount) : 0;

    const clientsLost = resolveClientsLost(statusChangeActivities, clientsLostFallback);
    const retentionRate = clientsActive / Math.max(clientsActive + clientsLost, 1);

    const mrr = estimateMrr(recurringInvoices);
    const arr = mrr * 12;
    const profitMonthly = collectedMonthly - expensesMonthly;
    const netProfit = profitMonthly;
    const grossMargin =
      invoicedMonthly > 0 ? (invoicedMonthly - expensesMonthly) / invoicedMonthly : 0;
    const cashBalance = allTimePayments - allTimeExpenses - allTimePurchasePayments;

    const loggedMinutes = timeLoggedMinutes._sum.durationMinutes ?? 0;
    const capacityPeople =
      activeEmployeeCount > 0 ? activeEmployeeCount : distinctTimeEntryUsers.length;
    const capacityMinutes = capacityPeople * STANDARD_MONTH_CAPACITY_MINUTES;
    const teamUtilization =
      capacityMinutes > 0 ? Math.min(1.5, Math.max(0, loggedMinutes / capacityMinutes)) : 0;

    return {
      currency: workspace?.currency ?? 'USD',
      invoicedMonthly,
      collectedMonthly,
      outstandingAmount,
      overdueAmount,
      outstandingCount,
      clientsTotal,
      clientsActive,
      clientsNew,
      clientsLost,
      retentionRate,
      projectsTotal,
      projectsActive,
      projectsPlanning,
      projectsOnHold,
      projectsCancelled,
      projectsInvoiceReady,
      projectsCompletedThisMonth,
      projectsCompleted,
      projectsAtRisk,
      projectsEndingSoon,
      projectsOverBudget,
      tasksDueToday,
      tasksOverdue,
      tasksOpenTotal,
      tasksOpenGlobal,
      tasksCompleted,
      tasksBlocked,
      tasksAssignedDueToday,
      tasksAssignedOverdue,
      tasksDueThisWeek,
      leadCount,
      qualifiedLeads,
      openDeals,
      pipelineValue,
      expectedRevenue,
      wonRevenue,
      lostRevenue,
      conversionRate,
      averageDealSize,
      expensesMonthly,
      profitMonthly,
      cashBalance,
      monthlyCollections,
      monthlyExpenses: expensesMonthly,
      mrr,
      arr,
      netProfit,
      grossMargin,
      teamUtilization,
    };
  }

  async getAdminSummaryAggregates(
    scope: DashboardScope,
    actorUserId: string,
    asOf: Date,
  ): Promise<DashboardAdminSummary> {
    const since = new Date(asOf.getTime() - 24 * 60 * 60 * 1000);

    const [activeUsers, workspaceCount, pendingInvites, unreadNotifications, auditEventsLast24h] =
      await Promise.all([
        this.prisma.employee.count({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            deletedAt: null,
            isActive: true,
            user: {
              deletedAt: null,
              isActive: true,
            },
          },
        }),
        this.prisma.workspace.count({
          where: {
            tenantId: scope.tenantId,
            deletedAt: null,
          },
        }),
        this.prisma.userInvitation.count({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            deletedAt: null,
            status: InvitationStatus.PENDING,
            expiresAt: { gt: asOf },
          },
        }),
        this.prisma.notification.count({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            recipientUserId: actorUserId,
            isRead: false,
            deletedAt: null,
          },
        }),
        this.prisma.auditLog.count({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            occurredAt: { gte: since, lte: asOf },
          },
        }),
      ]);

    return {
      activeUsers,
      workspaceCount,
      pendingInvites,
      unreadNotifications,
      auditEventsLast24h,
    };
  }

  /** Counts projects whose invoiced line totals exceed budgetAmount. */
  private async countProjectsOverBudget(
    scope: DashboardScope,
    baseScope: {
      readonly tenantId: string;
      readonly workspaceId: string;
      readonly deletedAt: null;
    },
  ): Promise<number> {
    const projects = await this.prisma.project.findMany({
      where: {
        ...baseScope,
        budgetAmount: { not: null },
      },
      select: {
        id: true,
        budgetAmount: true,
      },
    });

    if (projects.length === 0) {
      return 0;
    }

    const projectIds = projects.map((project) => project.id);
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        projectId: { in: projectIds },
        status: { in: [...INVOICED_STATUSES] },
      },
      select: {
        projectId: true,
        lineItems: {
          where: { deletedAt: null },
          select: { total: true },
        },
      },
    });

    const spentByProject = new Map<string, number>();
    for (const invoice of invoices) {
      const lineTotal = invoice.lineItems.reduce(
        (sum, item) => sum + decimalToNumber(item.total),
        0,
      );
      spentByProject.set(
        invoice.projectId,
        (spentByProject.get(invoice.projectId) ?? 0) + lineTotal,
      );
    }

    let overBudget = 0;
    for (const project of projects) {
      const budget = decimalToNumber(project.budgetAmount);
      const spent = spentByProject.get(project.id) ?? 0;
      if (budget > 0 && spent > budget) {
        overBudget += 1;
      }
    }

    return overBudget;
  }

  private async sumDealValue(
    scope: DashboardScope,
    dealWhere: Prisma.DealWhereInput,
  ): Promise<number> {
    const result = await this.prisma.deal.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        ...dealWhere,
      },
      _sum: { value: true },
    });

    return decimalToNumber(result._sum.value);
  }

  private async sumInvoiceLineTotals(
    scope: DashboardScope,
    invoiceWhere: Prisma.InvoiceWhereInput,
  ): Promise<number> {
    const result = await this.prisma.invoiceLineItem.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        invoice: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          ...invoiceWhere,
        },
      },
      _sum: { total: true },
    });

    return decimalToNumber(result._sum.total);
  }

  /** Prefers balanceDue when present; falls back to line-item totals. */
  private async sumInvoiceBalanceDue(
    scope: DashboardScope,
    invoiceWhere: Prisma.InvoiceWhereInput,
  ): Promise<number> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        ...invoiceWhere,
      },
      select: {
        balanceDue: true,
        grandTotal: true,
        lineItems: {
          where: { deletedAt: null },
          select: { total: true },
        },
      },
    });

    let total = 0;
    for (const invoice of invoices) {
      if (invoice.balanceDue !== null) {
        total += decimalToNumber(invoice.balanceDue);
        continue;
      }

      if (invoice.grandTotal !== null) {
        total += decimalToNumber(invoice.grandTotal);
        continue;
      }

      total += invoice.lineItems.reduce((sum, item) => sum + decimalToNumber(item.total), 0);
    }

    return total;
  }

  private async sumCompletedPayments(
    scope: DashboardScope,
    paymentWhere: Prisma.PaymentWhereInput,
  ): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
        ...paymentWhere,
      },
      _sum: { amount: true },
    });

    return decimalToNumber(result._sum.amount);
  }

  private async sumExpenses(
    scope: DashboardScope,
    expenseWhere: Prisma.ExpenseWhereInput,
  ): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        ...expenseWhere,
      },
      _sum: { amount: true },
    });

    return decimalToNumber(result._sum.amount);
  }

  private async sumPurchasePayments(
    scope: DashboardScope,
    paymentWhere: Prisma.PurchasePaymentWhereInput,
  ): Promise<number> {
    const result = await this.prisma.purchasePayment.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
        ...paymentWhere,
      },
      _sum: { amount: true },
    });

    return decimalToNumber(result._sum.amount);
  }
}

/** Counts STATUS_CHANGE activities that transition to INACTIVE/ARCHIVED; falls back when metadata shape is unknown. */
function resolveClientsLost(
  activities: readonly { readonly metadata: Prisma.JsonValue | null }[],
  fallback: number,
): number {
  if (activities.length === 0) {
    return fallback;
  }

  let lost = 0;
  let recognized = 0;
  for (const activity of activities) {
    const transition = parseLostStatusTransition(activity.metadata);
    if (transition === null) {
      continue;
    }
    recognized += 1;
    if (transition) {
      lost += 1;
    }
  }

  if (recognized === 0) {
    return fallback;
  }

  return lost;
}

/** Returns true/false when metadata encodes a status transition; null when shape is unrecognized. */
function parseLostStatusTransition(metadata: Prisma.JsonValue | null): boolean | null {
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const candidates = [
    record.toStatus,
    record.newStatus,
    record.status,
    record.to,
    record.after,
    record.currentStatus,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return LOST_STATUS_SET.has(candidate);
    }
  }

  const nestedTo = record.to;
  if (nestedTo !== null && typeof nestedTo === 'object' && !Array.isArray(nestedTo)) {
    const nestedRecord = nestedTo as Record<string, unknown>;
    const nestedStatus = nestedRecord.status;
    if (typeof nestedStatus === 'string' && nestedStatus.trim() !== '') {
      return LOST_STATUS_SET.has(nestedStatus);
    }
  }

  return null;
}

function estimateMrr(
  recurringInvoices: readonly { frequency: RecurringFrequency; template: Prisma.JsonValue }[],
): number {
  let mrr = 0;
  for (const recurring of recurringInvoices) {
    const amount = parseTemplateAmount(recurring.template);
    if (amount <= 0) {
      continue;
    }

    switch (recurring.frequency) {
      case RecurringFrequency.WEEKLY:
        mrr += amount * 4;
        break;
      case RecurringFrequency.MONTHLY:
        mrr += amount;
        break;
      case RecurringFrequency.QUARTERLY:
        mrr += amount / 3;
        break;
      case RecurringFrequency.YEARLY:
        mrr += amount / 12;
        break;
      default: {
        const exhaustive: never = recurring.frequency;
        void exhaustive;
        break;
      }
    }
  }

  return mrr;
}

function parseTemplateAmount(template: Prisma.JsonValue): number {
  if (template === null || typeof template !== 'object' || Array.isArray(template)) {
    return 0;
  }

  const record = template as Record<string, unknown>;
  const candidates = [record.grandTotal, record.amount];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return value.toNumber();
}

/** UTC calendar windows for month and day relative to asOf. */
function resolveUtcWindows(asOf: Date): {
  monthStart: Date;
  monthEnd: Date;
  dayStart: Date;
  dayEnd: Date;
} {
  const monthStart = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1));
  const dayStart = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  const dayEnd = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate() + 1),
  );

  return { monthStart, monthEnd, dayStart, dayEnd };
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}
