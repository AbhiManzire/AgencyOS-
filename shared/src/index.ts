/** Shared constants and types used across frontend and backend. */

export {
  DEPLOY_DEFAULT_AGENCY_ID,
  DEPLOY_DEFAULT_TENANT_ID,
  DEPLOY_DEFAULT_USER_ID,
  DEPLOY_DEFAULT_WORKSPACE_ID,
} from './deploy-defaults';

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

export interface LivenessResponse {
  readonly status: 'ok';
  readonly timestamp: string;
  readonly service: string;
}

export interface ReadinessResponse {
  readonly status: HealthStatus;
  readonly timestamp: string;
  readonly service: string;
  readonly checks: {
    readonly database: HealthStatus;
  };
}
