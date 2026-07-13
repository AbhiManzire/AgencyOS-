import { Injectable } from '@nestjs/common';
import type { ClientHealthStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientScope } from '../../repositories/client.repository.interface';
import { CLIENT_SUCCESS_ERROR_CODES, ClientSuccessError } from '../domain/client-success.errors';

export interface ClientHealthFactors {
  readonly daysSinceLastActivity: number | null;
  readonly overdueInvoiceCount: number;
  readonly delayedProjectCount: number;
  readonly overdueRenewalCount: number;
  readonly overdueFollowUpCount: number;
  readonly activityPenalty: number;
  readonly overdueInvoicePenalty: number;
  readonly delayedProjectPenalty: number;
  readonly overdueRenewalPenalty: number;
  readonly overdueFollowUpPenalty: number;
}

export interface ClientHealthResult {
  readonly score: number;
  readonly status: ClientHealthStatus;
  readonly factors: ClientHealthFactors;
}

@Injectable()
export class ClientHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(scope: ClientScope, clientId: string): Promise<ClientHealthResult> {
    await this.requireClient(scope, clientId);

    const now = new Date();
    const today = startOfUtcDay(now);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      lastActivity,
      overdueInvoiceCount,
      delayedProjectCount,
      overdueRenewalCount,
      overdueFollowUpCount,
    ] = await Promise.all([
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
      this.prisma.invoice.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          clientId,
          deletedAt: null,
          status: 'OVERDUE',
        },
      }),
      this.prisma.project.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          clientId,
          deletedAt: null,
          status: { in: ['ACTIVE', 'PLANNING', 'ON_HOLD'] },
          targetEndDate: { lt: today },
        },
      }),
      this.prisma.clientRenewal.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          clientId,
          deletedAt: null,
          status: { in: ['ACTIVE', 'UPCOMING', 'OVERDUE'] },
          renewalDate: { lt: today },
        },
      }),
      this.prisma.followUp.count({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          entityType: 'client',
          entityId: clientId,
          deletedAt: null,
          status: { in: ['PENDING', 'MISSED'] },
          scheduledAt: { lt: now },
        },
      }),
    ]);

    const lastActivityAt = lastActivity?.createdAt ?? null;
    const daysSinceLastActivity =
      lastActivityAt === null
        ? null
        : Math.floor((now.getTime() - lastActivityAt.getTime()) / (24 * 60 * 60 * 1000));

    let activityPenalty = 0;
    if (lastActivityAt === null || lastActivityAt < sixtyDaysAgo) {
      activityPenalty = 40;
    } else if (lastActivityAt < thirtyDaysAgo) {
      activityPenalty = 25;
    }

    const overdueInvoicePenalty = Math.min(overdueInvoiceCount * 15, 45);
    const delayedProjectPenalty = Math.min(delayedProjectCount * 10, 30);
    const overdueRenewalPenalty = Math.min(overdueRenewalCount * 15, 30);
    const overdueFollowUpPenalty = Math.min(overdueFollowUpCount * 5, 20);

    const score = Math.max(
      0,
      Math.min(
        100,
        100 -
          activityPenalty -
          overdueInvoicePenalty -
          delayedProjectPenalty -
          overdueRenewalPenalty -
          overdueFollowUpPenalty,
      ),
    );

    const status: ClientHealthStatus = score >= 70 ? 'GREEN' : score >= 40 ? 'YELLOW' : 'RED';

    return {
      score,
      status,
      factors: {
        daysSinceLastActivity,
        overdueInvoiceCount,
        delayedProjectCount,
        overdueRenewalCount,
        overdueFollowUpCount,
        activityPenalty,
        overdueInvoicePenalty,
        delayedProjectPenalty,
        overdueRenewalPenalty,
        overdueFollowUpPenalty,
      },
    };
  }

  async refreshAndPersist(scope: ClientScope, clientId: string): Promise<ClientHealthResult> {
    const health = await this.calculate(scope, clientId);
    const now = new Date();

    await this.prisma.client.updateMany({
      where: {
        id: clientId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
      data: {
        healthScore: health.score,
        healthStatus: health.status,
        healthCalculatedAt: now,
        updatedAt: now,
      },
    });

    return health;
  }

  private async requireClient(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (client === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
