import type { InvoiceStatus } from '@prisma/client';
import {
  type ClientRepository,
  type ClientScope,
} from '../../../clients/repositories/client.repository.interface';
import {
  type ProjectRepository,
  type ProjectScope,
} from '../../../projects/repositories/project.repository.interface';
import {
  type QuoteRepository,
  type QuoteScope,
} from '../../../sales/quotes/repositories/quote.repository.interface';
import type { InvoiceRecord } from '../repositories/invoice.repository.interface';
import { INVOICE_DOMAIN_ERROR_CODES, InvoiceDomainError } from './invoice-domain.errors';
import type {
  CreateInvoiceValidationInput,
  UpdateInvoiceValidationInput,
} from './invoice-domain.types';

const VALID_STATUSES: readonly InvoiceStatus[] = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'VOID',
];

export class InvoiceDomainService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly quoteRepository: QuoteRepository,
  ) {}

  validateCreate(input: CreateInvoiceValidationInput): void {
    this.assertInvoiceNumberRequired(input.invoiceNumber);
    this.assertDatesValid(input.issueDate, input.dueDate);

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  validateUpdate(invoice: InvoiceRecord, input: UpdateInvoiceValidationInput): void {
    this.assertInvoiceIsActive(invoice);

    if (input.invoiceNumber !== undefined) {
      this.assertInvoiceNumberRequired(input.invoiceNumber);
    }

    if (input.issueDate !== undefined || input.dueDate !== undefined) {
      const issueDate = input.issueDate ?? invoice.issueDate;
      const dueDate = input.dueDate ?? invoice.dueDate;
      this.assertDatesValid(issueDate, dueDate);
    }

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  assertCanMarkViewed(invoice: InvoiceRecord): void {
    this.assertInvoiceIsActive(invoice);
    if (invoice.status === 'CANCELLED' || invoice.status === 'VOID') {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        `Cannot mark invoices in "${invoice.status}" status as viewed.`,
      );
    }
  }

  assertCanCancel(invoice: InvoiceRecord): void {
    this.assertInvoiceIsActive(invoice);
    if (invoice.status === 'CANCELLED') {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.ALREADY_CANCELLED,
        'Invoice is already cancelled.',
      );
    }
    if (invoice.status === 'VOID' || invoice.status === 'PAID') {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        `Cannot cancel invoices in "${invoice.status}" status.`,
      );
    }
  }

  assertCanApprove(invoice: InvoiceRecord): void {
    this.assertInvoiceIsActive(invoice);
    if (invoice.approvalStatus === 'APPROVED') {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.ALREADY_APPROVED,
        'Invoice is already approved.',
      );
    }
  }

  async validateClient(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(scope, clientId);

    if (client?.deletedAt != null || client == null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }
  }

  async validateProject(scope: ProjectScope, projectId: string, clientId: string): Promise<void> {
    const project = await this.projectRepository.findById(scope, projectId);

    if (project === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    if (project.deletedAt !== null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.PROJECT_ARCHIVED,
        'Project is archived and cannot be used for invoices.',
      );
    }

    if (project.clientId !== clientId) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.PROJECT_CLIENT_MISMATCH,
        'Project does not belong to the selected client.',
      );
    }
  }

  async validateQuote(scope: QuoteScope, quoteId: string, clientId: string): Promise<void> {
    const quote = await this.quoteRepository.findById(scope, quoteId);

    if (quote === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.QUOTE_NOT_FOUND,
        'Quote was not found.',
      );
    }

    if (quote.clientId !== clientId) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.QUOTE_CLIENT_MISMATCH,
        'Quote does not belong to the selected client.',
      );
    }
  }

  normalizeInvoiceNumber(invoiceNumber: string): string {
    return invoiceNumber.trim().toUpperCase();
  }

  normalizeOptionalNotes(notes: string | null | undefined): string | null {
    if (notes === undefined || notes === null) {
      return null;
    }

    const trimmed = notes.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizeOptionalTerms(terms: string | null | undefined): string | null {
    if (terms === undefined || terms === null) {
      return null;
    }

    const trimmed = terms.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  generateInvoiceNumber(): string {
    const suffix = Date.now().toString(36).toUpperCase().slice(-8);
    return `INV-${suffix}`;
  }

  private assertInvoiceNumberRequired(invoiceNumber: string): void {
    if (invoiceNumber.trim().length === 0) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NUMBER_REQUIRED,
        'Invoice number is required.',
      );
    }
  }

  private assertDatesValid(issueDate: Date, dueDate: Date): void {
    if (dueDate.getTime() < issueDate.getTime()) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVALID_DATES,
        'Due date cannot be before issue date.',
      );
    }
  }

  private assertStatusValid(status: InvoiceStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Invoice status is invalid.',
      );
    }
  }

  private assertInvoiceIsActive(invoice: InvoiceRecord): void {
    if (invoice.deletedAt !== null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_ARCHIVED,
        'Invoice is archived and cannot be modified.',
      );
    }
  }
}
