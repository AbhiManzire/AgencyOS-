import { Injectable } from '@nestjs/common';
import { InvoiceStatus, PaymentStatus, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  FounderReport,
  ReportColumn,
  ReportDateRange,
  ReportMetric,
  ReportsScope,
  ReportType,
} from '../reports.types';
import type { ReportsRepository } from './reports.repository.interface';

const INVOICED_STATUSES: readonly InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
];
const OUTSTANDING_STATUSES: readonly InvoiceStatus[] = [InvoiceStatus.SENT, InvoiceStatus.OVERDUE];
const OPEN_TASK_STATUSES: readonly TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
];
const ROW_LIMIT = 500;

@Injectable()
export class PrismaReportsRepository implements ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(
    scope: ReportsScope,
    reportType: ReportType,
    range: ReportDateRange,
  ): Promise<FounderReport> {
    const currency = await this.resolveCurrency(scope);
    const fromIso = toDateOnly(range.from);
    const toIso = toDateOnly(range.to);

    switch (reportType) {
      case 'revenue':
        return this.buildRevenueReport(scope, range, currency, fromIso, toIso);
      case 'clients':
        return this.buildClientsReport(scope, range, currency, fromIso, toIso);
      case 'projects':
        return this.buildProjectsReport(scope, range, currency, fromIso, toIso);
      case 'tasks':
        return this.buildTasksReport(scope, range, currency, fromIso, toIso);
      case 'invoices':
        return this.buildInvoicesReport(scope, range, currency, fromIso, toIso);
      default: {
        const exhaustive: never = reportType;
        throw new Error(`Unsupported report type: ${String(exhaustive)}`);
      }
    }
  }

  private async buildRevenueReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const [
      invoicedAmount,
      collectedAmount,
      outstandingAmount,
      invoiceCount,
      paymentCount,
      invoices,
    ] = await Promise.all([
      this.sumInvoiceLineTotals(scope, {
        status: { in: [...INVOICED_STATUSES] },
        issueDate: { gte: start, lt: endExclusive },
      }),
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
      }),
      this.computeOutstandingAmount(scope),
      this.prisma.invoice.count({
        where: {
          ...baseScope,
          status: { in: [...INVOICED_STATUSES] },
          issueDate: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.payment.count({
        where: {
          ...baseScope,
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...baseScope,
          status: { in: [...INVOICED_STATUSES] },
          issueDate: { gte: start, lt: endExclusive },
        },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          issueDate: true,
          dueDate: true,
          currency: true,
          client: { select: { displayName: true } },
          lineItems: {
            where: { deletedAt: null },
            select: { total: true },
          },
        },
        orderBy: { issueDate: 'desc' },
        take: ROW_LIMIT,
      }),
    ]);

    const paidByInvoice = await this.sumPaidByInvoiceIds(
      scope,
      invoices.map((invoice) => invoice.id),
    );

    const columns: ReportColumn[] = [
      { key: 'invoiceNumber', label: 'Invoice' },
      { key: 'clientName', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'total', label: 'Total' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'outstanding', label: 'Outstanding' },
    ];

    const rows = invoices.map((invoice) => {
      const total = invoice.lineItems.reduce((sum, item) => sum + decimalToNumber(item.total), 0);
      const amountPaid = paidByInvoice.get(invoice.id) ?? 0;
      return {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.displayName,
        status: invoice.status,
        issueDate: toDateOnly(invoice.issueDate),
        dueDate: toDateOnly(invoice.dueDate),
        total: roundMoney(total),
        amountPaid: roundMoney(amountPaid),
        outstanding: roundMoney(Math.max(0, total - amountPaid)),
      };
    });

    const metrics: ReportMetric[] = [
      { key: 'invoicedAmount', label: 'Invoiced', value: invoicedAmount, format: 'currency' },
      { key: 'collectedAmount', label: 'Collected', value: collectedAmount, format: 'currency' },
      {
        key: 'outstandingAmount',
        label: 'Outstanding (current)',
        value: outstandingAmount,
        format: 'currency',
      },
      { key: 'invoiceCount', label: 'Invoices in range', value: invoiceCount, format: 'number' },
      { key: 'paymentCount', label: 'Payments in range', value: paymentCount, format: 'number' },
    ];

    return {
      reportType: 'revenue',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildClientsReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const [statusGroups, createdInRange, becameClientInRange, clients] = await Promise.all([
      this.prisma.client.groupBy({
        by: ['status'],
        where: baseScope,
        _count: { _all: true },
      }),
      this.prisma.client.count({
        where: {
          ...baseScope,
          createdAt: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.client.count({
        where: {
          ...baseScope,
          becameClientAt: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.client.findMany({
        where: {
          ...baseScope,
          OR: [
            { createdAt: { gte: start, lt: endExclusive } },
            { becameClientAt: { gte: start, lt: endExclusive } },
          ],
        },
        select: {
          displayName: true,
          status: true,
          industry: true,
          createdAt: true,
          becameClientAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: ROW_LIMIT,
      }),
    ]);

    const byStatus = toStatusCountMap(statusGroups);
    const total = statusGroups.reduce((sum, group) => sum + group._count._all, 0);

    const metrics: ReportMetric[] = [
      { key: 'total', label: 'Total clients', value: total, format: 'number' },
      { key: 'active', label: 'Active', value: statusCount(byStatus, 'ACTIVE'), format: 'number' },
      {
        key: 'prospect',
        label: 'Prospect',
        value: statusCount(byStatus, 'PROSPECT'),
        format: 'number',
      },
      {
        key: 'inactive',
        label: 'Inactive',
        value: statusCount(byStatus, 'INACTIVE'),
        format: 'number',
      },
      {
        key: 'archived',
        label: 'Archived',
        value: statusCount(byStatus, 'ARCHIVED'),
        format: 'number',
      },
      { key: 'createdInRange', label: 'Created in range', value: createdInRange, format: 'number' },
      {
        key: 'becameClientInRange',
        label: 'Became client in range',
        value: becameClientInRange,
        format: 'number',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'displayName', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'industry', label: 'Industry' },
      { key: 'createdAt', label: 'Created' },
      { key: 'becameClientAt', label: 'Became Client' },
    ];

    const rows = clients.map((client) => ({
      displayName: client.displayName,
      status: client.status,
      industry: client.industry,
      createdAt: toDateOnly(client.createdAt),
      becameClientAt: client.becameClientAt ? toDateOnly(client.becameClientAt) : null,
    }));

    return {
      reportType: 'clients',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildProjectsReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const [statusGroups, completedInRange, invoiceReadyInRange, billableCount, projects] =
      await Promise.all([
        this.prisma.project.groupBy({
          by: ['status'],
          where: baseScope,
          _count: { _all: true },
        }),
        this.prisma.project.count({
          where: {
            ...baseScope,
            status: 'COMPLETED',
            completedAt: { gte: start, lt: endExclusive },
          },
        }),
        this.prisma.project.count({
          where: {
            ...baseScope,
            invoiceReadyAt: { gte: start, lt: endExclusive },
          },
        }),
        this.prisma.project.count({
          where: {
            ...baseScope,
            isBillable: true,
          },
        }),
        this.prisma.project.findMany({
          where: {
            ...baseScope,
            OR: [
              { createdAt: { gte: start, lt: endExclusive } },
              { completedAt: { gte: start, lt: endExclusive } },
              { invoiceReadyAt: { gte: start, lt: endExclusive } },
            ],
          },
          select: {
            name: true,
            status: true,
            isBillable: true,
            startDate: true,
            targetEndDate: true,
            completedAt: true,
            client: { select: { displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: ROW_LIMIT,
        }),
      ]);

    const byStatus = toStatusCountMap(statusGroups);
    const total = statusGroups.reduce((sum, group) => sum + group._count._all, 0);

    const metrics: ReportMetric[] = [
      { key: 'total', label: 'Total projects', value: total, format: 'number' },
      { key: 'active', label: 'Active', value: statusCount(byStatus, 'ACTIVE'), format: 'number' },
      {
        key: 'planning',
        label: 'Planning',
        value: statusCount(byStatus, 'PLANNING'),
        format: 'number',
      },
      {
        key: 'invoiceReady',
        label: 'Invoice ready',
        value: statusCount(byStatus, 'INVOICE_READY'),
        format: 'number',
      },
      {
        key: 'completed',
        label: 'Completed (all)',
        value: statusCount(byStatus, 'COMPLETED'),
        format: 'number',
      },
      {
        key: 'completedInRange',
        label: 'Completed in range',
        value: completedInRange,
        format: 'number',
      },
      {
        key: 'invoiceReadyInRange',
        label: 'Invoice-ready in range',
        value: invoiceReadyInRange,
        format: 'number',
      },
      { key: 'billable', label: 'Billable', value: billableCount, format: 'number' },
    ];

    const columns: ReportColumn[] = [
      { key: 'name', label: 'Project' },
      { key: 'clientName', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'isBillable', label: 'Billable' },
      { key: 'startDate', label: 'Start' },
      { key: 'targetEndDate', label: 'Target End' },
      { key: 'completedAt', label: 'Completed' },
    ];

    const rows = projects.map((project) => ({
      name: project.name,
      clientName: project.client.displayName,
      status: project.status,
      isBillable: project.isBillable ? 'Yes' : 'No',
      startDate: project.startDate ? toDateOnly(project.startDate) : null,
      targetEndDate: project.targetEndDate ? toDateOnly(project.targetEndDate) : null,
      completedAt: project.completedAt ? toDateOnly(project.completedAt) : null,
    }));

    return {
      reportType: 'projects',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildTasksReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);
    const taskBase = { ...baseScope, parentTaskId: null };

    const [statusGroups, overdue, dueInRange, createdInRange, doneInRange, tasks] =
      await Promise.all([
        this.prisma.task.groupBy({
          by: ['status'],
          where: taskBase,
          _count: { _all: true },
        }),
        this.prisma.task.count({
          where: {
            ...taskBase,
            status: { in: [...OPEN_TASK_STATUSES] },
            dueDate: { not: null, lt: endExclusive },
          },
        }),
        this.prisma.task.count({
          where: {
            ...taskBase,
            dueDate: { gte: start, lt: endExclusive },
          },
        }),
        this.prisma.task.count({
          where: {
            ...taskBase,
            createdAt: { gte: start, lt: endExclusive },
          },
        }),
        this.prisma.task.count({
          where: {
            ...taskBase,
            status: TaskStatus.DONE,
            updatedAt: { gte: start, lt: endExclusive },
          },
        }),
        this.prisma.task.findMany({
          where: {
            ...taskBase,
            OR: [
              { dueDate: { gte: start, lt: endExclusive } },
              { createdAt: { gte: start, lt: endExclusive } },
            ],
          },
          select: {
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            project: { select: { name: true } },
            assigneeUser: { select: { displayName: true, email: true } },
          },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          take: ROW_LIMIT,
        }),
      ]);

    const byStatus = toStatusCountMap(statusGroups);
    const total = statusGroups.reduce((sum, group) => sum + group._count._all, 0);

    const metrics: ReportMetric[] = [
      { key: 'total', label: 'Total tasks', value: total, format: 'number' },
      { key: 'todo', label: 'To do', value: statusCount(byStatus, 'TODO'), format: 'number' },
      {
        key: 'inProgress',
        label: 'In progress',
        value: statusCount(byStatus, 'IN_PROGRESS'),
        format: 'number',
      },
      {
        key: 'inReview',
        label: 'In review',
        value: statusCount(byStatus, 'IN_REVIEW'),
        format: 'number',
      },
      { key: 'done', label: 'Done', value: statusCount(byStatus, 'DONE'), format: 'number' },
      { key: 'overdue', label: 'Overdue (open)', value: overdue, format: 'number' },
      { key: 'dueInRange', label: 'Due in range', value: dueInRange, format: 'number' },
      { key: 'createdInRange', label: 'Created in range', value: createdInRange, format: 'number' },
      {
        key: 'doneInRange',
        label: 'Marked done in range',
        value: doneInRange,
        format: 'number',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'title', label: 'Task' },
      { key: 'projectName', label: 'Project' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'assignee', label: 'Assignee' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'createdAt', label: 'Created' },
    ];

    const rows = tasks.map((task) => ({
      title: task.title,
      projectName: task.project.name,
      status: task.status,
      priority: task.priority,
      assignee: task.assigneeUser?.displayName ?? task.assigneeUser?.email ?? null,
      dueDate: task.dueDate ? toDateOnly(task.dueDate) : null,
      createdAt: toDateOnly(task.createdAt),
    }));

    return {
      reportType: 'tasks',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildInvoicesReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const [statusGroups, invoicedAmount, outstandingAmount, overdueAmount, overdueCount, invoices] =
      await Promise.all([
        this.prisma.invoice.groupBy({
          by: ['status'],
          where: {
            ...baseScope,
            issueDate: { gte: start, lt: endExclusive },
          },
          _count: { _all: true },
        }),
        this.sumInvoiceLineTotals(scope, {
          status: { in: [...INVOICED_STATUSES] },
          issueDate: { gte: start, lt: endExclusive },
        }),
        this.computeOutstandingAmount(scope),
        this.sumInvoiceLineTotals(scope, {
          status: InvoiceStatus.OVERDUE,
        }),
        this.prisma.invoice.count({
          where: {
            ...baseScope,
            status: InvoiceStatus.OVERDUE,
          },
        }),
        this.prisma.invoice.findMany({
          where: {
            ...baseScope,
            issueDate: { gte: start, lt: endExclusive },
          },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            issueDate: true,
            dueDate: true,
            client: { select: { displayName: true } },
            project: { select: { name: true } },
            lineItems: {
              where: { deletedAt: null },
              select: { total: true },
            },
          },
          orderBy: { issueDate: 'desc' },
          take: ROW_LIMIT,
        }),
      ]);

    const paidByInvoice = await this.sumPaidByInvoiceIds(
      scope,
      invoices.map((invoice) => invoice.id),
    );

    const byStatus = toStatusCountMap(statusGroups);
    const totalInRange = statusGroups.reduce((sum, group) => sum + group._count._all, 0);

    const metrics: ReportMetric[] = [
      { key: 'totalInRange', label: 'Invoices in range', value: totalInRange, format: 'number' },
      { key: 'draft', label: 'Draft', value: statusCount(byStatus, 'DRAFT'), format: 'number' },
      { key: 'sent', label: 'Sent', value: statusCount(byStatus, 'SENT'), format: 'number' },
      { key: 'paid', label: 'Paid', value: statusCount(byStatus, 'PAID'), format: 'number' },
      {
        key: 'overdue',
        label: 'Overdue (in range)',
        value: statusCount(byStatus, 'OVERDUE'),
        format: 'number',
      },
      { key: 'void', label: 'Void', value: statusCount(byStatus, 'VOID'), format: 'number' },
      {
        key: 'invoicedAmount',
        label: 'Invoiced amount',
        value: invoicedAmount,
        format: 'currency',
      },
      {
        key: 'outstandingAmount',
        label: 'Outstanding (current)',
        value: outstandingAmount,
        format: 'currency',
      },
      {
        key: 'overdueAmount',
        label: 'Overdue amount (current)',
        value: overdueAmount,
        format: 'currency',
      },
      {
        key: 'overdueCount',
        label: 'Overdue count (current)',
        value: overdueCount,
        format: 'number',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'invoiceNumber', label: 'Invoice' },
      { key: 'clientName', label: 'Client' },
      { key: 'projectName', label: 'Project' },
      { key: 'status', label: 'Status' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'total', label: 'Total' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'outstanding', label: 'Outstanding' },
    ];

    const rows = invoices.map((invoice) => {
      const total = invoice.lineItems.reduce((sum, item) => sum + decimalToNumber(item.total), 0);
      const amountPaid = paidByInvoice.get(invoice.id) ?? 0;
      return {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.displayName,
        projectName: invoice.project.name,
        status: invoice.status,
        issueDate: toDateOnly(invoice.issueDate),
        dueDate: toDateOnly(invoice.dueDate),
        total: roundMoney(total),
        amountPaid: roundMoney(amountPaid),
        outstanding: roundMoney(Math.max(0, total - amountPaid)),
      };
    });

    return {
      reportType: 'invoices',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
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

  private async computeOutstandingAmount(scope: ReportsScope): Promise<number> {
    const [gross, paid] = await Promise.all([
      this.sumInvoiceLineTotals(scope, {
        status: { in: [...OUTSTANDING_STATUSES] },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          status: PaymentStatus.COMPLETED,
          invoice: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            deletedAt: null,
            status: { in: [...OUTSTANDING_STATUSES] },
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return roundMoney(Math.max(0, gross - decimalToNumber(paid._sum.amount)));
  }

  private async sumPaidByInvoiceIds(
    scope: ReportsScope,
    invoiceIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (invoiceIds.length === 0) {
      return new Map();
    }

    const groups = await this.prisma.payment.groupBy({
      by: ['invoiceId'],
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        status: PaymentStatus.COMPLETED,
        invoiceId: { in: [...invoiceIds] },
      },
      _sum: { amount: true },
    });

    return new Map(
      groups.map((group) => [group.invoiceId, roundMoney(decimalToNumber(group._sum.amount))]),
    );
  }
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return value.toNumber();
}

function toStatusCountMap(
  groups: readonly { status: string; _count: { _all: number } }[],
): Map<string, number> {
  return new Map(groups.map((group) => [group.status, group._count._all]));
}

function statusCount(byStatus: Map<string, number>, status: string): number {
  return byStatus.get(status) ?? 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive date-only range → UTC [start, endExclusive). */
function toUtcBounds(range: ReportDateRange): { start: Date; endExclusive: Date } {
  const start = new Date(
    Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate()),
  );
  const endExclusive = new Date(
    Date.UTC(range.to.getUTCFullYear(), range.to.getUTCMonth(), range.to.getUTCDate() + 1),
  );

  return { start, endExclusive };
}
