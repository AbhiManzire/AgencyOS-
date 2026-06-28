import axios from 'axios';
import type { ApiErrorResponse } from '@/lib/api/api-response.types';

/** Extracts a user-facing message from an API or network error. */
export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (data?.success === false) {
      return data.error.message;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/** Returns true when the API responded with a 404 Not Found. */
export function isApiNotFoundError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (error.response?.status === 404) {
    return true;
  }

  const data = error.response?.data as ApiErrorResponse | undefined;
  return data?.success === false && data.error.statusCode === 404;
}
