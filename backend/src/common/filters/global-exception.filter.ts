import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { isDomainError } from '../errors/domain-error.contract';
import { buildErrorBody, errorResponse } from '../http/api-response';
import type { ApiValidationDetail } from '../http/api-response.types';
import { mapDomainErrorCode, mapDomainErrorToHttpStatus } from '../http/domain-error-http.mapper';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, body } = this.resolveError(exception);

    if (statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : 'Unhandled exception',
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json(errorResponse(body));
  }

  private resolveError(exception: unknown): {
    statusCode: number;
    body: ReturnType<typeof buildErrorBody>;
  } {
    if (isDomainError(exception)) {
      const statusCode = mapDomainErrorToHttpStatus(exception.code);

      return {
        statusCode,
        body: buildErrorBody(mapDomainErrorCode(exception.code), exception.message, statusCode),
      };
    }

    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: buildErrorBody(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
    };
  }

  private resolveHttpException(exception: HttpException): {
    statusCode: number;
    body: ReturnType<typeof buildErrorBody>;
  } {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        body: buildErrorBody(this.httpStatusToCode(statusCode), exceptionResponse, statusCode),
      };
    }

    if (this.isValidationErrorResponse(exceptionResponse)) {
      const details = this.toValidationDetails(exceptionResponse.message);
      const message =
        details.length > 0 ? 'Validation failed.' : 'The request could not be processed.';

      return {
        statusCode,
        body: buildErrorBody('VALIDATION_ERROR', message, statusCode, details),
      };
    }

    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      const message = exceptionResponse.message;
      const normalizedMessage = Array.isArray(message) ? message.join('; ') : String(message);

      return {
        statusCode,
        body: buildErrorBody(this.httpStatusToCode(statusCode), normalizedMessage, statusCode),
      };
    }

    return {
      statusCode,
      body: buildErrorBody(this.httpStatusToCode(statusCode), exception.message, statusCode),
    };
  }

  private isValidationErrorResponse(
    response: object,
  ): response is { message: string | string[]; error?: string } {
    return 'message' in response;
  }

  private toValidationDetails(messages: string | string[]): readonly ApiValidationDetail[] {
    const items = Array.isArray(messages) ? messages : [messages];

    return items.map((message) => ({
      field: 'request',
      message,
    }));
  }

  private httpStatusToCode(statusCode: number): string {
    if (statusCode === 400) {
      return 'BAD_REQUEST';
    }

    if (statusCode === 401) {
      return 'UNAUTHORIZED';
    }

    if (statusCode === 403) {
      return 'FORBIDDEN';
    }

    if (statusCode === 404) {
      return 'NOT_FOUND';
    }

    if (statusCode === 409) {
      return 'CONFLICT';
    }

    if (statusCode === 422) {
      return 'UNPROCESSABLE_ENTITY';
    }

    return 'HTTP_ERROR';
  }
}
