/** Standard API success envelope. */
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: ApiResponseMeta;
}

/** Standard API error envelope. */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorBody;
}

/** Optional pagination or request metadata on success responses. */
export interface ApiResponseMeta {
  readonly total?: number;
  readonly skip?: number;
  readonly take?: number;
  readonly [key: string]: unknown;
}

/** Error payload returned to API consumers. */
export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
  readonly details?: readonly ApiValidationDetail[];
}

/** Field-level validation detail for boundary validation failures. */
export interface ApiValidationDetail {
  readonly field: string;
  readonly message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
