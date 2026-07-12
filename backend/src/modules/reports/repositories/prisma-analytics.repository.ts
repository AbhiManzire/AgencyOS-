import { Injectable } from '@nestjs/common';
import {
  ApprovalStatus,
  DealStage,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  RecurringFrequency,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AnalyticsBreakdown,
  AnalyticsDomain,
  AnalyticsGranularity,
  AnalyticsResult,
  AnalyticsSeries,
  AnalyticsSeriesPoint,
  ReportFilters,
  ReportMetric,
  ReportQuery,
  ReportsScope,
} from '../reports.types';
import type { AnalyticsRepository } from './reports.repository.interface';

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
const OPEN_TASK_STATUSES: readonly TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.BLOCKED,
];
const OPEN_DEAL_STAGES: readonly DealStage[] = [
  DealStage.NEW,
  DealStage.CONTACTED,
  DealStage.QUALIFIED,
  DealStage.DISCOVERY,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
];
const NON_REJECTED_APPROVAL: readonly ApprovalStatus[] = [
  ApprovalStatus.APPROVED,
  ApprovalStatus.PENDING,
  ApprovalStatus.NOT_REQUIRED,
];

@Injectable()
export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(
    scope: ReportsScope,
    domain: AnalyticsDomain,
    query: ReportQuery,
  ): Promise<AnalyticsResult> {
    const currency = query.currency ?? (await this.resolveCurrency(scope));
    const granularity = resolveGranularity(query.period);
    const fromIso = toDateOnly(query.from);
    const toIso = toDateOnly(query.to);
    const filters = extractFilters(query);

    switch (domain) {
      case 'founder':
        return this.buildFounderAnalytics(
          scope,
          query,
          currency,
          fromIso,
          toIso,
          granularity,
          filters,
        );
      case 'clients':
        return this.buildClientsAnalytics(
          scope,
          query,
          currency,
          fromIso,
          toIso,
          granularity,
          filters,
        );
      case 'projects':
        return this.buildProjectsAnalytics(
          scope,
          query,
          currency,
          fromIso,
          toIso,
          granularity,
          filters,
        );
      case 'tasks':
        return this.buildTasksAnalytics(
          scope,
          query,
          currency,
          fromIso,
          toIso,
          granularity,
          filters,
        );
      case 'sales':
        return this.buildSalesAnalytics(
          scope,
          query,
          currency,
          fromIso,
          toIso,
          granularity,
          filters,
        );
      case 'finance':
        return this.buildFinanceAnalytics(
          scope,
          query,
          currency,
          fromIso,
          toIso,
          granularity,
          filters,
        );
      default: {
        const exhaustive: never = domain;
        throw new Error(`Unsupported analytics domain: ${String(exhaustive)}`);
      }
    }
  }

  private async buildFounderAnalytics(
    scope: ReportsScope,
    query: ReportQuery,
    currency: string,
    fromIso: string,
    toIso: string,
    granularity: AnalyticsGranularity,
    filters: ReportFilters,
  ): Promise<AnalyticsResult> {
    const { start, endExclusive } = toUtcBounds(query);
    const buckets = buildPeriodBuckets(query.from, query.to, granularity);
    const invoiceFilter = invoiceWhere(filters);
    const expenseFilter = expenseWhere(filters);
    const dealFilter = dealWhere(filters);

    const [
      revenue,
      collections,
      expenses,
      outstanding,
      openDealsForPipeline,
      recurringInvoices,
      paymentRows,
      expenseRows,
    ] = await Promise.all([
      this.sumInvoiceLineTotals(scope, {
        ...invoiceFilter,
        status: { in: [...INVOICED_STATUSES] },
        issueDate: { gte: start, lt: endExclusive },
      }),
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
        ...paymentInvoiceFilter(filters),
      }),
      this.sumExpenses(scope, {
        ...expenseFilter,
        expenseDate: { gte: start, lt: endExclusive },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.computeOutstandingAmount(scope, filters),
      this.prisma.deal.findMany({
        where: {
          ...this.baseScope(scope),
          ...dealFilter,
          stage: { in: [...OPEN_DEAL_STAGES] },
        },
        select: { value: true, probability: true },
      }),
      this.prisma.recurringInvoice.findMany({
        where: { ...this.baseScope(scope), isActive: true },
        select: { frequency: true, template: true },
      }),
      this.prisma.payment.findMany({
        where: {
          ...this.baseScope(scope),
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: start, lt: endExclusive },
          ...paymentInvoiceFilter(filters),
        },
        select: { paidAt: true, amount: true },
      }),
      this.prisma.expense.findMany({
        where: {
          ...this.baseScope(scope),
          ...expenseFilter,
          expenseDate: { gte: start, lt: endExclusive },
          approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
        },
        select: { expenseDate: true, amount: true },
      }),
    ]);

    let pipeline = 0;
    for (const deal of openDealsForPipeline) {
      pipeline += decimalToNumber(deal.value);
    }

    const profit = collections - expenses;
    const mrr = estimateMrr(recurringInvoices);

    const collectionPoints = bucketSum(
      buckets,
      paymentRows.map((row) => ({
        date: row.paidAt,
        value: decimalToNumber(row.amount),
      })),
      granularity,
    );
    const expensePoints = bucketSum(
      buckets,
      expenseRows.map((row) => ({ date: row.expenseDate, value: decimalToNumber(row.amount) })),
      granularity,
    );
    const profitPoints: AnalyticsSeriesPoint[] = collectionPoints.map((point, index) => ({
      period: point.period,
      value: roundMoney(point.value - (expensePoints[index]?.value ?? 0)),
    }));

    const metrics: ReportMetric[] = [
      { key: 'revenue', label: 'Revenue (invoiced)', value: revenue, format: 'currency' },
      { key: 'collections', label: 'Collections', value: collections, format: 'currency' },
      { key: 'expenses', label: 'Expenses', value: expenses, format: 'currency' },
      { key: 'profit', label: 'Profit', value: roundMoney(profit), format: 'currency' },
      { key: 'outstanding', label: 'Outstanding', value: outstanding, format: 'currency' },
      { key: 'pipeline', label: 'Pipeline', value: roundMoney(pipeline), format: 'currency' },
      { key: 'mrr', label: 'MRR', value: roundMoney(mrr), format: 'currency' },
    ];

    const series: AnalyticsSeries[] = [
      {
        key: 'collections',
        label: 'Collections',
        chartType: 'line',
        points: collectionPoints,
        format: 'currency',
      },
      {
        key: 'expenses',
        label: 'Expenses',
        chartType: 'line',
        points: expensePoints,
        format: 'currency',
      },
      {
        key: 'profit',
        label: 'Profit',
        chartType: 'area',
        points: profitPoints,
        format: 'currency',
      },
      {
        key: 'mrr',
        label: 'MRR',
        chartType: 'line',
        points: buckets.map((bucket) => ({ period: bucket.key, value: roundMoney(mrr) })),
        format: 'currency',
      },
    ];

    const breakdowns: AnalyticsBreakdown[] = [
      {
        key: 'kpi_mix',
        label: 'Collections vs expenses',
        chartType: 'pie',
        format: 'currency',
        items: [
          { key: 'collections', label: 'Collections', value: collections },
          { key: 'expenses', label: 'Expenses', value: expenses },
        ],
      },
    ];

    return {
      domain: 'founder',
      from: fromIso,
      to: toIso,
      currency,
      granularity,
      metrics,
      series,
      breakdowns,
    };
  }

  private async buildClientsAnalytics(
    scope: ReportsScope,
    query: ReportQuery,
    currency: string,
    fromIso: string,
    toIso: string,
    granularity: AnalyticsGranularity,
    filters: ReportFilters,
  ): Promise<AnalyticsResult> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(query);
    const clientFilter = clientWhere(filters);
    const buckets = buildPeriodBuckets(query.from, query.to, granularity);

    const [statusGroups, newClients, lostClients, clientsCreated, invoices, outstandingInvoices] =
      await Promise.all([
        this.prisma.client.groupBy({
          by: ['status'],
          where: { ...baseScope, ...clientFilter },
          _count: { _all: true },
        }),
        this.prisma.client.count({
          where: {
            ...baseScope,
            ...clientFilter,
            OR: [
              { createdAt: { gte: start, lt: endExclusive } },
              { becameClientAt: { gte: start, lt: endExclusive } },
            ],
          },
        }),
        this.prisma.client.count({
          where: {
            ...baseScope,
            ...clientFilter,
            status: { in: ['INACTIVE', 'ARCHIVED'] },
            updatedAt: { gte: start, lt: endExclusive },
          },
        }),
        this.prisma.client.findMany({
          where: {
            ...baseScope,
            ...clientFilter,
            createdAt: { gte: start, lt: endExclusive },
          },
          select: { createdAt: true },
        }),
        this.prisma.invoice.findMany({
          where: {
            ...baseScope,
            ...invoiceWhere(filters),
            status: { in: [...INVOICED_STATUSES] },
            issueDate: { gte: start, lt: endExclusive },
          },
          select: {
            clientId: true,
            client: { select: { displayName: true, status: true } },
            lineItems: { where: { deletedAt: null }, select: { total: true } },
          },
        }),
        this.prisma.invoice.findMany({
          where: {
            ...baseScope,
            ...invoiceWhere(filters),
            status: { in: [...OUTSTANDING_STATUSES] },
          },
          select: {
            clientId: true,
            client: { select: { displayName: true } },
            balanceDue: true,
            grandTotal: true,
            lineItems: { where: { deletedAt: null }, select: { total: true } },
          },
        }),
      ]);

    const active = statusGroups.find((g) => g.status === 'ACTIVE')?._count._all ?? 0;
    const inactive = statusGroups.find((g) => g.status === 'INACTIVE')?._count._all ?? 0;
    const total = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
    const retentionRate = total > 0 ? active / total : 0;
    const growthRate = total > 0 ? newClients / total : 0;

    const revenueByClient = new Map<string, { label: string; value: number }>();
    for (const invoice of invoices) {
      const amount = invoice.lineItems.reduce((sum, item) => sum + decimalToNumber(item.total), 0);
      const existing = revenueByClient.get(invoice.clientId);
      if (existing) {
        existing.value += amount;
      } else {
        revenueByClient.set(invoice.clientId, {
          label: invoice.client.displayName,
          value: amount,
        });
      }
    }

    const outstandingByClient = new Map<string, { label: string; value: number }>();
    for (const invoice of outstandingInvoices) {
      const amount = invoiceAmount(invoice);
      const existing = outstandingByClient.get(invoice.clientId);
      if (existing) {
        existing.value += amount;
      } else {
        outstandingByClient.set(invoice.clientId, {
          label: invoice.client.displayName,
          value: amount,
        });
      }
    }

    const topClients = [...revenueByClient.entries()]
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 10)
      .map(([key, item]) => ({
        key,
        label: item.label,
        value: roundMoney(item.value),
      }));

    const newClientPoints = bucketCount(
      buckets,
      clientsCreated.map((c) => c.createdAt),
      granularity,
    );

    const metrics: ReportMetric[] = [
      { key: 'total', label: 'Total clients', value: total, format: 'number' },
      { key: 'new', label: 'New clients', value: newClients, format: 'number' },
      { key: 'lost', label: 'Lost / inactive', value: lostClients, format: 'number' },
      {
        key: 'retention',
        label: 'Retention rate',
        value: roundPercent(retentionRate),
        format: 'percent',
      },
      {
        key: 'growth',
        label: 'Growth rate',
        value: roundPercent(growthRate),
        format: 'percent',
      },
      { key: 'inactive', label: 'Inactive', value: inactive, format: 'number' },
    ];

    const series: AnalyticsSeries[] = [
      {
        key: 'new_clients',
        label: 'New clients',
        chartType: 'bar',
        points: newClientPoints,
        format: 'number',
      },
    ];

    const breakdowns: AnalyticsBreakdown[] = [
      {
        key: 'top_clients',
        label: 'Top clients by revenue',
        chartType: 'bar',
        format: 'currency',
        items: topClients,
      },
      {
        key: 'outstanding_by_client',
        label: 'Outstanding by client',
        chartType: 'bar',
        format: 'currency',
        items: [...outstandingByClient.entries()]
          .sort((a, b) => b[1].value - a[1].value)
          .slice(0, 10)
          .map(([key, item]) => ({
            key,
            label: item.label,
            value: roundMoney(item.value),
          })),
      },
      {
        key: 'health_score',
        label: 'Client health (by status)',
        chartType: 'pie',
        format: 'number',
        items: statusGroups.map((group) => ({
          key: group.status,
          label: group.status,
          value: group._count._all,
        })),
      },
    ];

    return {
      domain: 'clients',
      from: fromIso,
      to: toIso,
      currency,
      granularity,
      metrics,
      series,
      breakdowns,
    };
  }

  private async buildProjectsAnalytics(
    scope: ReportsScope,
    query: ReportQuery,
    currency: string,
    fromIso: string,
    toIso: string,
    granularity: AnalyticsGranularity,
    filters: ReportFilters,
  ): Promise<AnalyticsResult> {
    const baseScope = this.baseScope(scope);
    const projectFilter = projectWhere(filters);
    const dayStart = startOfUtcDay(new Date());
    const endingSoonEnd = addUtcDays(dayStart, 7);

    const [statusGroups, projects, endingSoon, delayed, completed] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        where: { ...baseScope, ...projectFilter },
        _count: { _all: true },
      }),
      this.prisma.project.findMany({
        where: { ...baseScope, ...projectFilter },
        select: {
          id: true,
          name: true,
          status: true,
          budgetAmount: true,
          estimatedHours: true,
          actualHours: true,
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          ...projectFilter,
          status: { in: ['ACTIVE', 'ON_HOLD'] },
          targetEndDate: { not: null, gte: dayStart, lt: endingSoonEnd },
        },
      }),
      this.prisma.project.count({
        where: {
          ...baseScope,
          ...projectFilter,
          status: { in: ['ACTIVE', 'ON_HOLD'] },
          targetEndDate: { not: null, lt: dayStart },
        },
      }),
      this.prisma.project.count({
        where: { ...baseScope, ...projectFilter, status: 'COMPLETED' },
      }),
    ]);

    const total = projects.length;
    const completionPct = total > 0 ? completed / total : 0;

    let budgetUtilSum = 0;
    let budgetUtilCount = 0;
    let hoursUtilSum = 0;
    let hoursUtilCount = 0;

    const projectIds = projects.map((p) => p.id);
    const invoices =
      projectIds.length === 0
        ? []
        : await this.prisma.invoice.findMany({
            where: {
              ...baseScope,
              projectId: { in: projectIds },
              status: { in: [...INVOICED_STATUSES] },
            },
            select: {
              projectId: true,
              lineItems: { where: { deletedAt: null }, select: { total: true } },
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
      if (budget > 0) {
        const spent = spentByProject.get(project.id) ?? 0;
        budgetUtilSum += spent / budget;
        budgetUtilCount += 1;
        if (spent > budget) {
          overBudget += 1;
        }
      }
      const estimated = decimalToNumber(project.estimatedHours);
      const actual = decimalToNumber(project.actualHours);
      if (estimated > 0) {
        hoursUtilSum += actual / estimated;
        hoursUtilCount += 1;
      }
    }

    const metrics: ReportMetric[] = [
      { key: 'total', label: 'Total projects', value: total, format: 'number' },
      { key: 'endingSoon', label: 'Ending soon', value: endingSoon, format: 'number' },
      { key: 'overBudget', label: 'Over budget', value: overBudget, format: 'number' },
      { key: 'delayed', label: 'Delayed', value: delayed, format: 'number' },
      {
        key: 'completionPct',
        label: 'Completion %',
        value: roundPercent(completionPct),
        format: 'percent',
      },
      {
        key: 'budgetUtilization',
        label: 'Avg budget utilization',
        value: roundPercent(budgetUtilCount > 0 ? budgetUtilSum / budgetUtilCount : 0),
        format: 'percent',
      },
      {
        key: 'hoursUtilization',
        label: 'Avg hours utilization',
        value: roundPercent(hoursUtilCount > 0 ? hoursUtilSum / hoursUtilCount : 0),
        format: 'percent',
      },
    ];

    const series: AnalyticsSeries[] = [
      {
        key: 'status_counts',
        label: 'Projects by status',
        chartType: 'bar',
        format: 'number',
        points: statusGroups.map((group) => ({
          period: group.status,
          value: group._count._all,
        })),
      },
    ];

    const breakdowns: AnalyticsBreakdown[] = [
      {
        key: 'status',
        label: 'Status breakdown',
        chartType: 'pie',
        format: 'number',
        items: statusGroups.map((group) => ({
          key: group.status,
          label: group.status,
          value: group._count._all,
        })),
      },
    ];

    return {
      domain: 'projects',
      from: fromIso,
      to: toIso,
      currency,
      granularity,
      metrics,
      series,
      breakdowns,
    };
  }

  private async buildTasksAnalytics(
    scope: ReportsScope,
    query: ReportQuery,
    currency: string,
    fromIso: string,
    toIso: string,
    granularity: AnalyticsGranularity,
    filters: ReportFilters,
  ): Promise<AnalyticsResult> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(query);
    const dayStart = startOfUtcDay(new Date());
    const taskFilter = taskWhere(filters);

    const [open, completed, overdue, blocked, byUser, byProject, completedTasks] =
      await Promise.all([
        this.prisma.task.count({
          where: {
            ...baseScope,
            ...taskFilter,
            parentTaskId: null,
            status: { in: [...OPEN_TASK_STATUSES] },
          },
        }),
        this.prisma.task.count({
          where: {
            ...baseScope,
            ...taskFilter,
            parentTaskId: null,
            status: TaskStatus.COMPLETED,
            completedAt: { gte: start, lt: endExclusive },
          },
        }),
        this.prisma.task.count({
          where: {
            ...baseScope,
            ...taskFilter,
            parentTaskId: null,
            status: { in: [...OPEN_TASK_STATUSES] },
            dueDate: { not: null, lt: dayStart },
          },
        }),
        this.prisma.task.count({
          where: {
            ...baseScope,
            ...taskFilter,
            parentTaskId: null,
            status: TaskStatus.BLOCKED,
          },
        }),
        this.prisma.task.groupBy({
          by: ['assigneeUserId'],
          where: {
            ...baseScope,
            ...taskFilter,
            parentTaskId: null,
            assigneeUserId: { not: null },
          },
          _count: { _all: true },
        }),
        this.prisma.task.groupBy({
          by: ['projectId'],
          where: { ...baseScope, ...taskFilter, parentTaskId: null },
          _count: { _all: true },
        }),
        this.prisma.task.findMany({
          where: {
            ...baseScope,
            ...taskFilter,
            parentTaskId: null,
            status: TaskStatus.COMPLETED,
            completedAt: { gte: start, lt: endExclusive, not: null },
          },
          select: { createdAt: true, completedAt: true },
        }),
      ]);

    let avgCompletionHours = 0;
    if (completedTasks.length > 0) {
      const totalHours = completedTasks.reduce((sum, task) => {
        if (task.completedAt === null) {
          return sum;
        }
        return sum + (task.completedAt.getTime() - task.createdAt.getTime()) / 3_600_000;
      }, 0);
      avgCompletionHours = totalHours / completedTasks.length;
    }

    const assigneeIds = byUser
      .map((g) => g.assigneeUserId)
      .filter((id): id is string => id !== null);
    const projectIds = byProject.map((g) => g.projectId);

    const [users, projects] = await Promise.all([
      assigneeIds.length === 0
        ? Promise.resolve([])
        : this.prisma.user.findMany({
            where: { id: { in: assigneeIds }, deletedAt: null },
            select: { id: true, displayName: true, email: true },
          }),
      projectIds.length === 0
        ? Promise.resolve([])
        : this.prisma.project.findMany({
            where: { id: { in: projectIds }, deletedAt: null },
            select: { id: true, name: true },
          }),
    ]);

    const userName = new Map(users.map((u) => [u.id, u.displayName ?? u.email] as const));
    const projectName = new Map(projects.map((p) => [p.id, p.name] as const));

    const metrics: ReportMetric[] = [
      { key: 'open', label: 'Open tasks', value: open, format: 'number' },
      { key: 'completed', label: 'Completed in range', value: completed, format: 'number' },
      { key: 'overdue', label: 'Overdue', value: overdue, format: 'number' },
      { key: 'blocked', label: 'Blocked', value: blocked, format: 'number' },
      {
        key: 'avgCompletionHours',
        label: 'Avg completion time (hours)',
        value: roundMoney(avgCompletionHours),
        format: 'number',
      },
    ];

    const series: AnalyticsSeries[] = [
      {
        key: 'task_status',
        label: 'Task status mix',
        chartType: 'bar',
        format: 'number',
        points: [
          { period: 'open', value: open },
          { period: 'completed', value: completed },
          { period: 'overdue', value: overdue },
          { period: 'blocked', value: blocked },
        ],
      },
    ];

    const breakdowns: AnalyticsBreakdown[] = [
      {
        key: 'by_user',
        label: 'Tasks by user',
        chartType: 'bar',
        format: 'number',
        items: byUser
          .filter((g) => g.assigneeUserId !== null)
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 15)
          .map((g) => ({
            key: g.assigneeUserId ?? 'unassigned',
            label: userName.get(g.assigneeUserId ?? '') ?? 'Unknown',
            value: g._count._all,
          })),
      },
      {
        key: 'by_project',
        label: 'Tasks by project',
        chartType: 'bar',
        format: 'number',
        items: byProject
          .sort((a, b) => b._count._all - a._count._all)
          .slice(0, 15)
          .map((g) => ({
            key: g.projectId,
            label: projectName.get(g.projectId) ?? g.projectId,
            value: g._count._all,
          })),
      },
    ];

    return {
      domain: 'tasks',
      from: fromIso,
      to: toIso,
      currency,
      granularity,
      metrics,
      series,
      breakdowns,
    };
  }

  private async buildSalesAnalytics(
    scope: ReportsScope,
    query: ReportQuery,
    currency: string,
    fromIso: string,
    toIso: string,
    granularity: AnalyticsGranularity,
    filters: ReportFilters,
  ): Promise<AnalyticsResult> {
    const baseScope = this.baseScope(scope);
    const dealFilter = dealWhere(filters);
    const { start, endExclusive } = toUtcBounds(query);

    const [
      openDealsForPipeline,
      wonInRange,
      lostInRange,
      wonCount,
      lostCount,
      allDealsAggregate,
      stageGroups,
      byOwner,
      leadsBySource,
      wonDealsForAvg,
    ] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          ...dealFilter,
          stage: { in: [...OPEN_DEAL_STAGES] },
        },
        select: { value: true, probability: true },
      }),
      this.sumDealValue(scope, {
        ...dealFilter,
        stage: DealStage.WON,
        wonAt: { gte: start, lt: endExclusive },
      }),
      this.sumDealValue(scope, {
        ...dealFilter,
        stage: DealStage.LOST,
        lostAt: { gte: start, lt: endExclusive },
      }),
      this.prisma.deal.count({
        where: {
          ...baseScope,
          ...dealFilter,
          stage: DealStage.WON,
          wonAt: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.deal.count({
        where: {
          ...baseScope,
          ...dealFilter,
          stage: DealStage.LOST,
          lostAt: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.deal.aggregate({
        where: { ...baseScope, ...dealFilter },
        _sum: { value: true },
        _count: { _all: true },
      }),
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { ...baseScope, ...dealFilter },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.deal.groupBy({
        by: ['ownerUserId'],
        where: { ...baseScope, ...dealFilter, ownerUserId: { not: null } },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: baseScope,
        _count: { _all: true },
      }),
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          ...dealFilter,
          stage: DealStage.WON,
          wonAt: { gte: start, lt: endExclusive },
        },
        select: { value: true },
      }),
    ]);

    let pipeline = 0;
    let expected = 0;
    for (const deal of openDealsForPipeline) {
      const value = decimalToNumber(deal.value);
      pipeline += value;
      expected += value * ((deal.probability ?? 0) / 100);
    }

    const conversion = wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : 0;
    const avgDeal =
      wonDealsForAvg.length > 0
        ? wonDealsForAvg.reduce((sum, d) => sum + decimalToNumber(d.value), 0) /
          wonDealsForAvg.length
        : allDealsAggregate._count._all > 0
          ? decimalToNumber(allDealsAggregate._sum.value) / allDealsAggregate._count._all
          : 0;

    const ownerIds = byOwner.map((g) => g.ownerUserId).filter((id): id is string => id !== null);
    const owners =
      ownerIds.length === 0
        ? []
        : await this.prisma.user.findMany({
            where: { id: { in: ownerIds }, deletedAt: null },
            select: { id: true, displayName: true, email: true },
          });
    const ownerName = new Map(owners.map((u) => [u.id, u.displayName ?? u.email] as const));

    const metrics: ReportMetric[] = [
      { key: 'pipeline', label: 'Pipeline', value: roundMoney(pipeline), format: 'currency' },
      {
        key: 'expected',
        label: 'Expected revenue',
        value: roundMoney(expected),
        format: 'currency',
      },
      { key: 'won', label: 'Won revenue', value: wonInRange, format: 'currency' },
      { key: 'lost', label: 'Lost revenue', value: lostInRange, format: 'currency' },
      {
        key: 'conversion',
        label: 'Conversion rate',
        value: roundPercent(conversion),
        format: 'percent',
      },
      { key: 'avgDeal', label: 'Avg deal size', value: roundMoney(avgDeal), format: 'currency' },
    ];

    const series: AnalyticsSeries[] = [
      {
        key: 'funnel',
        label: 'Funnel stages',
        chartType: 'bar',
        format: 'number',
        points: stageGroups.map((g) => ({
          period: g.stage,
          value: g._count._all,
        })),
      },
    ];

    const breakdowns: AnalyticsBreakdown[] = [
      {
        key: 'lead_sources',
        label: 'Lead sources',
        chartType: 'pie',
        format: 'number',
        items: leadsBySource.map((g) => ({
          key: g.source,
          label: g.source,
          value: g._count._all,
        })),
      },
      {
        key: 'by_owner',
        label: 'Deals by owner',
        chartType: 'bar',
        format: 'currency',
        items: byOwner
          .filter((g) => g.ownerUserId !== null)
          .sort((a, b) => decimalToNumber(b._sum.value) - decimalToNumber(a._sum.value))
          .slice(0, 15)
          .map((g) => ({
            key: g.ownerUserId ?? 'unassigned',
            label: ownerName.get(g.ownerUserId ?? '') ?? 'Unknown',
            value: roundMoney(decimalToNumber(g._sum.value)),
          })),
      },
      {
        key: 'stages',
        label: 'Pipeline by stage',
        chartType: 'bar',
        format: 'currency',
        items: stageGroups.map((g) => ({
          key: g.stage,
          label: g.stage,
          value: roundMoney(decimalToNumber(g._sum.value)),
        })),
      },
    ];

    return {
      domain: 'sales',
      from: fromIso,
      to: toIso,
      currency,
      granularity,
      metrics,
      series,
      breakdowns,
    };
  }

  private async buildFinanceAnalytics(
    scope: ReportsScope,
    query: ReportQuery,
    currency: string,
    fromIso: string,
    toIso: string,
    granularity: AnalyticsGranularity,
    filters: ReportFilters,
  ): Promise<AnalyticsResult> {
    const { start, endExclusive } = toUtcBounds(query);
    const buckets = buildPeriodBuckets(query.from, query.to, granularity);
    const expenseFilter = expenseWhere(filters);

    const [
      collections,
      expenses,
      purchaseOutflows,
      outstanding,
      receivables,
      payables,
      paymentRows,
      expenseRows,
      topExpenseGroups,
      creditNotes,
    ] = await Promise.all([
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
        ...paymentInvoiceFilter(filters),
      }),
      this.sumExpenses(scope, {
        ...expenseFilter,
        expenseDate: { gte: start, lt: endExclusive },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.sumPurchasePayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
      }),
      this.computeOutstandingAmount(scope, filters),
      this.computeOutstandingAmount(scope, filters),
      this.sumPurchaseBalanceDue(scope),
      this.prisma.payment.findMany({
        where: {
          ...this.baseScope(scope),
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: start, lt: endExclusive },
          ...paymentInvoiceFilter(filters),
        },
        select: { paidAt: true, amount: true },
      }),
      this.prisma.expense.findMany({
        where: {
          ...this.baseScope(scope),
          ...expenseFilter,
          expenseDate: { gte: start, lt: endExclusive },
          approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
        },
        select: { expenseDate: true, amount: true, category: true },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          ...this.baseScope(scope),
          ...expenseFilter,
          expenseDate: { gte: start, lt: endExclusive },
          approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
        },
        _sum: { amount: true },
      }),
      this.sumCreditNotes(scope, {
        issueDate: { gte: start, lt: endExclusive },
      }),
    ]);

    const profit = collections - expenses;
    const cashFlow = collections - expenses - purchaseOutflows;

    const revenuePoints = bucketSum(
      buckets,
      paymentRows.map((row) => ({
        date: row.paidAt,
        value: decimalToNumber(row.amount),
      })),
      granularity,
    );
    const expensePoints = bucketSum(
      buckets,
      expenseRows.map((row) => ({ date: row.expenseDate, value: decimalToNumber(row.amount) })),
      granularity,
    );
    const profitPoints: AnalyticsSeriesPoint[] = revenuePoints.map((point, index) => ({
      period: point.period,
      value: roundMoney(point.value - (expensePoints[index]?.value ?? 0)),
    }));
    const cashFlowPoints: AnalyticsSeriesPoint[] = revenuePoints.map((point, index) => ({
      period: point.period,
      value: roundMoney(point.value - (expensePoints[index]?.value ?? 0)),
    }));

    const metrics: ReportMetric[] = [
      { key: 'collections', label: 'Collections', value: collections, format: 'currency' },
      { key: 'expenses', label: 'Expenses', value: expenses, format: 'currency' },
      { key: 'profit', label: 'Profit', value: roundMoney(profit), format: 'currency' },
      { key: 'cashFlow', label: 'Cash flow', value: roundMoney(cashFlow), format: 'currency' },
      { key: 'outstanding', label: 'Outstanding', value: outstanding, format: 'currency' },
      { key: 'receivables', label: 'Receivables', value: receivables, format: 'currency' },
      { key: 'payables', label: 'Payables', value: payables, format: 'currency' },
      { key: 'creditNotes', label: 'Credit notes', value: creditNotes, format: 'currency' },
    ];

    const series: AnalyticsSeries[] = [
      {
        key: 'revenue_trend',
        label: 'Revenue (collections)',
        chartType: 'line',
        points: revenuePoints,
        format: 'currency',
      },
      {
        key: 'expense_trend',
        label: 'Expenses',
        chartType: 'line',
        points: expensePoints,
        format: 'currency',
      },
      {
        key: 'profit_trend',
        label: 'Profit',
        chartType: 'area',
        points: profitPoints,
        format: 'currency',
      },
      {
        key: 'cash_flow_trend',
        label: 'Cash flow',
        chartType: 'line',
        points: cashFlowPoints,
        format: 'currency',
      },
    ];

    const breakdowns: AnalyticsBreakdown[] = [
      {
        key: 'top_expenses',
        label: 'Top expenses by category',
        chartType: 'bar',
        format: 'currency',
        items: topExpenseGroups
          .sort((a, b) => decimalToNumber(b._sum.amount) - decimalToNumber(a._sum.amount))
          .slice(0, 10)
          .map((g) => ({
            key: g.category,
            label: g.category,
            value: roundMoney(decimalToNumber(g._sum.amount)),
          })),
      },
    ];

    return {
      domain: 'finance',
      from: fromIso,
      to: toIso,
      currency,
      granularity,
      metrics,
      series,
      breakdowns,
    };
  }

  private baseScope(scope: ReportsScope) {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
    };
  }

  private async resolveCurrency(scope: ReportsScope): Promise<string> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: scope.workspaceId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      select: { currency: true },
    });
    return workspace?.currency ?? 'USD';
  }

  private async sumInvoiceLineTotals(
    scope: ReportsScope,
    invoiceWhereInput: Prisma.InvoiceWhereInput,
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
          ...invoiceWhereInput,
        },
      },
      _sum: { total: true },
    });
    return roundMoney(decimalToNumber(result._sum.total));
  }

  private async sumCompletedPayments(
    scope: ReportsScope,
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
    return roundMoney(decimalToNumber(result._sum.amount));
  }

  private async sumExpenses(
    scope: ReportsScope,
    expenseWhereInput: Prisma.ExpenseWhereInput,
  ): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        ...expenseWhereInput,
      },
      _sum: { amount: true },
    });
    return roundMoney(decimalToNumber(result._sum.amount));
  }

  private async sumPurchasePayments(
    scope: ReportsScope,
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
    return roundMoney(decimalToNumber(result._sum.amount));
  }

  private async sumCreditNotes(
    scope: ReportsScope,
    creditNoteWhere: Prisma.CreditNoteWhereInput,
  ): Promise<number> {
    const result = await this.prisma.creditNote.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        ...creditNoteWhere,
      },
      _sum: { amount: true },
    });
    return roundMoney(decimalToNumber(result._sum.amount));
  }

  private async sumDealValue(
    scope: ReportsScope,
    dealWhereInput: Prisma.DealWhereInput,
  ): Promise<number> {
    const result = await this.prisma.deal.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        ...dealWhereInput,
      },
      _sum: { value: true },
    });
    return roundMoney(decimalToNumber(result._sum.value));
  }

  private async computeOutstandingAmount(
    scope: ReportsScope,
    filters: ReportFilters,
  ): Promise<number> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        status: { in: [...OUTSTANDING_STATUSES] },
        ...invoiceWhere(filters),
      },
      select: {
        balanceDue: true,
        grandTotal: true,
        lineItems: { where: { deletedAt: null }, select: { total: true } },
      },
    });
    return roundMoney(invoices.reduce((sum, invoice) => sum + invoiceAmount(invoice), 0));
  }

  private async sumPurchaseBalanceDue(scope: ReportsScope): Promise<number> {
    const result = await this.prisma.purchaseBill.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      _sum: { balanceDue: true },
    });
    return roundMoney(decimalToNumber(result._sum.balanceDue));
  }
}

function extractFilters(query: ReportQuery): ReportFilters {
  return {
    ...(query.clientId !== undefined ? { clientId: query.clientId } : {}),
    ...(query.projectId !== undefined ? { projectId: query.projectId } : {}),
    ...(query.departmentId !== undefined ? { departmentId: query.departmentId } : {}),
    ...(query.ownerUserId !== undefined ? { ownerUserId: query.ownerUserId } : {}),
    ...(query.currency !== undefined ? { currency: query.currency } : {}),
    ...(query.period !== undefined ? { period: query.period } : {}),
  };
}

function invoiceWhere(filters: ReportFilters): Prisma.InvoiceWhereInput {
  return {
    ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
    ...(filters.projectId !== undefined ? { projectId: filters.projectId } : {}),
  };
}

function paymentInvoiceFilter(filters: ReportFilters): Prisma.PaymentWhereInput {
  if (filters.clientId === undefined && filters.projectId === undefined) {
    return {};
  }
  return {
    invoice: {
      deletedAt: null,
      ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
      ...(filters.projectId !== undefined ? { projectId: filters.projectId } : {}),
    },
  };
}

function expenseWhere(filters: ReportFilters): Prisma.ExpenseWhereInput {
  return {
    ...(filters.departmentId !== undefined ? { departmentId: filters.departmentId } : {}),
  };
}

function dealWhere(filters: ReportFilters): Prisma.DealWhereInput {
  return {
    ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
    ...(filters.ownerUserId !== undefined ? { ownerUserId: filters.ownerUserId } : {}),
  };
}

function clientWhere(filters: ReportFilters): Prisma.ClientWhereInput {
  return {
    ...(filters.clientId !== undefined ? { id: filters.clientId } : {}),
    ...(filters.ownerUserId !== undefined ? { ownerUserId: filters.ownerUserId } : {}),
  };
}

function projectWhere(filters: ReportFilters): Prisma.ProjectWhereInput {
  return {
    ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
    ...(filters.projectId !== undefined ? { id: filters.projectId } : {}),
    ...(filters.departmentId !== undefined ? { departmentId: filters.departmentId } : {}),
    ...(filters.ownerUserId !== undefined ? { projectManagerUserId: filters.ownerUserId } : {}),
  };
}

function taskWhere(filters: ReportFilters): Prisma.TaskWhereInput {
  return {
    ...(filters.projectId !== undefined ? { projectId: filters.projectId } : {}),
    ...(filters.clientId !== undefined ||
    filters.departmentId !== undefined ||
    filters.ownerUserId !== undefined
      ? {
          project: {
            deletedAt: null,
            ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
            ...(filters.departmentId !== undefined ? { departmentId: filters.departmentId } : {}),
            ...(filters.ownerUserId !== undefined
              ? { projectManagerUserId: filters.ownerUserId }
              : {}),
          },
        }
      : {}),
  };
}

function resolveGranularity(period: ReportQuery['period']): AnalyticsGranularity {
  if (period === 'quarter') {
    return 'quarter';
  }
  if (period === 'year') {
    return 'year';
  }
  return 'month';
}

interface PeriodBucket {
  readonly key: string;
  readonly start: Date;
  readonly endExclusive: Date;
}

function buildPeriodBuckets(
  from: Date,
  to: Date,
  granularity: AnalyticsGranularity,
): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  if (granularity === 'year') {
    let year = from.getUTCFullYear();
    const endYear = to.getUTCFullYear();
    while (year <= endYear) {
      const start = new Date(Date.UTC(year, 0, 1));
      const endExclusive = new Date(Date.UTC(year + 1, 0, 1));
      buckets.push({ key: String(year), start, endExclusive });
      year += 1;
    }
    return buckets;
  }

  if (granularity === 'quarter') {
    let cursor = new Date(
      Date.UTC(from.getUTCFullYear(), Math.floor(from.getUTCMonth() / 3) * 3, 1),
    );
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1));
    while (cursor < end) {
      const q = Math.floor(cursor.getUTCMonth() / 3) + 1;
      const start = new Date(cursor);
      const endExclusive = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 3, 1));
      buckets.push({
        key: `${String(cursor.getUTCFullYear())}-Q${String(q)}`,
        start,
        endExclusive,
      });
      cursor = endExclusive;
    }
    return buckets;
  }

  // month — prefer last 12 months within range
  let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const rangeEnd = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1));
  const maxMonths = 12;
  while (cursor < rangeEnd && buckets.length < maxMonths) {
    const start = new Date(cursor);
    const endExclusive = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    buckets.push({
      key: `${String(cursor.getUTCFullYear())}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`,
      start,
      endExclusive,
    });
    cursor = endExclusive;
  }
  return buckets;
}

function bucketSum(
  buckets: readonly PeriodBucket[],
  rows: readonly { date: Date; value: number }[],
  _granularity: AnalyticsGranularity,
): AnalyticsSeriesPoint[] {
  return buckets.map((bucket) => {
    let sum = 0;
    for (const row of rows) {
      const t = row.date.getTime();
      if (t >= bucket.start.getTime() && t < bucket.endExclusive.getTime()) {
        sum += row.value;
      }
    }
    return { period: bucket.key, value: roundMoney(sum) };
  });
}

function bucketCount(
  buckets: readonly PeriodBucket[],
  dates: readonly Date[],
  _granularity: AnalyticsGranularity,
): AnalyticsSeriesPoint[] {
  return buckets.map((bucket) => {
    let count = 0;
    for (const date of dates) {
      const t = date.getTime();
      if (t >= bucket.start.getTime() && t < bucket.endExclusive.getTime()) {
        count += 1;
      }
    }
    return { period: bucket.key, value: count };
  });
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
  for (const candidate of [record.grandTotal, record.amount]) {
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

function invoiceAmount(invoice: {
  balanceDue?: Prisma.Decimal | null;
  grandTotal?: Prisma.Decimal | null;
  lineItems?: readonly { total: Prisma.Decimal }[];
}): number {
  if (invoice.balanceDue !== null && invoice.balanceDue !== undefined) {
    return decimalToNumber(invoice.balanceDue);
  }
  if (invoice.grandTotal !== null && invoice.grandTotal !== undefined) {
    return decimalToNumber(invoice.grandTotal);
  }
  return (invoice.lineItems ?? []).reduce((sum, item) => sum + decimalToNumber(item.total), 0);
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return value.toNumber();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10000) / 100;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toUtcBounds(range: { from: Date; to: Date }): { start: Date; endExclusive: Date } {
  const start = new Date(
    Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate()),
  );
  const endExclusive = new Date(
    Date.UTC(range.to.getUTCFullYear(), range.to.getUTCMonth(), range.to.getUTCDate() + 1),
  );
  return { start, endExclusive };
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}
