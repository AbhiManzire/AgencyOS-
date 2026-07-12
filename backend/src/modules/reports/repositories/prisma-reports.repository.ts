import { Injectable } from '@nestjs/common';
import {
  ApprovalStatus,
  CreditNoteStatus,
  DealStage,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  PurchaseBillStatus,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  FounderReport,
  ReportColumn,
  ReportDateRange,
  ReportFilters,
  ReportMetric,
  ReportQuery,
  ReportsScope,
  ReportType,
} from '../reports.types';
import type { ReportsRepository } from './reports.repository.interface';

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
const OUTSTANDING_PURCHASE_STATUSES: readonly PurchaseBillStatus[] = [
  PurchaseBillStatus.SENT,
  PurchaseBillStatus.PARTIALLY_PAID,
  PurchaseBillStatus.OVERDUE,
];
const OPEN_TASK_STATUSES: readonly TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.BLOCKED,
];
const ROW_LIMIT = 500;
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
export class PrismaReportsRepository implements ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(
    scope: ReportsScope,
    reportType: ReportType,
    query: ReportQuery,
  ): Promise<FounderReport> {
    const range: ReportDateRange = { from: query.from, to: query.to };
    const currency = query.currency ?? (await this.resolveCurrency(scope));
    const fromIso = toDateOnly(range.from);
    const toIso = toDateOnly(range.to);
    const filters = extractReportFilters(query);

    switch (reportType) {
      case 'revenue':
        return this.buildRevenueReport(scope, range, currency, fromIso, toIso, filters);
      case 'clients':
        return this.buildClientsReport(scope, range, currency, fromIso, toIso, filters);
      case 'projects':
        return this.buildProjectsReport(scope, range, currency, fromIso, toIso, filters);
      case 'tasks':
        return this.buildTasksReport(scope, range, currency, fromIso, toIso, filters);
      case 'invoices':
        return this.buildInvoicesReport(scope, range, currency, fromIso, toIso, filters);
      case 'sales_pipeline':
        return this.buildSalesPipelineReport(scope, range, currency, fromIso, toIso, filters);
      case 'sales_conversion':
        return this.buildSalesConversionReport(scope, range, currency, fromIso, toIso, filters);
      case 'sales_forecast':
        return this.buildSalesForecastReport(scope, range, currency, fromIso, toIso, filters);
      case 'sales_lead_source':
        return this.buildSalesLeadSourceReport(scope, range, currency, fromIso, toIso, filters);
      case 'sales_performance':
        return this.buildSalesPerformanceReport(scope, range, currency, fromIso, toIso, filters);
      case 'profit_loss':
        return this.buildProfitLossReport(scope, range, currency, fromIso, toIso, filters);
      case 'cash_flow':
        return this.buildCashFlowReport(scope, range, currency, fromIso, toIso, filters);
      case 'receivables':
        return this.buildReceivablesReport(scope, range, currency, fromIso, toIso, filters);
      case 'payables':
        return this.buildPayablesReport(scope, range, currency, fromIso, toIso, filters);
      case 'gst_summary':
        return this.buildGstSummaryReport(scope, range, currency, fromIso, toIso, filters);
      case 'sales_register':
        return this.buildSalesRegisterReport(scope, range, currency, fromIso, toIso, filters);
      case 'purchase_register':
        return this.buildPurchaseRegisterReport(scope, range, currency, fromIso, toIso, filters);
      case 'outstanding':
        return this.buildOutstandingReport(scope, range, currency, fromIso, toIso, filters);
      case 'client_ledger':
        return this.buildClientLedgerReport(scope, range, currency, fromIso, toIso, filters);
      case 'vendor_ledger':
        return this.buildVendorLedgerReport(scope, range, currency, fromIso, toIso, filters);
      case 'founder':
        return this.buildFounderExecutiveReport(scope, range, currency, fromIso, toIso, filters);
      case 'expense':
        return this.buildExpenseReport(scope, range, currency, fromIso, toIso, filters);
      case 'sales':
        return this.buildSalesCompositeReport(scope, range, currency, fromIso, toIso, filters);
      case 'finance':
        return this.buildFinanceCompositeReport(scope, range, currency, fromIso, toIso, filters);
      case 'profit':
        return this.buildProfitLossReport(
          scope,
          range,
          currency,
          fromIso,
          toIso,
          filters,
          'profit',
        );
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
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const invoiceWhere = invoiceFilters(filters);
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
        ...invoiceWhere,
        status: { in: [...INVOICED_STATUSES] },
        issueDate: { gte: start, lt: endExclusive },
      }),
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
        ...paymentFilters(filters),
      }),
      this.computeOutstandingAmount(scope, filters),
      this.prisma.invoice.count({
        where: {
          ...baseScope,
          ...invoiceWhere,
          status: { in: [...INVOICED_STATUSES] },
          issueDate: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.payment.count({
        where: {
          ...baseScope,
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: start, lt: endExclusive },
          ...paymentFilters(filters),
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...baseScope,
          ...invoiceWhere,
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
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = { ...this.baseScope(scope), ...clientFilters(filters) };
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
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = { ...this.baseScope(scope), ...projectFilters(filters) };
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
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = { ...this.baseScope(scope), ...taskFilters(filters) };
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
            status: TaskStatus.COMPLETED,
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
        value: statusCount(byStatus, 'REVIEW'),
        format: 'number',
      },
      {
        key: 'done',
        label: 'Done',
        value: statusCount(byStatus, 'COMPLETED'),
        format: 'number',
      },
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
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const invoiceWhere = invoiceFilters(filters);
    const { start, endExclusive } = toUtcBounds(range);

    const [statusGroups, invoicedAmount, outstandingAmount, overdueAmount, overdueCount, invoices] =
      await Promise.all([
        this.prisma.invoice.groupBy({
          by: ['status'],
          where: {
            ...baseScope,
            ...invoiceWhere,
            issueDate: { gte: start, lt: endExclusive },
          },
          _count: { _all: true },
        }),
        this.sumInvoiceLineTotals(scope, {
          ...invoiceWhere,
          status: { in: [...INVOICED_STATUSES] },
          issueDate: { gte: start, lt: endExclusive },
        }),
        this.computeOutstandingAmount(scope, filters),
        this.sumInvoiceLineTotals(scope, {
          ...invoiceWhere,
          status: InvoiceStatus.OVERDUE,
        }),
        this.prisma.invoice.count({
          where: {
            ...baseScope,
            ...invoiceWhere,
            status: InvoiceStatus.OVERDUE,
          },
        }),
        this.prisma.invoice.findMany({
          where: {
            ...baseScope,
            ...invoiceWhere,
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

  private async buildSalesPipelineReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = { ...this.baseScope(scope), ...dealFilters(filters) };

    const openDeals = await this.prisma.deal.findMany({
      where: {
        ...baseScope,
        stage: { in: [...OPEN_DEAL_STAGES] },
      },
      select: {
        title: true,
        stage: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        client: { select: { displayName: true } },
        ownerUser: { select: { displayName: true, email: true } },
      },
      orderBy: { value: 'desc' },
      take: ROW_LIMIT,
    });

    let pipelineValue = 0;
    let expectedRevenue = 0;
    const stageCounts = new Map<string, number>();

    for (const deal of openDeals) {
      const value = decimalToNumber(deal.value);
      pipelineValue += value;
      expectedRevenue += value * ((deal.probability ?? 0) / 100);
      stageCounts.set(deal.stage, (stageCounts.get(deal.stage) ?? 0) + 1);
    }

    const metrics: ReportMetric[] = [
      { key: 'openDeals', label: 'Open deals', value: openDeals.length, format: 'number' },
      {
        key: 'pipelineValue',
        label: 'Pipeline value',
        value: roundMoney(pipelineValue),
        format: 'currency',
      },
      {
        key: 'expectedRevenue',
        label: 'Expected revenue',
        value: roundMoney(expectedRevenue),
        format: 'currency',
      },
      {
        key: 'averageDealValue',
        label: 'Average deal value',
        value: roundMoney(openDeals.length > 0 ? pipelineValue / openDeals.length : 0),
        format: 'currency',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'title', label: 'Deal' },
      { key: 'clientName', label: 'Client' },
      { key: 'stage', label: 'Stage' },
      { key: 'value', label: 'Value' },
      { key: 'probability', label: 'Probability %' },
      { key: 'expectedValue', label: 'Expected Value' },
      { key: 'expectedCloseDate', label: 'Expected Close' },
      { key: 'owner', label: 'Owner' },
    ];

    const rows = openDeals.map((deal) => {
      const value = decimalToNumber(deal.value);
      const probability = deal.probability ?? 0;
      return {
        title: deal.title,
        clientName: deal.client.displayName,
        stage: deal.stage,
        value: roundMoney(value),
        probability,
        expectedValue: roundMoney(value * (probability / 100)),
        expectedCloseDate: deal.expectedCloseDate ? toDateOnly(deal.expectedCloseDate) : null,
        owner: deal.ownerUser?.displayName ?? deal.ownerUser?.email ?? null,
      };
    });

    return {
      reportType: 'sales_pipeline',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildSalesConversionReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = { ...this.baseScope(scope), ...dealFilters(filters) };
    const { start, endExclusive } = toUtcBounds(range);

    const [wonDeals, lostDeals] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          stage: DealStage.WON,
          wonAt: { gte: start, lt: endExclusive },
        },
        select: {
          title: true,
          value: true,
          wonAt: true,
          client: { select: { displayName: true } },
          ownerUser: { select: { displayName: true, email: true } },
        },
        orderBy: { wonAt: 'desc' },
        take: ROW_LIMIT,
      }),
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          stage: DealStage.LOST,
          lostAt: { gte: start, lt: endExclusive },
        },
        select: {
          title: true,
          value: true,
          lostAt: true,
          client: { select: { displayName: true } },
          ownerUser: { select: { displayName: true, email: true } },
        },
        orderBy: { lostAt: 'desc' },
        take: ROW_LIMIT,
      }),
    ]);

    const wonValue = wonDeals.reduce((sum, deal) => sum + decimalToNumber(deal.value), 0);
    const lostValue = lostDeals.reduce((sum, deal) => sum + decimalToNumber(deal.value), 0);
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? wonDeals.length / totalClosed : 0;

    const metrics: ReportMetric[] = [
      { key: 'wonCount', label: 'Won deals', value: wonDeals.length, format: 'number' },
      { key: 'lostCount', label: 'Lost deals', value: lostDeals.length, format: 'number' },
      {
        key: 'conversionRate',
        label: 'Conversion rate (%)',
        value: roundMoney(conversionRate * 100),
        format: 'number',
      },
      { key: 'wonValue', label: 'Won value', value: roundMoney(wonValue), format: 'currency' },
      { key: 'lostValue', label: 'Lost value', value: roundMoney(lostValue), format: 'currency' },
    ];

    const columns: ReportColumn[] = [
      { key: 'title', label: 'Deal' },
      { key: 'clientName', label: 'Client' },
      { key: 'outcome', label: 'Outcome' },
      { key: 'value', label: 'Value' },
      { key: 'closedAt', label: 'Closed' },
      { key: 'owner', label: 'Owner' },
    ];

    const rows = [
      ...wonDeals.map((deal) => ({
        title: deal.title,
        clientName: deal.client.displayName,
        outcome: 'WON',
        value: roundMoney(decimalToNumber(deal.value)),
        closedAt: deal.wonAt ? toDateOnly(deal.wonAt) : null,
        owner: deal.ownerUser?.displayName ?? deal.ownerUser?.email ?? null,
      })),
      ...lostDeals.map((deal) => ({
        title: deal.title,
        clientName: deal.client.displayName,
        outcome: 'LOST',
        value: roundMoney(decimalToNumber(deal.value)),
        closedAt: deal.lostAt ? toDateOnly(deal.lostAt) : null,
        owner: deal.ownerUser?.displayName ?? deal.ownerUser?.email ?? null,
      })),
    ];

    return {
      reportType: 'sales_conversion',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildSalesForecastReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = { ...this.baseScope(scope), ...dealFilters(filters) };
    const { start, endExclusive } = toUtcBounds(range);

    const openDeals = await this.prisma.deal.findMany({
      where: {
        ...baseScope,
        stage: { in: [...OPEN_DEAL_STAGES] },
      },
      select: {
        title: true,
        stage: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        client: { select: { displayName: true } },
      },
      orderBy: { expectedCloseDate: 'asc' },
      take: ROW_LIMIT,
    });

    let pipelineValue = 0;
    let expectedRevenue = 0;
    let closingInRangeCount = 0;
    let expectedRevenueClosingInRange = 0;

    for (const deal of openDeals) {
      const value = decimalToNumber(deal.value);
      const probability = deal.probability ?? 0;
      const expectedValue = value * (probability / 100);
      pipelineValue += value;
      expectedRevenue += expectedValue;

      if (
        deal.expectedCloseDate !== null &&
        deal.expectedCloseDate.getTime() >= start.getTime() &&
        deal.expectedCloseDate.getTime() < endExclusive.getTime()
      ) {
        closingInRangeCount += 1;
        expectedRevenueClosingInRange += expectedValue;
      }
    }

    const metrics: ReportMetric[] = [
      {
        key: 'pipelineValue',
        label: 'Pipeline value',
        value: roundMoney(pipelineValue),
        format: 'currency',
      },
      {
        key: 'expectedRevenue',
        label: 'Expected revenue (all open)',
        value: roundMoney(expectedRevenue),
        format: 'currency',
      },
      {
        key: 'closingInRangeCount',
        label: 'Deals closing in range',
        value: closingInRangeCount,
        format: 'number',
      },
      {
        key: 'expectedRevenueClosingInRange',
        label: 'Expected revenue closing in range',
        value: roundMoney(expectedRevenueClosingInRange),
        format: 'currency',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'title', label: 'Deal' },
      { key: 'clientName', label: 'Client' },
      { key: 'stage', label: 'Stage' },
      { key: 'value', label: 'Value' },
      { key: 'probability', label: 'Probability %' },
      { key: 'expectedValue', label: 'Expected Value' },
      { key: 'expectedCloseDate', label: 'Expected Close' },
    ];

    const rows = openDeals.map((deal) => {
      const value = decimalToNumber(deal.value);
      const probability = deal.probability ?? 0;
      return {
        title: deal.title,
        clientName: deal.client.displayName,
        stage: deal.stage,
        value: roundMoney(value),
        probability,
        expectedValue: roundMoney(value * (probability / 100)),
        expectedCloseDate: deal.expectedCloseDate ? toDateOnly(deal.expectedCloseDate) : null,
      };
    });

    return {
      reportType: 'sales_forecast',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildSalesLeadSourceReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);
    const leadWhere = { ...baseScope, createdAt: { gte: start, lt: endExclusive } };

    const [totalGroups, convertedGroups] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['source'],
        where: leadWhere,
        _count: { _all: true },
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        where: { ...leadWhere, status: 'CONVERTED' },
        _count: { _all: true },
      }),
    ]);

    const convertedBySource = new Map(
      convertedGroups.map((group) => [group.source, group._count._all]),
    );

    const totalLeads = totalGroups.reduce((sum, group) => sum + group._count._all, 0);
    const totalConverted = convertedGroups.reduce((sum, group) => sum + group._count._all, 0);

    const metrics: ReportMetric[] = [
      { key: 'totalLeads', label: 'Total leads', value: totalLeads, format: 'number' },
      { key: 'totalConverted', label: 'Converted leads', value: totalConverted, format: 'number' },
      {
        key: 'overallConversionRate',
        label: 'Overall conversion rate (%)',
        value: roundMoney(totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0),
        format: 'number',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'source', label: 'Source' },
      { key: 'leadCount', label: 'Leads' },
      { key: 'convertedCount', label: 'Converted' },
      { key: 'conversionRate', label: 'Conversion Rate (%)' },
    ];

    const rows = totalGroups.map((group) => {
      const convertedCount = convertedBySource.get(group.source) ?? 0;
      return {
        source: group.source,
        leadCount: group._count._all,
        convertedCount,
        conversionRate: roundMoney(
          group._count._all > 0 ? (convertedCount / group._count._all) * 100 : 0,
        ),
      };
    });

    return {
      reportType: 'sales_lead_source',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildSalesPerformanceReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = { ...this.baseScope(scope), ...dealFilters(filters) };
    const { start, endExclusive } = toUtcBounds(range);

    const deals = await this.prisma.deal.findMany({
      where: {
        ...baseScope,
        ownerUserId: { not: null },
        createdAt: { gte: start, lt: endExclusive },
      },
      select: {
        value: true,
        stage: true,
        ownerUser: { select: { displayName: true, email: true } },
      },
    });

    interface OwnerAggregate {
      owner: string;
      dealCount: number;
      wonCount: number;
      lostCount: number;
      wonValue: number;
    }

    const byOwner = new Map<string, OwnerAggregate>();

    for (const deal of deals) {
      const ownerLabel = deal.ownerUser?.displayName ?? deal.ownerUser?.email ?? 'Unassigned';
      const aggregate = byOwner.get(ownerLabel) ?? {
        owner: ownerLabel,
        dealCount: 0,
        wonCount: 0,
        lostCount: 0,
        wonValue: 0,
      };

      aggregate.dealCount += 1;
      if (deal.stage === DealStage.WON) {
        aggregate.wonCount += 1;
        aggregate.wonValue += decimalToNumber(deal.value);
      } else if (deal.stage === DealStage.LOST) {
        aggregate.lostCount += 1;
      }

      byOwner.set(ownerLabel, aggregate);
    }

    const ownerAggregates = Array.from(byOwner.values()).sort((a, b) => b.wonValue - a.wonValue);

    const metrics: ReportMetric[] = [
      { key: 'totalDeals', label: 'Deals in range', value: deals.length, format: 'number' },
      {
        key: 'activeOwners',
        label: 'Active reps',
        value: ownerAggregates.length,
        format: 'number',
      },
      {
        key: 'totalWonValue',
        label: 'Total won value',
        value: roundMoney(ownerAggregates.reduce((sum, owner) => sum + owner.wonValue, 0)),
        format: 'currency',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'owner', label: 'Owner' },
      { key: 'dealCount', label: 'Deals' },
      { key: 'wonCount', label: 'Won' },
      { key: 'lostCount', label: 'Lost' },
      { key: 'winRate', label: 'Win Rate (%)' },
      { key: 'wonValue', label: 'Won Value' },
    ];

    const rows = ownerAggregates.map((owner) => {
      const closedCount = owner.wonCount + owner.lostCount;
      return {
        owner: owner.owner,
        dealCount: owner.dealCount,
        wonCount: owner.wonCount,
        lostCount: owner.lostCount,
        winRate: roundMoney(closedCount > 0 ? (owner.wonCount / closedCount) * 100 : 0),
        wonValue: roundMoney(owner.wonValue),
      };
    });

    return {
      reportType: 'sales_performance',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildProfitLossReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
    reportTypeOverride: ReportType = 'profit_loss',
  ): Promise<FounderReport> {
    const { start, endExclusive } = toUtcBounds(range);

    const [revenue, expenses, creditNotes] = await Promise.all([
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
      }),
      this.sumExpenses(scope, {
        expenseDate: { gte: start, lt: endExclusive },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.sumCreditNotes(scope, {
        issueDate: { gte: start, lt: endExclusive },
        status: { in: [CreditNoteStatus.ISSUED, CreditNoteStatus.APPLIED] },
      }),
    ]);

    const netProfit = revenue - expenses - creditNotes;

    const metrics: ReportMetric[] = [
      { key: 'revenue', label: 'Collections', value: revenue, format: 'currency' },
      { key: 'expenses', label: 'Expenses', value: expenses, format: 'currency' },
      { key: 'creditNotes', label: 'Credit notes', value: creditNotes, format: 'currency' },
      { key: 'netProfit', label: 'Net profit', value: roundMoney(netProfit), format: 'currency' },
    ];

    const columns: ReportColumn[] = [
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
    ];

    const rows = [
      { category: 'Collections', amount: revenue },
      { category: 'Expenses', amount: expenses },
      { category: 'Credit notes', amount: creditNotes },
      { category: 'Net profit', amount: roundMoney(netProfit) },
    ];

    void filters;
    return {
      reportType: reportTypeOverride,
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildCashFlowReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const { start, endExclusive } = toUtcBounds(range);

    const [inflows, expenseOutflows, purchaseOutflows] = await Promise.all([
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
      }),
      this.sumExpenses(scope, {
        expenseDate: { gte: start, lt: endExclusive },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.sumPurchasePayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
      }),
    ]);

    const outflows = expenseOutflows + purchaseOutflows;
    const netCashFlow = inflows - outflows;

    const metrics: ReportMetric[] = [
      { key: 'inflows', label: 'Inflows', value: inflows, format: 'currency' },
      {
        key: 'expenseOutflows',
        label: 'Expense outflows',
        value: expenseOutflows,
        format: 'currency',
      },
      {
        key: 'purchaseOutflows',
        label: 'Purchase outflows',
        value: purchaseOutflows,
        format: 'currency',
      },
      {
        key: 'netCashFlow',
        label: 'Net cash flow',
        value: roundMoney(netCashFlow),
        format: 'currency',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'flowType', label: 'Flow' },
      { key: 'amount', label: 'Amount' },
    ];

    const rows = [
      { flowType: 'Collections (inflow)', amount: inflows },
      { flowType: 'Expenses (outflow)', amount: expenseOutflows },
      { flowType: 'Purchase payments (outflow)', amount: purchaseOutflows },
      { flowType: 'Net cash flow', amount: roundMoney(netCashFlow) },
    ];

    return {
      reportType: 'cash_flow',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildReceivablesReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const baseScope = this.baseScope(scope);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...baseScope,
        status: { in: [...OUTSTANDING_STATUSES] },
      },
      select: {
        invoiceNumber: true,
        status: true,
        issueDate: true,
        dueDate: true,
        balanceDue: true,
        grandTotal: true,
        client: { select: { displayName: true } },
        lineItems: {
          where: { deletedAt: null },
          select: { total: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: ROW_LIMIT,
    });

    const rows = invoices.map((invoice) => {
      const amount = invoiceAmount(invoice);
      return {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.displayName,
        status: invoice.status,
        issueDate: toDateOnly(invoice.issueDate),
        dueDate: toDateOnly(invoice.dueDate),
        amount: roundMoney(amount),
      };
    });

    const totalReceivable = rows.reduce((sum, row) => sum + row.amount, 0);

    const metrics: ReportMetric[] = [
      {
        key: 'totalReceivable',
        label: 'Total receivable',
        value: roundMoney(totalReceivable),
        format: 'currency',
      },
      {
        key: 'invoiceCount',
        label: 'Outstanding invoices',
        value: invoices.length,
        format: 'number',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'invoiceNumber', label: 'Invoice' },
      { key: 'clientName', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'amount', label: 'Amount Due' },
    ];

    return {
      reportType: 'receivables',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildPayablesReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const baseScope = this.baseScope(scope);

    const bills = await this.prisma.purchaseBill.findMany({
      where: {
        ...baseScope,
        status: { in: [...OUTSTANDING_PURCHASE_STATUSES] },
      },
      select: {
        billNumber: true,
        status: true,
        issueDate: true,
        dueDate: true,
        balanceDue: true,
        grandTotal: true,
        vendor: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: ROW_LIMIT,
    });

    const rows = bills.map((bill) => ({
      billNumber: bill.billNumber,
      vendorName: bill.vendor.name,
      status: bill.status,
      issueDate: toDateOnly(bill.issueDate),
      dueDate: toDateOnly(bill.dueDate),
      amount: roundMoney(decimalToNumber(bill.balanceDue)),
    }));

    const totalPayable = rows.reduce((sum, row) => sum + row.amount, 0);

    const metrics: ReportMetric[] = [
      {
        key: 'totalPayable',
        label: 'Total payable',
        value: roundMoney(totalPayable),
        format: 'currency',
      },
      { key: 'billCount', label: 'Outstanding bills', value: bills.length, format: 'number' },
    ];

    const columns: ReportColumn[] = [
      { key: 'billNumber', label: 'Bill' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'status', label: 'Status' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'amount', label: 'Amount Due' },
    ];

    return {
      reportType: 'payables',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildGstSummaryReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const [invoices, expenses, purchaseBills, creditNotes] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          ...baseScope,
          status: { in: [...INVOICED_STATUSES] },
          issueDate: { gte: start, lt: endExclusive },
        },
        select: {
          invoiceNumber: true,
          issueDate: true,
          taxAmount: true,
          grandTotal: true,
          client: { select: { displayName: true } },
        },
        orderBy: { issueDate: 'desc' },
        take: ROW_LIMIT,
      }),
      this.prisma.expense.aggregate({
        where: {
          ...baseScope,
          expenseDate: { gte: start, lt: endExclusive },
          approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
        },
        _sum: { taxAmount: true, amount: true },
      }),
      this.prisma.purchaseBill.aggregate({
        where: {
          ...baseScope,
          issueDate: { gte: start, lt: endExclusive },
          status: { notIn: [PurchaseBillStatus.DRAFT, PurchaseBillStatus.CANCELLED] },
        },
        _sum: { taxAmount: true, grandTotal: true },
      }),
      this.prisma.creditNote.aggregate({
        where: {
          ...baseScope,
          issueDate: { gte: start, lt: endExclusive },
          status: { in: [CreditNoteStatus.ISSUED, CreditNoteStatus.APPLIED] },
        },
        _sum: { taxAmount: true, amount: true },
      }),
    ]);

    const outputTax = invoices.reduce(
      (sum, invoice) => sum + decimalToNumber(invoice.taxAmount),
      0,
    );
    const inputTaxExpenses = decimalToNumber(expenses._sum.taxAmount);
    const inputTaxPurchases = decimalToNumber(purchaseBills._sum.taxAmount);
    const creditNoteTax = decimalToNumber(creditNotes._sum.taxAmount);
    const netGst = outputTax - inputTaxExpenses - inputTaxPurchases - creditNoteTax;

    const metrics: ReportMetric[] = [
      {
        key: 'outputTax',
        label: 'Output tax (sales)',
        value: roundMoney(outputTax),
        format: 'currency',
      },
      {
        key: 'inputTax',
        label: 'Input tax',
        value: roundMoney(inputTaxExpenses + inputTaxPurchases),
        format: 'currency',
      },
      {
        key: 'creditNoteTax',
        label: 'Credit note tax',
        value: roundMoney(creditNoteTax),
        format: 'currency',
      },
      { key: 'netGst', label: 'Net GST', value: roundMoney(netGst), format: 'currency' },
    ];

    const columns: ReportColumn[] = [
      { key: 'document', label: 'Document' },
      { key: 'party', label: 'Party' },
      { key: 'issueDate', label: 'Date' },
      { key: 'taxAmount', label: 'Tax' },
      { key: 'total', label: 'Total' },
    ];

    const rows = invoices.map((invoice) => ({
      document: invoice.invoiceNumber,
      party: invoice.client.displayName,
      issueDate: toDateOnly(invoice.issueDate),
      taxAmount: roundMoney(decimalToNumber(invoice.taxAmount)),
      total: roundMoney(decimalToNumber(invoice.grandTotal)),
    }));

    return {
      reportType: 'gst_summary',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildSalesRegisterReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...baseScope,
        status: { in: [...INVOICED_STATUSES] },
        issueDate: { gte: start, lt: endExclusive },
      },
      select: {
        invoiceNumber: true,
        status: true,
        issueDate: true,
        subtotal: true,
        taxAmount: true,
        grandTotal: true,
        client: { select: { displayName: true } },
        lineItems: {
          where: { deletedAt: null },
          select: { total: true },
        },
      },
      orderBy: { issueDate: 'asc' },
      take: ROW_LIMIT,
    });

    const rows = invoices.map((invoice) => {
      const lineTotal = invoice.lineItems.reduce(
        (sum, item) => sum + decimalToNumber(item.total),
        0,
      );
      const total = invoice.grandTotal !== null ? decimalToNumber(invoice.grandTotal) : lineTotal;
      return {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.displayName,
        status: invoice.status,
        issueDate: toDateOnly(invoice.issueDate),
        subtotal: roundMoney(decimalToNumber(invoice.subtotal) || lineTotal),
        taxAmount: roundMoney(decimalToNumber(invoice.taxAmount)),
        total: roundMoney(total),
      };
    });

    const totalSales = rows.reduce((sum, row) => sum + row.total, 0);
    const totalTax = rows.reduce((sum, row) => sum + row.taxAmount, 0);

    const metrics: ReportMetric[] = [
      { key: 'invoiceCount', label: 'Invoices', value: invoices.length, format: 'number' },
      {
        key: 'totalSales',
        label: 'Total sales',
        value: roundMoney(totalSales),
        format: 'currency',
      },
      { key: 'totalTax', label: 'Total tax', value: roundMoney(totalTax), format: 'currency' },
    ];

    const columns: ReportColumn[] = [
      { key: 'invoiceNumber', label: 'Invoice' },
      { key: 'clientName', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'taxAmount', label: 'Tax' },
      { key: 'total', label: 'Total' },
    ];

    return {
      reportType: 'sales_register',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildPurchaseRegisterReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const bills = await this.prisma.purchaseBill.findMany({
      where: {
        ...baseScope,
        status: { notIn: [PurchaseBillStatus.DRAFT, PurchaseBillStatus.CANCELLED] },
        issueDate: { gte: start, lt: endExclusive },
      },
      select: {
        billNumber: true,
        status: true,
        issueDate: true,
        subtotal: true,
        taxAmount: true,
        grandTotal: true,
        vendor: { select: { name: true } },
      },
      orderBy: { issueDate: 'asc' },
      take: ROW_LIMIT,
    });

    const rows = bills.map((bill) => ({
      billNumber: bill.billNumber,
      vendorName: bill.vendor.name,
      status: bill.status,
      issueDate: toDateOnly(bill.issueDate),
      subtotal: roundMoney(decimalToNumber(bill.subtotal)),
      taxAmount: roundMoney(decimalToNumber(bill.taxAmount)),
      total: roundMoney(decimalToNumber(bill.grandTotal)),
    }));

    const totalPurchases = rows.reduce((sum, row) => sum + row.total, 0);
    const totalTax = rows.reduce((sum, row) => sum + row.taxAmount, 0);

    const metrics: ReportMetric[] = [
      { key: 'billCount', label: 'Bills', value: bills.length, format: 'number' },
      {
        key: 'totalPurchases',
        label: 'Total purchases',
        value: roundMoney(totalPurchases),
        format: 'currency',
      },
      { key: 'totalTax', label: 'Total tax', value: roundMoney(totalTax), format: 'currency' },
    ];

    const columns: ReportColumn[] = [
      { key: 'billNumber', label: 'Bill' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'status', label: 'Status' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'taxAmount', label: 'Tax' },
      { key: 'total', label: 'Total' },
    ];

    return {
      reportType: 'purchase_register',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildOutstandingReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const baseScope = this.baseScope(scope);

    const [receivableInvoices, payableBills] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          ...baseScope,
          status: { in: [...OUTSTANDING_STATUSES] },
        },
        select: {
          invoiceNumber: true,
          status: true,
          dueDate: true,
          balanceDue: true,
          grandTotal: true,
          client: { select: { displayName: true } },
          lineItems: {
            where: { deletedAt: null },
            select: { total: true },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: ROW_LIMIT,
      }),
      this.prisma.purchaseBill.findMany({
        where: {
          ...baseScope,
          status: { in: [...OUTSTANDING_PURCHASE_STATUSES] },
        },
        select: {
          billNumber: true,
          status: true,
          dueDate: true,
          balanceDue: true,
          grandTotal: true,
          vendor: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: ROW_LIMIT,
      }),
    ]);

    const receivableRows = receivableInvoices.map((invoice) => ({
      side: 'Receivable',
      document: invoice.invoiceNumber,
      party: invoice.client.displayName,
      status: invoice.status,
      dueDate: toDateOnly(invoice.dueDate),
      amount: roundMoney(invoiceAmount(invoice)),
    }));

    const payableRows = payableBills.map((bill) => ({
      side: 'Payable',
      document: bill.billNumber,
      party: bill.vendor.name,
      status: bill.status,
      dueDate: toDateOnly(bill.dueDate),
      amount: roundMoney(decimalToNumber(bill.balanceDue)),
    }));

    const rows = [...receivableRows, ...payableRows];
    const totalReceivable = receivableRows.reduce((sum, row) => sum + row.amount, 0);
    const totalPayable = payableRows.reduce((sum, row) => sum + row.amount, 0);

    const metrics: ReportMetric[] = [
      {
        key: 'totalReceivable',
        label: 'Receivables',
        value: roundMoney(totalReceivable),
        format: 'currency',
      },
      {
        key: 'totalPayable',
        label: 'Payables',
        value: roundMoney(totalPayable),
        format: 'currency',
      },
      {
        key: 'netOutstanding',
        label: 'Net outstanding',
        value: roundMoney(totalReceivable - totalPayable),
        format: 'currency',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'side', label: 'Side' },
      { key: 'document', label: 'Document' },
      { key: 'party', label: 'Party' },
      { key: 'status', label: 'Status' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'amount', label: 'Amount' },
    ];

    return {
      reportType: 'outstanding',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildClientLedgerReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const { start, endExclusive } = toUtcBounds(range);

    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId: { not: null },
        entryDate: { gte: start, lt: endExclusive },
      },
      select: {
        entryDate: true,
        accountType: true,
        description: true,
        debit: true,
        credit: true,
        balanceAfter: true,
        referenceType: true,
        client: { select: { displayName: true } },
      },
      orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
      take: ROW_LIMIT,
    });

    const totalDebit = entries.reduce((sum, entry) => sum + decimalToNumber(entry.debit), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + decimalToNumber(entry.credit), 0);

    const metrics: ReportMetric[] = [
      { key: 'entryCount', label: 'Entries', value: entries.length, format: 'number' },
      {
        key: 'totalDebit',
        label: 'Total debit',
        value: roundMoney(totalDebit),
        format: 'currency',
      },
      {
        key: 'totalCredit',
        label: 'Total credit',
        value: roundMoney(totalCredit),
        format: 'currency',
      },
      {
        key: 'netBalance',
        label: 'Net (debit - credit)',
        value: roundMoney(totalDebit - totalCredit),
        format: 'currency',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'entryDate', label: 'Date' },
      { key: 'clientName', label: 'Client' },
      { key: 'accountType', label: 'Account' },
      { key: 'description', label: 'Description' },
      { key: 'referenceType', label: 'Reference' },
      { key: 'debit', label: 'Debit' },
      { key: 'credit', label: 'Credit' },
      { key: 'balanceAfter', label: 'Balance' },
    ];

    const rows = entries.map((entry) => ({
      entryDate: toDateOnly(entry.entryDate),
      clientName: entry.client?.displayName ?? null,
      accountType: entry.accountType,
      description: entry.description,
      referenceType: entry.referenceType,
      debit: roundMoney(decimalToNumber(entry.debit)),
      credit: roundMoney(decimalToNumber(entry.credit)),
      balanceAfter:
        entry.balanceAfter !== null ? roundMoney(decimalToNumber(entry.balanceAfter)) : null,
    }));

    return {
      reportType: 'client_ledger',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildVendorLedgerReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    void filters;
    const { start, endExclusive } = toUtcBounds(range);

    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        vendorId: { not: null },
        entryDate: { gte: start, lt: endExclusive },
      },
      select: {
        entryDate: true,
        accountType: true,
        description: true,
        debit: true,
        credit: true,
        balanceAfter: true,
        referenceType: true,
        vendor: { select: { name: true } },
      },
      orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
      take: ROW_LIMIT,
    });

    const totalDebit = entries.reduce((sum, entry) => sum + decimalToNumber(entry.debit), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + decimalToNumber(entry.credit), 0);

    const metrics: ReportMetric[] = [
      { key: 'entryCount', label: 'Entries', value: entries.length, format: 'number' },
      {
        key: 'totalDebit',
        label: 'Total debit',
        value: roundMoney(totalDebit),
        format: 'currency',
      },
      {
        key: 'totalCredit',
        label: 'Total credit',
        value: roundMoney(totalCredit),
        format: 'currency',
      },
      {
        key: 'netBalance',
        label: 'Net (debit - credit)',
        value: roundMoney(totalDebit - totalCredit),
        format: 'currency',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'entryDate', label: 'Date' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'accountType', label: 'Account' },
      { key: 'description', label: 'Description' },
      { key: 'referenceType', label: 'Reference' },
      { key: 'debit', label: 'Debit' },
      { key: 'credit', label: 'Credit' },
      { key: 'balanceAfter', label: 'Balance' },
    ];

    const rows = entries.map((entry) => ({
      entryDate: toDateOnly(entry.entryDate),
      vendorName: entry.vendor?.name ?? null,
      accountType: entry.accountType,
      description: entry.description,
      referenceType: entry.referenceType,
      debit: roundMoney(decimalToNumber(entry.debit)),
      credit: roundMoney(decimalToNumber(entry.credit)),
      balanceAfter:
        entry.balanceAfter !== null ? roundMoney(decimalToNumber(entry.balanceAfter)) : null,
    }));

    return {
      reportType: 'vendor_ledger',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildFounderExecutiveReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const [
      invoicedAmount,
      collectedAmount,
      expenses,
      outstandingAmount,
      openDeals,
      invoices,
      deals,
    ] = await Promise.all([
      this.sumInvoiceLineTotals(scope, {
        ...invoiceFilters(filters),
        status: { in: [...INVOICED_STATUSES] },
        issueDate: { gte: start, lt: endExclusive },
      }),
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
        ...paymentFilters(filters),
      }),
      this.sumExpenses(scope, {
        ...expenseFilters(filters),
        expenseDate: { gte: start, lt: endExclusive },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.computeOutstandingAmount(scope, filters),
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          ...dealFilters(filters),
          stage: { in: [...OPEN_DEAL_STAGES] },
        },
        select: { value: true, probability: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...baseScope,
          ...invoiceFilters(filters),
          status: { in: [...INVOICED_STATUSES] },
          issueDate: { gte: start, lt: endExclusive },
        },
        select: {
          invoiceNumber: true,
          status: true,
          issueDate: true,
          client: { select: { displayName: true } },
          lineItems: { where: { deletedAt: null }, select: { total: true } },
        },
        orderBy: { issueDate: 'desc' },
        take: 25,
      }),
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          ...dealFilters(filters),
          OR: [
            { createdAt: { gte: start, lt: endExclusive } },
            { wonAt: { gte: start, lt: endExclusive } },
            { lostAt: { gte: start, lt: endExclusive } },
          ],
        },
        select: {
          title: true,
          stage: true,
          value: true,
          client: { select: { displayName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 25,
      }),
    ]);

    let pipeline = 0;
    for (const deal of openDeals) {
      pipeline += decimalToNumber(deal.value);
    }
    const profit = collectedAmount - expenses;

    const metrics: ReportMetric[] = [
      { key: 'revenue', label: 'Revenue (invoiced)', value: invoicedAmount, format: 'currency' },
      { key: 'collections', label: 'Collections', value: collectedAmount, format: 'currency' },
      { key: 'expenses', label: 'Expenses', value: expenses, format: 'currency' },
      { key: 'profit', label: 'Profit', value: roundMoney(profit), format: 'currency' },
      { key: 'outstanding', label: 'Outstanding', value: outstandingAmount, format: 'currency' },
      { key: 'pipeline', label: 'Pipeline', value: roundMoney(pipeline), format: 'currency' },
    ];

    const columns: ReportColumn[] = [
      { key: 'kind', label: 'Kind' },
      { key: 'reference', label: 'Reference' },
      { key: 'clientName', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'amount', label: 'Amount' },
    ];

    const rows: Record<string, string | number | null>[] = [
      ...invoices.map((invoice) => ({
        kind: 'Invoice',
        reference: invoice.invoiceNumber,
        clientName: invoice.client.displayName,
        status: invoice.status,
        amount: roundMoney(
          invoice.lineItems.reduce((sum, item) => sum + decimalToNumber(item.total), 0),
        ),
      })),
      ...deals.map((deal) => ({
        kind: 'Deal',
        reference: deal.title,
        clientName: deal.client.displayName,
        status: deal.stage,
        amount: roundMoney(decimalToNumber(deal.value)),
      })),
    ];

    return {
      reportType: 'founder',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildExpenseReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);

    const [totalExpenses, byCategory, expenses] = await Promise.all([
      this.sumExpenses(scope, {
        ...expenseFilters(filters),
        expenseDate: { gte: start, lt: endExclusive },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          ...baseScope,
          ...expenseFilters(filters),
          expenseDate: { gte: start, lt: endExclusive },
          approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.expense.findMany({
        where: {
          ...baseScope,
          ...expenseFilters(filters),
          expenseDate: { gte: start, lt: endExclusive },
          approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
        },
        select: {
          category: true,
          amount: true,
          expenseDate: true,
          description: true,
          approvalStatus: true,
          vendor: { select: { name: true } },
        },
        orderBy: { amount: 'desc' },
        take: ROW_LIMIT,
      }),
    ]);

    const metrics: ReportMetric[] = [
      { key: 'totalExpenses', label: 'Total expenses', value: totalExpenses, format: 'currency' },
      { key: 'categoryCount', label: 'Categories', value: byCategory.length, format: 'number' },
      { key: 'rowCount', label: 'Expense rows', value: expenses.length, format: 'number' },
    ];

    const columns: ReportColumn[] = [
      { key: 'expenseDate', label: 'Date' },
      { key: 'category', label: 'Category' },
      { key: 'vendorName', label: 'Vendor' },
      { key: 'description', label: 'Description' },
      { key: 'approvalStatus', label: 'Approval' },
      { key: 'amount', label: 'Amount' },
    ];

    const rows = expenses.map((expense) => ({
      expenseDate: toDateOnly(expense.expenseDate),
      category: expense.category,
      vendorName: expense.vendor?.name ?? null,
      description: expense.description,
      approvalStatus: expense.approvalStatus,
      amount: roundMoney(decimalToNumber(expense.amount)),
    }));

    return {
      reportType: 'expense',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildSalesCompositeReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const baseScope = this.baseScope(scope);
    const { start, endExclusive } = toUtcBounds(range);
    const dealWhere = dealFilters(filters);

    const [openDeals, wonValue, lostValue, wonCount, lostCount, deals] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          ...dealWhere,
          stage: { in: [...OPEN_DEAL_STAGES] },
        },
        select: { value: true, probability: true },
      }),
      this.prisma.deal.aggregate({
        where: {
          ...baseScope,
          ...dealWhere,
          stage: DealStage.WON,
          wonAt: { gte: start, lt: endExclusive },
        },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: {
          ...baseScope,
          ...dealWhere,
          stage: DealStage.LOST,
          lostAt: { gte: start, lt: endExclusive },
        },
        _sum: { value: true },
      }),
      this.prisma.deal.count({
        where: {
          ...baseScope,
          ...dealWhere,
          stage: DealStage.WON,
          wonAt: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.deal.count({
        where: {
          ...baseScope,
          ...dealWhere,
          stage: DealStage.LOST,
          lostAt: { gte: start, lt: endExclusive },
        },
      }),
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          ...dealWhere,
          OR: [
            { createdAt: { gte: start, lt: endExclusive } },
            { wonAt: { gte: start, lt: endExclusive } },
            { lostAt: { gte: start, lt: endExclusive } },
            { stage: { in: [...OPEN_DEAL_STAGES] } },
          ],
        },
        select: {
          title: true,
          stage: true,
          value: true,
          probability: true,
          ownerUser: { select: { displayName: true, email: true } },
          client: { select: { displayName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: ROW_LIMIT,
      }),
    ]);

    let pipeline = 0;
    let expected = 0;
    for (const deal of openDeals) {
      const value = decimalToNumber(deal.value);
      pipeline += value;
      expected += value * ((deal.probability ?? 0) / 100);
    }

    const conversion = wonCount + lostCount > 0 ? wonCount / (wonCount + lostCount) : 0;

    const metrics: ReportMetric[] = [
      { key: 'pipeline', label: 'Pipeline', value: roundMoney(pipeline), format: 'currency' },
      { key: 'expected', label: 'Expected', value: roundMoney(expected), format: 'currency' },
      {
        key: 'won',
        label: 'Won',
        value: roundMoney(decimalToNumber(wonValue._sum.value)),
        format: 'currency',
      },
      {
        key: 'lost',
        label: 'Lost',
        value: roundMoney(decimalToNumber(lostValue._sum.value)),
        format: 'currency',
      },
      {
        key: 'conversion',
        label: 'Conversion %',
        value: Math.round(conversion * 10000) / 100,
        format: 'percent',
      },
    ];

    const columns: ReportColumn[] = [
      { key: 'title', label: 'Deal' },
      { key: 'clientName', label: 'Client' },
      { key: 'owner', label: 'Owner' },
      { key: 'stage', label: 'Stage' },
      { key: 'probability', label: 'Probability' },
      { key: 'value', label: 'Value' },
    ];

    const rows = deals.map((deal) => ({
      title: deal.title,
      clientName: deal.client.displayName,
      owner: deal.ownerUser?.displayName ?? deal.ownerUser?.email ?? null,
      stage: deal.stage,
      probability: deal.probability,
      value: roundMoney(decimalToNumber(deal.value)),
    }));

    return {
      reportType: 'sales',
      from: fromIso,
      to: toIso,
      currency,
      metrics,
      columns,
      rows,
    };
  }

  private async buildFinanceCompositeReport(
    scope: ReportsScope,
    range: ReportDateRange,
    currency: string,
    fromIso: string,
    toIso: string,
    filters: ReportFilters,
  ): Promise<FounderReport> {
    const { start, endExclusive } = toUtcBounds(range);

    const [collections, expenses, purchaseOutflows, outstanding, creditNotes] = await Promise.all([
      this.sumCompletedPayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
        ...paymentFilters(filters),
      }),
      this.sumExpenses(scope, {
        ...expenseFilters(filters),
        expenseDate: { gte: start, lt: endExclusive },
        approvalStatus: { in: [...NON_REJECTED_APPROVAL] },
      }),
      this.sumPurchasePayments(scope, {
        paidAt: { gte: start, lt: endExclusive },
      }),
      this.computeOutstandingAmount(scope, filters),
      this.sumCreditNotes(scope, {
        issueDate: { gte: start, lt: endExclusive },
        status: { in: [CreditNoteStatus.ISSUED, CreditNoteStatus.APPLIED] },
      }),
    ]);

    const profit = collections - expenses;
    const cashFlow = collections - expenses - purchaseOutflows;

    const metrics: ReportMetric[] = [
      { key: 'collections', label: 'Collections', value: collections, format: 'currency' },
      { key: 'expenses', label: 'Expenses', value: expenses, format: 'currency' },
      { key: 'profit', label: 'Profit', value: roundMoney(profit), format: 'currency' },
      { key: 'cashFlow', label: 'Cash flow', value: roundMoney(cashFlow), format: 'currency' },
      { key: 'outstanding', label: 'Outstanding', value: outstanding, format: 'currency' },
      { key: 'creditNotes', label: 'Credit notes', value: creditNotes, format: 'currency' },
    ];

    const columns: ReportColumn[] = [
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
    ];

    const rows = [
      { category: 'Collections', amount: collections },
      { category: 'Expenses', amount: expenses },
      { category: 'Purchase payments', amount: purchaseOutflows },
      { category: 'Credit notes', amount: creditNotes },
      { category: 'Profit', amount: roundMoney(profit) },
      { category: 'Cash flow', amount: roundMoney(cashFlow) },
      { category: 'Outstanding', amount: outstanding },
    ];

    return {
      reportType: 'finance',
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

  private async computeOutstandingAmount(
    scope: ReportsScope,
    filters: ReportFilters = {},
  ): Promise<number> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        status: { in: [...OUTSTANDING_STATUSES] },
        ...invoiceFilters(filters),
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

    const total = invoices.reduce((sum, invoice) => sum + invoiceAmount(invoice), 0);
    return roundMoney(total);
  }

  private async sumExpenses(
    scope: ReportsScope,
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

function extractReportFilters(query: ReportQuery): ReportFilters {
  return {
    ...(query.clientId !== undefined ? { clientId: query.clientId } : {}),
    ...(query.projectId !== undefined ? { projectId: query.projectId } : {}),
    ...(query.departmentId !== undefined ? { departmentId: query.departmentId } : {}),
    ...(query.ownerUserId !== undefined ? { ownerUserId: query.ownerUserId } : {}),
    ...(query.currency !== undefined ? { currency: query.currency } : {}),
    ...(query.period !== undefined ? { period: query.period } : {}),
  };
}

function invoiceFilters(filters: ReportFilters): Prisma.InvoiceWhereInput {
  return {
    ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
    ...(filters.projectId !== undefined ? { projectId: filters.projectId } : {}),
  };
}

function paymentFilters(filters: ReportFilters): Prisma.PaymentWhereInput {
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

function expenseFilters(filters: ReportFilters): Prisma.ExpenseWhereInput {
  return {
    ...(filters.departmentId !== undefined ? { departmentId: filters.departmentId } : {}),
  };
}

function dealFilters(filters: ReportFilters): Prisma.DealWhereInput {
  return {
    ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
    ...(filters.ownerUserId !== undefined ? { ownerUserId: filters.ownerUserId } : {}),
  };
}

function clientFilters(filters: ReportFilters): Prisma.ClientWhereInput {
  return {
    ...(filters.clientId !== undefined ? { id: filters.clientId } : {}),
    ...(filters.ownerUserId !== undefined ? { ownerUserId: filters.ownerUserId } : {}),
  };
}

function projectFilters(filters: ReportFilters): Prisma.ProjectWhereInput {
  return {
    ...(filters.clientId !== undefined ? { clientId: filters.clientId } : {}),
    ...(filters.projectId !== undefined ? { id: filters.projectId } : {}),
    ...(filters.departmentId !== undefined ? { departmentId: filters.departmentId } : {}),
    ...(filters.ownerUserId !== undefined ? { projectManagerUserId: filters.ownerUserId } : {}),
  };
}

function taskFilters(filters: ReportFilters): Prisma.TaskWhereInput {
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

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return value.toNumber();
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
