import { RetryPolicyService } from './retry-policy.service';

describe('RetryPolicyService', () => {
  const service = new RetryPolicyService();

  describe('shouldRetry', () => {
    it('allows retry while attempts remain', () => {
      expect(service.shouldRetry(0, 3)).toBe(true);
      expect(service.shouldRetry(1, 3)).toBe(true);
    });

    it('denies retry when max attempts are exhausted', () => {
      expect(service.shouldRetry(2, 3)).toBe(false);
    });

    it('denies retry when maxAttempts is zero', () => {
      expect(service.shouldRetry(0, 0)).toBe(false);
    });
  });

  describe('computeNextRetryAt', () => {
    it('applies exponential backoff from the base delay', () => {
      const from = new Date('2026-07-12T12:00:00.000Z');

      expect(service.computeNextRetryAt(0, 1000, from).toISOString()).toBe(
        '2026-07-12T12:00:01.000Z',
      );
      expect(service.computeNextRetryAt(1, 1000, from).toISOString()).toBe(
        '2026-07-12T12:00:02.000Z',
      );
      expect(service.computeNextRetryAt(2, 1000, from).toISOString()).toBe(
        '2026-07-12T12:00:04.000Z',
      );
    });

    it('never returns a delay below zero', () => {
      const from = new Date('2026-07-12T12:00:00.000Z');

      expect(service.computeNextRetryAt(-1, -500, from).toISOString()).toBe(
        '2026-07-12T12:00:00.000Z',
      );
    });
  });
});
