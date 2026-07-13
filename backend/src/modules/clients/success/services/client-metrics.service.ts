import { Injectable } from '@nestjs/common';
import type { ClientHealthStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientScope } from '../../repositories/client.repository.interface';
import { CLIENT_SUCCESS_ERROR_CODES, ClientSuccessError } from '../domain/client-success.errors';
import { ClientHealthService } from './client-health.service';

export interface ClientMetrics {
  readonly lifetimeRevenue: number;
  readonly outstanding: number;
  readonly paidAmount: number;
  readonly activeProjects: number;
  readonly completedProjects: number;
  readonly openDeals: number;
  readonly lastActivityAt: Date | null;
  readonly lastInvoiceAt: Date | null;
  readonly renewalDate: Date | null;
  readonly healthScore: number;
  readonly healthStatus: ClientHealthStatus;
  readonly clientSince: Date | null;
}

@Injectable()
export class ClientMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientHealthService: ClientHealthService,
  ) {}

  async getMetrics(scope: ClientScope, clientId: string): Promise<ClientMetrics> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: { id: true, becameClientAt: true },
    });

    if (client === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    const today = startOfUtcDay(new Date());
    const clientWhere = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId,
      deletedAt: null,
    } as const;

    const [
      lifetimeAgg,
      outstandingAgg,
      paidAgg,
      activeProjects,
      completedProjects,
      openDeals,
      lastActivity,
      lastInvoice,
      upcomingRenewal,
      overdueRenewal,
      health,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: {
          ...clientWhere,
          status: { notIn: ['DRAFT', 'CANCELLED', 'VOID'] },
        },
        _sum: { grandTotal: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...clientWhere,
          status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        _sum: { balanceDue: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          status: 'COMPLETED',
          invoice: {
            clientId,
            deletedAt: null,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.project.count({
        where: {
          ...clientWhere,
          status: { in: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'INVOICE_READY'] },
        },
      }),
      this.prisma.project.count({
        where: {
          ...clientWhere,
          status: 'COMPLETED',
        },
      }),
      this.prisma.deal.count({
        where: {
          ...clientWhere,
          status: 'OPEN',
          stage: { notIn: ['WON', 'LOST', 'ARCHIVED'] },
        },
      }),
      this.prisma.activity.findFirst({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          entityType: 'client',
          entityId: clientId,
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.invoice.findFirst({
        where: clientWhere,
        orderBy: { issueDate: 'desc' },
        select: { issueDate: true },
      }),
      this.prisma.clientRenewal.findFirst({
        where: {
          ...clientWhere,
          status: { in: ['ACTIVE', 'UPCOMING'] },
          renewalDate: { gte: today },
        },
        orderBy: { renewalDate: 'asc' },
        select: { renewalDate: true },
      }),
      this.prisma.clientRenewal.findFirst({
        where: {
          ...clientWhere,
          status: { in: ['ACTIVE', 'UPCOMING', 'OVERDUE'] },
          renewalDate: { lt: today },
        },
        orderBy: { renewalDate: 'desc' },
        select: { renewalDate: true },
      }),
      this.clientHealthService.calculate(scope, clientId),
    ]);

    const renewalDate = upcomingRenewal?.renewalDate ?? overdueRenewal?.renewalDate ?? null;

    return {
      lifetimeRevenue: decimalToNumber(lifetimeAgg._sum.grandTotal),
      outstanding: decimalToNumber(outstandingAgg._sum.balanceDue),
      paidAmount: decimalToNumber(paidAgg._sum.amount),
      activeProjects,
      completedProjects,
      openDeals,
      lastActivityAt: lastActivity?.createdAt ?? null,
      lastInvoiceAt: lastInvoice?.issueDate ?? null,
      renewalDate,
      healthScore: health.score,
      healthStatus: health.status,
      clientSince: client.becameClientAt,
    };
  }
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
