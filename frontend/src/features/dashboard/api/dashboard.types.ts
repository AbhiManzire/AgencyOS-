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
