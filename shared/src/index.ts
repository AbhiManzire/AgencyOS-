/** Shared constants and types used across frontend and backend. */

export const APP_NAME = 'AgencyOS';

export type HealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  service: string;
  version: string;
  checks: {
    database: HealthStatus;
  };
}
