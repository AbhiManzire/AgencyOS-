import type { FileRecord } from '../../../files/repositories/file.repository.interface';
import type { EmailDeliveryStatus } from '../../../notifications/email.service.interface';

export interface InvoicePdfResult {
  readonly file: FileRecord;
  readonly generatedAt: Date;
}

export interface InvoiceEmailResult {
  readonly status: EmailDeliveryStatus;
  readonly email: string;
  readonly messageId: string | null;
  readonly error: string | null;
  readonly fileId: string;
}

export interface SendInvoiceEmailCommand {
  readonly email?: string;
  readonly contactId?: string;
}
