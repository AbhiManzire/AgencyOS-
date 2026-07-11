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
        total: aggregates.projectsTotal,
        active: aggregates.projectsActive,
        planning: aggregates.projectsPlanning,
        onHold: aggregates.projectsOnHold,
        completed: aggregates.projectsCompleted,
        cancelled: aggregates.projectsCancelled,
        invoiceReady: aggregates.projectsInvoiceReady,
        completedThisMonth: aggregates.projectsCompletedThisMonth,
        atRisk: aggregates.projectsAtRisk,
        endingSoon: aggregates.projectsEndingSoon,
        overBudget: aggregates.projectsOverBudget,
      },
      tasks: {
        dueToday: aggregates.tasksDueToday,
        overdue: aggregates.tasksOverdue,
        myTasks: {
          openTotal: aggregates.tasksOpenTotal,
          completed: aggregates.tasksCompleted,
          blocked: aggregates.tasksBlocked,
          dueToday: aggregates.tasksAssignedDueToday,
          overdue: aggregates.tasksAssignedOverdue,
          dueThisWeek: aggregates.tasksDueThisWeek,
        },
      },
      sales: {
        leadCount: aggregates.leadCount,
        qualifiedLeads: aggregates.qualifiedLeads,
        openDeals: aggregates.openDeals,
        pipelineValue: aggregates.pipelineValue,
        expectedRevenue: aggregates.expectedRevenue,
        wonRevenue: aggregates.wonRevenue,
        lostRevenue: aggregates.lostRevenue,
        conversionRate: aggregates.conversionRate,
        averageDealSize: aggregates.averageDealSize,
      },
      finance: {
        expensesMonthly: aggregates.expensesMonthly,
        profitMonthly: aggregates.profitMonthly,
        overdueAmount: aggregates.overdueAmount,
        cashBalance: aggregates.cashBalance,
        monthlyCollections: aggregates.monthlyCollections,
        monthlyExpenses: aggregates.monthlyExpenses,
        mrr: aggregates.mrr,
        arr: aggregates.arr,
      },
    };
  }
}
