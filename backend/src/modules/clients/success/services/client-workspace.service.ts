import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientScope } from '../../repositories/client.repository.interface';
import { CLIENT_SUCCESS_ERROR_CODES, ClientSuccessError } from '../domain/client-success.errors';
import type { ClientRenewalRecord } from '../repositories/client-renewal.repository.interface';
import { ClientHealthService, type ClientHealthResult } from './client-health.service';
import { ClientMetricsService, type ClientMetrics } from './client-metrics.service';
import { ClientRenewalService } from './client-renewal.service';

export interface ClientWorkspacePayment {
  readonly id: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
  readonly method: string;
  readonly paidAt: Date;
  readonly reference: string | null;
}

export interface ClientWorkspaceResult {
  readonly metrics: ClientMetrics;
  readonly health: ClientHealthResult;
  readonly deals: readonly Prisma.DealGetPayload<object>[];
  readonly projects: readonly Prisma.ProjectGetPayload<object>[];
  readonly invoices: readonly Prisma.InvoiceGetPayload<object>[];
  readonly payments: readonly ClientWorkspacePayment[];
  readonly renewals: readonly ClientRenewalRecord[];
  readonly contactsCount: number;
}

export interface ClientTimelineResult {
  readonly items: readonly Prisma.ActivityGetPayload<object>[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

@Injectable()
export class ClientWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clientMetricsService: ClientMetricsService,
    private readonly clientHealthService: ClientHealthService,
    private readonly clientRenewalService: ClientRenewalService,
  ) {}

  async getWorkspace(scope: ClientScope, clientId: string): Promise<ClientWorkspaceResult> {
    await this.requireClient(scope, clientId);

    const [metrics, health, deals, projects, invoices, payments, renewals, contactsCount] =
      await Promise.all([
        this.clientMetricsService.getMetrics(scope, clientId),
        this.clientHealthService.calculate(scope, clientId),
        this.prisma.deal.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            clientId,
            deletedAt: null,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),
        this.prisma.project.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            clientId,
            deletedAt: null,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),
        this.prisma.invoice.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            clientId,
            deletedAt: null,
          },
          orderBy: { issueDate: 'desc' },
          take: 50,
        }),
        this.prisma.payment.findMany({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            deletedAt: null,
            invoice: {
              clientId,
              deletedAt: null,
            },
          },
          orderBy: { paidAt: 'desc' },
          take: 50,
        }),
        this.clientRenewalService.listRenewals(scope, clientId, { take: 50 }),
        this.prisma.clientContact.count({
          where: {
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            clientId,
            deletedAt: null,
          },
        }),
      ]);

    return {
      metrics,
      health,
      deals,
      projects,
      invoices,
      payments: payments.map((payment) => ({
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        paidAt: payment.paidAt,
        reference: payment.reference,
      })),
      renewals: renewals.items,
      contactsCount,
    };
  }

  async getTimeline(
    scope: ClientScope,
    clientId: string,
    pagination: { skip?: number; take?: number } = {},
  ): Promise<ClientTimelineResult> {
    await this.requireClient(scope, clientId);

    const skip = pagination.skip ?? 0;
    const take = pagination.take ?? 25;
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: 'client',
      entityId: clientId,
    };

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { items, total, skip, take };
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
