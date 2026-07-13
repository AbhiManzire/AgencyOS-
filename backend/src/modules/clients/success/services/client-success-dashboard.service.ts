import { Injectable } from '@nestjs/common';
import type { ClientHealthStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientScope } from '../../repositories/client.repository.interface';

export interface ClientSuccessHealthDistribution {
  readonly green: number;
  readonly yellow: number;
  readonly red: number;
  readonly unknown: number;
}

export interface ClientAtRiskItem {
  readonly id: string;
  readonly displayName: string;
  readonly healthStatus: ClientHealthStatus | null;
  readonly outstanding: number;
  readonly nextRenewalDate: Date | null;
}

export interface ClientSuccessDashboard {
  readonly activeClients: number;
  readonly newClients: number;
  readonly revenue: number;
  readonly outstanding: number;
  readonly renewalsThisMonth: number;
  readonly healthDistribution: ClientSuccessHealthDistribution;
  readonly clientsAtRisk: readonly ClientAtRiskItem[];
}

@Injectable()
export class ClientSuccessDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(scope: ClientScope): Promise<ClientSuccessDashboard> {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    const today = startOfUtcDay(now);

    const activeWhere = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      status: 'ACTIVE' as const,
      deletedAt: null,
    };

    const [
      activeClients,
      newClients,
      revenueAgg,
      outstandingAgg,
      renewalsThisMonth,
      green,
      yellow,
      red,
      unknown,
      atRiskCandidates,
    ] = await Promise.all([
      this.prisma.client.count({ where: activeWhere }),
      this.prisma.client.count({
        where: {
          ...activeWhere,
          becameClientAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          status: 'COMPLETED',
          paidAt: { gte: monthStart, lte: monthEnd },
          invoice: {
            deletedAt: null,
            client: {
              tenantId: scope.tenantId,
              workspaceId: scope.workspaceId,
              deletedAt: null,
            },
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
          client: {
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
        _sum: { balanceDue: true },
      }),
      this.prisma.clientRenewal.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          renewalDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.client.count({ where: { ...activeWhere, healthStatus: 'GREEN' } }),
      this.prisma.client.count({ where: { ...activeWhere, healthStatus: 'YELLOW' } }),
      this.prisma.client.count({ where: { ...activeWhere, healthStatus: 'RED' } }),
      this.prisma.client.count({ where: { ...activeWhere, healthStatus: null } }),
      this.prisma.client.findMany({
        where: {
          ...activeWhere,
          OR: [
            { healthStatus: 'RED' },
            {
              renewals: {
                some: {
                  deletedAt: null,
                  status: { in: ['ACTIVE', 'UPCOMING', 'OVERDUE'] },
                  renewalDate: { lt: today },
                },
              },
            },
            {
              invoices: {
                some: {
                  deletedAt: null,
                  status: 'OVERDUE',
                },
              },
            },
          ],
        },
        select: {
          id: true,
          displayName: true,
          healthStatus: true,
          invoices: {
            where: {
              deletedAt: null,
              status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
            },
            select: { balanceDue: true },
          },
          renewals: {
            where: {
              deletedAt: null,
              status: { in: ['ACTIVE', 'UPCOMING', 'OVERDUE'] },
            },
            orderBy: { renewalDate: 'asc' },
            take: 1,
            select: { renewalDate: true },
          },
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const clientsAtRisk: ClientAtRiskItem[] = atRiskCandidates.map((client) => ({
      id: client.id,
      displayName: client.displayName,
      healthStatus: client.healthStatus,
      outstanding: client.invoices.reduce(
        (sum, invoice) => sum + decimalToNumber(invoice.balanceDue),
        0,
      ),
      nextRenewalDate: client.renewals[0]?.renewalDate ?? null,
    }));

    return {
      activeClients,
      newClients,
      revenue: decimalToNumber(revenueAgg._sum.amount),
      outstanding: decimalToNumber(outstandingAgg._sum.balanceDue),
      renewalsThisMonth,
      healthDistribution: { green, yellow, red, unknown },
      clientsAtRisk,
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
