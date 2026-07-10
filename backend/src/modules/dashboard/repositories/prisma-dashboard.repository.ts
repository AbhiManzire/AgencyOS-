import { Injectable } from '@nestjs/common';
import { DealStage, InvoiceStatus, Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { DashboardScope, DashboardSummaryAggregates } from '../dashboard.types';
import type { DashboardRepository } from './dashboard.repository.interface';

const OPEN_TASK_STATUSES: readonly TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
];
const INVOICED_STATUSES: readonly InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
];
const OUTSTANDING_STATUSES: readonly InvoiceStatus[] = [InvoiceStatus.SENT, InvoiceStatus.OVERDUE];
const OPEN_DEAL_STAGES: readonly DealStage[] = [
  DealStage.NEW,
  DealStage.QUALIFIED,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
];

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

    const [
      workspace,
      invoicedMonthly,
      collectedMonthly,
      outstandingAmount,
      overdueAmount,
      outstandingCount,
      clientsTotal,
      clientsActive,
      projectsActive,
      projectsInvoiceReady,
      projectsCompletedThisMonth,
      tasksDueToday,
      tasksOverdue,
      openDeals,
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
      this.sumInvoiceLineTotals(scope, {
        status: InvoiceStatus.PAID,
        issueDate: { gte: monthStart, lt: monthEnd },
      }),
      this.sumInvoiceLineTotals(scope, {
        status: { in: [...OUTSTANDING_STATUSES] },
      }),
      this.sumInvoiceLineTotals(scope, {
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
          status: 'ACTIVE',
        },
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
      this.prisma.deal.count({
        where: {
          ...baseScope,
          stage: { in: [...OPEN_DEAL_STAGES] },
        },
      }),
    ]);

    return {
      currency: workspace?.currency ?? 'USD',
      invoicedMonthly,
      collectedMonthly,
      outstandingAmount,
      overdueAmount,
      outstandingCount,
      clientsTotal,
      clientsActive,
      projectsActive,
      projectsInvoiceReady,
      projectsCompletedThisMonth,
      tasksDueToday,
      tasksOverdue,
      openDeals,
    };
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
