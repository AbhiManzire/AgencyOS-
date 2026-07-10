import type { DashboardScope, DashboardSummaryAggregates } from '../dashboard.types';

export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

export interface DashboardRepository {
  getSummaryAggregates(scope: DashboardScope, asOf: Date): Promise<DashboardSummaryAggregates>;
}
