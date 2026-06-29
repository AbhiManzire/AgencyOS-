import type { ClientContactStatus } from '@prisma/client';
import {
  CLIENT_CONTACT_DOMAIN_ERROR_CODES,
  ClientContactDomainError,
} from './client-contact-domain.errors';
import {
  CLIENT_CONTACT_STATUSES,
  type CreateClientContactValidationInput,
  type UpdateClientContactValidationInput,
} from './client-contact-domain.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pure domain service for client contact business rules.
 * Framework-independent — no HTTP or NestJS dependencies.
 */
export class ClientContactDomainService {
  validateCreate(input: CreateClientContactValidationInput): void {
    this.assertFirstNameRequired(input.firstName);
    this.assertOptionalEmail(input.email);

    const status = input.status ?? 'ACTIVE';
    this.assertValidStatus(status);
  }

  validateUpdate(input: UpdateClientContactValidationInput): void {
    if (input.firstName !== undefined) {
      this.assertFirstNameRequired(input.firstName);
    }

    if (input.email !== undefined) {
      this.assertOptionalEmail(input.email);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
    }
  }

  normalizeFirstName(firstName: string): string {
    return firstName.trim();
  }

  normalizeOptionalString(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private assertFirstNameRequired(firstName: string): void {
    if (firstName.trim().length === 0) {
      throw new ClientContactDomainError(
        CLIENT_CONTACT_DOMAIN_ERROR_CODES.FIRST_NAME_REQUIRED,
        'First name is required.',
      );
    }
  }

  private assertOptionalEmail(email: string | null | undefined): void {
    if (email === undefined || email === null) {
      return;
    }

    const trimmed = email.trim();
    if (trimmed.length === 0) {
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      throw new ClientContactDomainError(
        CLIENT_CONTACT_DOMAIN_ERROR_CODES.INVALID_EMAIL,
        'Email format is invalid.',
      );
    }
  }

  private assertValidStatus(status: ClientContactStatus): void {
    if (!CLIENT_CONTACT_STATUSES.includes(status)) {
      throw new ClientContactDomainError(
        CLIENT_CONTACT_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Contact status is invalid.',
      );
    }
  }
}
