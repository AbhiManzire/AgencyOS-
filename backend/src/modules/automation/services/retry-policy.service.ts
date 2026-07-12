import { Injectable } from '@nestjs/common';

@Injectable()
export class RetryPolicyService {
  shouldRetry(attempt: number, maxAttempts: number): boolean {
    if (maxAttempts <= 0) {
      return false;
    }

    return attempt + 1 < maxAttempts;
  }

  computeNextRetryAt(attempt: number, retryDelayMs: number, from: Date = new Date()): Date {
    const normalizedAttempt = Math.max(0, attempt);
    const normalizedDelayMs = Math.max(0, retryDelayMs);
    const delayMs = normalizedDelayMs * 2 ** normalizedAttempt;

    return new Date(from.getTime() + delayMs);
  }
}
