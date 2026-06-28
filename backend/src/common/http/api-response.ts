import type {
  ApiErrorBody,
  ApiErrorResponse,
  ApiResponseMeta,
  ApiSuccessResponse,
  ApiValidationDetail,
} from './api-response.types';

/** Builds a typed success response envelope. */
export function successResponse<T>(data: T, meta?: ApiResponseMeta): ApiSuccessResponse<T> {
  return meta === undefined ? { success: true, data } : { success: true, data, meta };
}

/** Builds a typed error response envelope. */
export function errorResponse(body: ApiErrorBody): ApiErrorResponse {
  return {
    success: false,
    error: body,
  };
}

/** Builds an error body without the outer envelope (for exception filter use). */
export function buildErrorBody(
  code: string,
  message: string,
  statusCode: number,
  details?: readonly ApiValidationDetail[],
): ApiErrorBody {
  return details === undefined
    ? { code, message, statusCode }
    : { code, message, statusCode, details };
}
