import {
  DEPLOY_DEFAULT_TENANT_ID,
  DEPLOY_DEFAULT_USER_ID,
  DEPLOY_DEFAULT_WORKSPACE_ID,
} from '@agencyos/shared';
import axios from 'axios';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { dispatchSessionTimeout } from '@/lib/auth/session-timeout';

const DEV_TENANT_HEADER = 'x-tenant-id';
const DEV_WORKSPACE_HEADER = 'x-workspace-id';
const DEV_USER_HEADER = 'x-user-id';

/** Shared Axios instance for AgencyOS REST API calls. */
export const apiClient = axios.create({
  baseURL: AUTH_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers[DEV_TENANT_HEADER] =
    process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? DEPLOY_DEFAULT_TENANT_ID;
  config.headers[DEV_WORKSPACE_HEADER] =
    process.env.NEXT_PUBLIC_DEV_WORKSPACE_ID ?? DEPLOY_DEFAULT_WORKSPACE_ID;
  config.headers[DEV_USER_HEADER] = process.env.NEXT_PUBLIC_DEV_USER_ID ?? DEPLOY_DEFAULT_USER_ID;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      dispatchSessionTimeout();
    }

    if (error instanceof Error) {
      return Promise.reject(error);
    }

    return Promise.reject(new Error('Request failed'));
  },
);
