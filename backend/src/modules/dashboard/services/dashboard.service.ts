import { Inject, Injectable } from '@nestjs/common';
import { TtlCache } from '../../../common/cache/ttl-cache';
import type { DashboardAdminSummary, DashboardScope, DashboardSummary } from '../dashboard.types';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
} from '../repositories/dashboard.repository.interface';

const SUMMARY_CACHE_TTL_MS = 60_000;

@Injectable()
export class DashboardService {
  private readonly summaryCache = new TtlCache<DashboardSummary>(SUMMARY_CACHE_TTL_MS);

  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getSummary(scope: DashboardScope, asOf: Date = new Date()): Promise<DashboardSummary> {
    const cacheKey = `${scope.tenantId}:${scope.workspaceId}`;
    const cached = this.summaryCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const aggregates = await this.dashboardRepository.getSummaryAggregates(scope, asOf);

    const summary: DashboardSummary = {
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
        newClients: aggregates.clientsNew,
        lostClients: aggregates.clientsLost,
        retentionRate: aggregates.retentionRate,
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
        openTotal: aggregates.tasksOpenGlobal,
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
        netProfit: aggregates.netProfit,
        grossMargin: aggregates.grossMargin,
        collections: aggregates.monthlyCollections,
      },
      teamUtilization: aggregates.teamUtilization,
    };

    this.summaryCache.set(cacheKey, summary);
    return summary;
  }

  async getAdminSummary(
    scope: DashboardScope,
    actorUserId: string,
    asOf: Date = new Date(),
  ): Promise<DashboardAdminSummary> {
    return this.dashboardRepository.getAdminSummaryAggregates(scope, actorUserId, asOf);
  }
}
