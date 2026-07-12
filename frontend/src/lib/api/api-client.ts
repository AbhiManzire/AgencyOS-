import {
  DEPLOY_DEFAULT_TENANT_ID,
  DEPLOY_DEFAULT_USER_ID,
  DEPLOY_DEFAULT_WORKSPACE_ID,
} from '@agencyos/shared';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { AUTH_CONFIG, isAuthExplicitlyEnabled } from '@/lib/auth/config';
import { getAccessToken } from '@/lib/auth/access-token';
import { ensureFreshAccessToken, refreshAccessToken } from '@/lib/auth/oidc';
import { dispatchSessionTimeout } from '@/lib/auth/session-timeout';

const DEV_TENANT_HEADER = 'x-tenant-id';
const DEV_WORKSPACE_HEADER = 'x-workspace-id';
const DEV_USER_HEADER = 'x-user-id';

const allowDevIdentityHeaders =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_ALLOW_DEV_IDENTITY_HEADERS === 'true';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
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
  } else {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  if (allowDevIdentityHeaders) {
    config.headers[DEV_TENANT_HEADER] =
      process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? DEPLOY_DEFAULT_TENANT_ID;
    config.headers[DEV_WORKSPACE_HEADER] =
      process.env.NEXT_PUBLIC_DEV_WORKSPACE_ID ?? DEPLOY_DEFAULT_WORKSPACE_ID;
    // Always send x-user-id in local/demo. When AUTH_ENABLED=true the server
    // BindJwtIdentityGuard overwrites this from the mapped AgencyOS user id.
    config.headers[DEV_USER_HEADER] = process.env.NEXT_PUBLIC_DEV_USER_ID ?? DEPLOY_DEFAULT_USER_ID;
  } else {
    config.headers[DEV_TENANT_HEADER] =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty env must use defaults
      process.env.NEXT_PUBLIC_TENANT_ID || DEPLOY_DEFAULT_TENANT_ID;
    config.headers[DEV_WORKSPACE_HEADER] =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty env must use defaults
      process.env.NEXT_PUBLIC_WORKSPACE_ID || DEPLOY_DEFAULT_WORKSPACE_ID;
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

    if (status === 401 && original && !original._retry && isAuthExplicitlyEnabled()) {
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
