import type { FileRecord } from '@/features/files/api/file.types';

export type InvoiceEmailDeliveryStatus = 'SENT' | 'FAILED';

export interface InvoicePdfResult {
  readonly file: FileRecord;
  readonly generatedAt: string;
}

export interface InvoiceEmailResult {
  readonly status: InvoiceEmailDeliveryStatus;
  readonly email: string;
  readonly messageId: string | null;
  readonly error: string | null;
  readonly fileId: string;
}

export interface SendInvoiceEmailPayload {
  readonly email?: string;
  readonly contactId?: string;
}
