export interface DashboardScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface DashboardSummary {
  readonly asOf: string;
  readonly currency: string;
  readonly revenue: {
    readonly invoicedMonthly: number;
    readonly collectedMonthly: number;
  };
  readonly invoices: {
    readonly outstandingAmount: number;
    readonly overdueAmount: number;
    readonly outstandingCount: number;
  };
  readonly clients: {
    readonly total: number;
    readonly active: number;
    readonly newClients: number;
    readonly lostClients: number;
    readonly retentionRate: number;
  };
  readonly projects: {
    readonly total: number;
    readonly active: number;
    readonly planning: number;
    readonly onHold: number;
    readonly completed: number;
    readonly cancelled: number;
    readonly invoiceReady: number;
    readonly completedThisMonth: number;
    readonly atRisk: number;
    readonly endingSoon: number;
    readonly overBudget: number;
  };
  readonly tasks: {
    readonly openTotal: number;
    readonly dueToday: number;
    readonly overdue: number;
    readonly myTasks: {
      readonly openTotal: number;
      readonly completed: number;
      readonly blocked: number;
      readonly dueToday: number;
      readonly overdue: number;
      readonly dueThisWeek: number;
    };
  };
  readonly sales: {
    readonly leadCount: number;
    readonly qualifiedLeads: number;
    readonly openDeals: number;
    readonly pipelineValue: number;
    readonly expectedRevenue: number;
    readonly wonRevenue: number;
    readonly lostRevenue: number;
    readonly conversionRate: number;
    readonly averageDealSize: number;
  };
  readonly finance: {
    readonly expensesMonthly: number;
    readonly profitMonthly: number;
    readonly overdueAmount: number;
    readonly cashBalance: number;
    readonly monthlyCollections: number;
    readonly monthlyExpenses: number;
    readonly mrr: number;
    readonly arr: number;
    readonly netProfit: number;
    readonly grossMargin: number;
    readonly collections: number;
  };
  readonly teamUtilization: number;
}

export interface DashboardAdminSummary {
  readonly activeUsers: number;
  readonly workspaceCount: number;
  readonly pendingInvites: number;
  readonly unreadNotifications: number;
  readonly auditEventsLast24h: number;
}

export interface DashboardSummaryAggregates {
  readonly currency: string;
  readonly invoicedMonthly: number;
  readonly collectedMonthly: number;
  readonly outstandingAmount: number;
  readonly overdueAmount: number;
  readonly outstandingCount: number;
  readonly clientsTotal: number;
  readonly clientsActive: number;
  readonly clientsNew: number;
  readonly clientsLost: number;
  readonly retentionRate: number;
  readonly projectsTotal: number;
  readonly projectsActive: number;
  readonly projectsPlanning: number;
  readonly projectsOnHold: number;
  readonly projectsCancelled: number;
  readonly projectsInvoiceReady: number;
  readonly projectsCompletedThisMonth: number;
  readonly projectsCompleted: number;
  readonly projectsAtRisk: number;
  readonly projectsEndingSoon: number;
  readonly projectsOverBudget: number;
  readonly tasksDueToday: number;
  readonly tasksOverdue: number;
  readonly tasksOpenTotal: number;
  readonly tasksOpenGlobal: number;
  readonly tasksCompleted: number;
  readonly tasksBlocked: number;
  readonly tasksAssignedDueToday: number;
  readonly tasksAssignedOverdue: number;
  readonly tasksDueThisWeek: number;
  readonly leadCount: number;
  readonly qualifiedLeads: number;
  readonly openDeals: number;
  readonly pipelineValue: number;
  readonly expectedRevenue: number;
  readonly wonRevenue: number;
  readonly lostRevenue: number;
  readonly conversionRate: number;
  readonly averageDealSize: number;
  readonly expensesMonthly: number;
  readonly profitMonthly: number;
  readonly cashBalance: number;
  readonly monthlyCollections: number;
  readonly monthlyExpenses: number;
  readonly mrr: number;
  readonly arr: number;
  readonly netProfit: number;
  readonly grossMargin: number;
  readonly teamUtilization: number;
}
