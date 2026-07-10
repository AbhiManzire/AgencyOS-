import { Inject, Injectable } from '@nestjs/common';
import type { DashboardScope, DashboardSummary } from '../dashboard.types';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
} from '../repositories/dashboard.repository.interface';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getSummary(scope: DashboardScope, asOf: Date = new Date()): Promise<DashboardSummary> {
    const aggregates = await this.dashboardRepository.getSummaryAggregates(scope, asOf);

    return {
      asOf: asOf.toISOString(),
      currency: aggregates.currency,
      revenue: {
        invoicedMonthly: aggregates.invoicedMonthly,
        collectedMonthly: aggregates.collectedMonthly,
      },
      invoices: {
        outstandingAmount: aggregates.outstandingAmount,
        overdueAmount: aggregates.overdueAmount,
        outstandingCount: aggregates.outstandingCount,
      },
      clients: {
        total: aggregates.clientsTotal,
        active: aggregates.clientsActive,
      },
      projects: {
        active: aggregates.projectsActive,
        invoiceReady: aggregates.projectsInvoiceReady,
        completedThisMonth: aggregates.projectsCompletedThisMonth,
      },
      tasks: {
        dueToday: aggregates.tasksDueToday,
        overdue: aggregates.tasksOverdue,
      },
      sales: {
        openDeals: aggregates.openDeals,
      },
    };
  }
}
