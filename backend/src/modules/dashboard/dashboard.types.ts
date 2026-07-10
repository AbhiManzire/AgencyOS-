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
  };
  readonly projects: {
    readonly active: number;
    readonly invoiceReady: number;
    readonly completedThisMonth: number;
  };
  readonly tasks: {
    readonly dueToday: number;
    readonly overdue: number;
  };
  readonly sales: {
    readonly openDeals: number;
  };
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
  readonly projectsActive: number;
  readonly projectsInvoiceReady: number;
  readonly projectsCompletedThisMonth: number;
  readonly tasksDueToday: number;
  readonly tasksOverdue: number;
  readonly openDeals: number;
}
