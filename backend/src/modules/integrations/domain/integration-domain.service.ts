import { Injectable } from '@nestjs/common';
import { IntegrationProviderKey, IntegrationWebhookDirection } from '@prisma/client';
import {
  INTEGRATION_DOMAIN_ERROR_CODES,
  IntegrationDomainError,
} from './integration-domain.errors';

@Injectable()
export class IntegrationDomainService {
  normalizeRequiredString(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.DISPLAY_NAME_REQUIRED,
        'A non-empty value is required.',
      );
    }
    return trimmed;
  }

  normalizeOptionalString(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  assertProviderKey(value: string): IntegrationProviderKey {
    if (!Object.values(IntegrationProviderKey).includes(value as IntegrationProviderKey)) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.INVALID_PROVIDER,
        `Unknown integration provider: ${value}`,
      );
    }
    return value as IntegrationProviderKey;
  }

  assertWebhookDirection(value: string): IntegrationWebhookDirection {
    if (
      !Object.values(IntegrationWebhookDirection).includes(value as IntegrationWebhookDirection)
    ) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.INVALID_DIRECTION,
        `Unknown webhook direction: ${value}`,
      );
    }
    return value as IntegrationWebhookDirection;
  }

  validateCreateConnection(input: { displayName: string; providerKey: string }): void {
    this.normalizeRequiredString(input.displayName);
    this.assertProviderKey(input.providerKey);
  }

  validateCreateWebhook(input: {
    name: string;
    direction: string;
    endpointPath?: string | null;
    targetUrl?: string | null;
  }): void {
    const name = input.name.trim();
    if (name.length === 0) {
      throw new IntegrationDomainError(
        INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_NAME_REQUIRED,
        'Webhook name is required.',
      );
    }

    const direction = this.assertWebhookDirection(input.direction);

    if (direction === IntegrationWebhookDirection.INCOMING) {
      const path = (input.endpointPath ?? '').trim();
      if (path.length === 0) {
        throw new IntegrationDomainError(
          INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_ENDPOINT_PATH_REQUIRED,
          'Incoming webhooks require an endpointPath.',
        );
      }
    }

    if (direction === IntegrationWebhookDirection.OUTGOING) {
      const url = (input.targetUrl ?? '').trim();
      if (url.length === 0) {
        throw new IntegrationDomainError(
          INTEGRATION_DOMAIN_ERROR_CODES.WEBHOOK_TARGET_URL_REQUIRED,
          'Outgoing webhooks require a targetUrl.',
        );
      }
    }
  }
}
