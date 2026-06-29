export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

export interface EmailAttachment {
  readonly filename: string;
  readonly content: Buffer;
  readonly mimeType: string;
}

export interface SendEmailParams {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly attachments?: readonly EmailAttachment[];
}

export type EmailDeliveryStatus = 'SENT' | 'FAILED';

export interface SendEmailResult {
  readonly messageId: string;
  readonly status: EmailDeliveryStatus;
}

export interface EmailService {
  send(params: SendEmailParams): Promise<SendEmailResult>;
}
