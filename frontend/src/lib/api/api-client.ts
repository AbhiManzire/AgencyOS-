import {
  DEPLOY_DEFAULT_TENANT_ID,
  DEPLOY_DEFAULT_USER_ID,
  DEPLOY_DEFAULT_WORKSPACE_ID,
} from '@agencyos/shared';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_CONFIG, isAuthExplicitlyEnabled } from '@/lib/auth/config';
import { ensureFreshAccessToken, refreshAccessToken } from '@/lib/auth/oidc';
import { dispatchSessionTimeout } from '@/lib/auth/session-timeout';

const DEV_TENANT_HEADER = 'x-tenant-id';
const DEV_WORKSPACE_HEADER = 'x-workspace-id';
const DEV_USER_HEADER = 'x-user-id';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function resolveDemoTenantId(): string {
  const fromDev = process.env.NEXT_PUBLIC_DEV_TENANT_ID?.trim();
  if (fromDev) {
    return fromDev;
  }

  const fromPublic = process.env.NEXT_PUBLIC_TENANT_ID?.trim();
  if (fromPublic) {
    return fromPublic;
  }

  return DEPLOY_DEFAULT_TENANT_ID;
}

function resolveDemoWorkspaceId(): string {
  const fromDev = process.env.NEXT_PUBLIC_DEV_WORKSPACE_ID?.trim();
  if (fromDev) {
    return fromDev;
  }

  const fromPublic = process.env.NEXT_PUBLIC_WORKSPACE_ID?.trim();
  if (fromPublic) {
    return fromPublic;
  }

  return DEPLOY_DEFAULT_WORKSPACE_ID;
}

function resolveDemoUserId(): string {
  const fromDev = process.env.NEXT_PUBLIC_DEV_USER_ID?.trim();
  if (fromDev) {
    return fromDev;
  }

  return DEPLOY_DEFAULT_USER_ID;
}

/** Shared Axios instance for AgencyOS REST API calls. */
export const apiClient = axios.create({
  baseURL: AUTH_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (isAuthExplicitlyEnabled()) {
    const accessToken = await ensureFreshAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    config.headers[DEV_TENANT_HEADER] =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty env must use defaults
      process.env.NEXT_PUBLIC_TENANT_ID || DEPLOY_DEFAULT_TENANT_ID;
    config.headers[DEV_WORKSPACE_HEADER] =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty env must use defaults
      process.env.NEXT_PUBLIC_WORKSPACE_ID || DEPLOY_DEFAULT_WORKSPACE_ID;
    // x-user-id is bound server-side from JWT via BindJwtIdentityGuard.
  } else {
    // Demo / AUTH_ENABLED=false: header identity only — never send bearer tokens.
    if (config.headers.Authorization !== undefined) {
      delete config.headers.Authorization;
    }

    config.headers[DEV_TENANT_HEADER] = resolveDemoTenantId();
    config.headers[DEV_WORKSPACE_HEADER] = resolveDemoWorkspaceId();
    config.headers[DEV_USER_HEADER] = resolveDemoUserId();
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error instanceof Error ? error : new Error('Request failed'));
    }

    const axiosError = error as AxiosError;
    const original = axiosError.config as RetriableRequestConfig | undefined;
    const status = axiosError.response?.status;

    // Demo mode: never trigger Keycloak / session-expired UX.
    if (!isAuthExplicitlyEnabled()) {
      return Promise.reject(axiosError);
    }

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        original.headers.Authorization = `Bearer ${refreshed}`;
        return apiClient(original);
      }

      dispatchSessionTimeout();
      return Promise.reject(axiosError);
    }

    if (status === 401) {
      dispatchSessionTimeout();
    }

    return Promise.reject(axiosError);
  },
);
