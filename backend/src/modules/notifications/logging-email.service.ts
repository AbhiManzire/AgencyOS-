import { Injectable, Logger } from '@nestjs/common';
import type { EmailService, SendEmailParams, SendEmailResult } from './email.service.interface';

/** Development email service that logs outbound messages instead of sending. */
@Injectable()
export class LoggingEmailService implements EmailService {
  private readonly logger = new Logger(LoggingEmailService.name);

  send(params: SendEmailParams): Promise<SendEmailResult> {
    const messageId = `log-${String(Date.now())}`;
    const attachmentCount = params.attachments?.length ?? 0;

    this.logger.log(
      `Email queued to ${params.to} | subject="${params.subject}" | attachments=${String(attachmentCount)} | messageId=${messageId}`,
    );

    return Promise.resolve({
      messageId,
      status: 'SENT',
    });
  }
}
