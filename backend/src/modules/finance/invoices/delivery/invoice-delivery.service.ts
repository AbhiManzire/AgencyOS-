import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActivityService } from '../../../activities/services/activity.service';
import {
  CLIENT_CONTACT_REPOSITORY,
  type ClientContactRepository,
  type ClientContactScope,
} from '../../../clients/repositories/client-contact.repository.interface';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { FileService } from '../../../files/services/file.service';
import type { FileRecord } from '../../../files/repositories/file.repository.interface';
import { EMAIL_SERVICE, type EmailService } from '../../../notifications/email.service.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  INVOICE_LINE_ITEM_REPOSITORY,
  type InvoiceLineItemInvoiceScope,
  type InvoiceLineItemRecord,
  type InvoiceLineItemRepository,
} from '../../invoice-line-items/repositories/invoice-line-item.repository.interface';
import { INVOICE_DOMAIN_ERROR_CODES, InvoiceDomainError } from '../domain/invoice-domain.errors';
import { InvoiceLineItemDomainService } from '../../invoice-line-items/domain/invoice-line-item-domain.service';
import {
  INVOICE_DELIVERY_DOMAIN_ERROR_CODES,
  InvoiceDeliveryDomainError,
} from './invoice-delivery-domain.errors';
import type {
  InvoiceEmailResult,
  InvoicePdfResult,
  SendInvoiceEmailCommand,
} from './invoice-delivery-application.types';
import { InvoicePdfGenerator } from '../pdf/invoice-pdf.generator';
import {
  INVOICE_REPOSITORY,
  type InvoiceRepository,
  type InvoiceScope,
} from '../repositories/invoice.repository.interface';
import type {
  InvoiceApplicationContext,
  InvoiceRecord,
} from '../services/invoice-application.types';

const INVOICE_ENTITY_TYPE = 'invoice';
const PDF_MIME_TYPE = 'application/pdf';

@Injectable()
export class InvoiceDeliveryService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(INVOICE_LINE_ITEM_REPOSITORY)
    private readonly invoiceLineItemRepository: InvoiceLineItemRepository,
    @Inject(CLIENT_CONTACT_REPOSITORY)
    private readonly clientContactRepository: ClientContactRepository,
    private readonly invoiceLineItemDomainService: InvoiceLineItemDomainService,
    private readonly fileService: FileService,
    private readonly activityService: ActivityService,
    private readonly pdfGenerator: InvoicePdfGenerator,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async generatePdf(
    scope: InvoiceScope,
    invoiceId: string,
    context: InvoiceApplicationContext,
  ): Promise<InvoicePdfResult> {
    const invoice = await this.requireInvoice(scope, invoiceId);
    const lineItems = await this.requireLineItems(scope, invoiceId);

    const buffer = await this.pdfGenerator.generate({ invoice, lineItems });
    const originalName = `${invoice.invoiceNumber}.pdf`;

    return this.runInTransaction(async () => {
      const file = await this.fileService.uploadFile(
        scope,
        {
          entityType: INVOICE_ENTITY_TYPE,
          entityId: invoiceId,
          originalName,
          mimeType: PDF_MIME_TYPE,
          buffer,
        },
        context,
      );

      await this.logActivity(scope, context, {
        entityType: INVOICE_ENTITY_TYPE,
        entityId: invoiceId,
        type: 'invoice.pdf.generated',
        title: 'Invoice PDF generated',
        description: `${originalName} was created.`,
        metadata: { fileId: file.id, invoiceNumber: invoice.invoiceNumber },
      });

      return {
        file,
        generatedAt: file.createdAt,
      };
    });
  }

  async getPdfBuffer(
    scope: InvoiceScope,
    invoiceId: string,
  ): Promise<{ readonly buffer: Buffer; readonly file: FileRecord }> {
    await this.requireInvoice(scope, invoiceId);
    const file = await this.requireLatestPdf(scope, invoiceId);
    const { buffer } = await this.fileService.downloadFile(scope, file.id);

    return { buffer, file };
  }

  async sendEmail(
    scope: InvoiceScope,
    invoiceId: string,
    command: SendInvoiceEmailCommand,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceEmailResult> {
    const invoice = await this.requireInvoice(scope, invoiceId);
    await this.requireLineItems(scope, invoiceId);

    const recipientEmail = await this.resolveRecipientEmail(scope, invoice, command);
    const pdfFile = await this.ensurePdfExists(scope, invoiceId, context);
    const { buffer } = await this.fileService.downloadFile(scope, pdfFile.id);

    try {
      const emailResult = await this.emailService.send({
        to: recipientEmail,
        subject: `Invoice ${invoice.invoiceNumber}`,
        html: this.buildEmailHtml(invoice, recipientEmail),
        attachments: [
          {
            filename: pdfFile.originalName,
            content: buffer,
            mimeType: PDF_MIME_TYPE,
          },
        ],
      });

      await this.runInTransaction(async () => {
        if (invoice.status === 'DRAFT') {
          await this.invoiceRepository.update(scope, invoiceId, {
            status: 'SENT',
            updatedAt: new Date(),
            updatedByUserId: context.actorUserId,
          });
        }

        await this.logActivity(scope, context, {
          entityType: INVOICE_ENTITY_TYPE,
          entityId: invoiceId,
          type: 'invoice.email.sent',
          title: 'Invoice emailed',
          description: `Sent to ${recipientEmail}.`,
          metadata: {
            email: recipientEmail,
            status: emailResult.status,
            messageId: emailResult.messageId,
            fileId: pdfFile.id,
          },
        });
      });

      return {
        status: emailResult.status,
        email: recipientEmail,
        messageId: emailResult.messageId,
        error: null,
        fileId: pdfFile.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email delivery failed.';

      await this.logActivity(scope, context, {
        entityType: INVOICE_ENTITY_TYPE,
        entityId: invoiceId,
        type: 'invoice.email.failed',
        title: 'Invoice email failed',
        description: message,
        metadata: {
          email: recipientEmail,
          status: 'FAILED',
          fileId: pdfFile.id,
        },
      });

      throw new InvoiceDeliveryDomainError(
        INVOICE_DELIVERY_DOMAIN_ERROR_CODES.EMAIL_DELIVERY_FAILED,
        message,
      );
    }
  }

  private async ensurePdfExists(
    scope: InvoiceScope,
    invoiceId: string,
    context: InvoiceApplicationContext,
  ): Promise<FileRecord> {
    const existing = await this.findLatestPdf(scope, invoiceId);
    if (existing !== null) {
      return existing;
    }

    const generated = await this.generatePdf(scope, invoiceId, context);
    return generated.file;
  }

  private async findLatestPdf(scope: InvoiceScope, invoiceId: string): Promise<FileRecord | null> {
    const files = await this.fileService.listFilesByEntity(scope, INVOICE_ENTITY_TYPE, invoiceId);
    const pdfFiles = files
      .filter((file) => file.mimeType === PDF_MIME_TYPE)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    return pdfFiles[0] ?? null;
  }

  private async requireLatestPdf(scope: InvoiceScope, invoiceId: string): Promise<FileRecord> {
    const file = await this.findLatestPdf(scope, invoiceId);

    if (file === null) {
      throw new InvoiceDeliveryDomainError(
        INVOICE_DELIVERY_DOMAIN_ERROR_CODES.PDF_NOT_FOUND,
        'No PDF has been generated for this invoice yet.',
      );
    }

    return file;
  }

  private async resolveRecipientEmail(
    scope: InvoiceScope,
    invoice: InvoiceRecord,
    command: SendInvoiceEmailCommand,
  ): Promise<string> {
    if (command.email !== undefined && command.email.trim().length > 0) {
      return command.email.trim();
    }

    const clientScope = toClientScope(scope);
    const contactScope: ClientContactScope = {
      ...clientScope,
      clientId: invoice.clientId,
    };

    if (command.contactId !== undefined) {
      const contact = await this.clientContactRepository.findById(contactScope, command.contactId);
      if (
        contact?.email !== null &&
        contact?.email !== undefined &&
        contact.email.trim().length > 0
      ) {
        return contact.email.trim();
      }
    }

    const contacts = await this.clientContactRepository.listByClient(contactScope);
    const primaryWithEmail = contacts.find(
      (contact) => contact.isPrimary && contact.email !== null && contact.email.trim().length > 0,
    );
    if (primaryWithEmail?.email) {
      return primaryWithEmail.email.trim();
    }

    const anyWithEmail = contacts.find(
      (contact) => contact.email !== null && contact.email.trim().length > 0,
    );
    if (anyWithEmail?.email) {
      return anyWithEmail.email.trim();
    }

    throw new InvoiceDeliveryDomainError(
      INVOICE_DELIVERY_DOMAIN_ERROR_CODES.RECIPIENT_EMAIL_REQUIRED,
      'A recipient email address is required to send this invoice.',
    );
  }

  private buildEmailHtml(invoice: InvoiceRecord, recipientEmail: string): string {
    return `
      <p>Hello,</p>
      <p>Please find attached invoice <strong>${invoice.invoiceNumber}</strong> for ${invoice.clientName}.</p>
      <p>Issue date: ${invoice.issueDate.toISOString().slice(0, 10)}<br/>
      Due date: ${invoice.dueDate.toISOString().slice(0, 10)}</p>
      <p>This message was sent to ${recipientEmail}.</p>
    `.trim();
  }

  private async requireLineItems(
    scope: InvoiceScope,
    invoiceId: string,
  ): Promise<readonly InvoiceLineItemRecord[]> {
    const invoiceScope: InvoiceLineItemInvoiceScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      invoiceId,
    };
    const lineItems = await this.invoiceLineItemRepository.listByInvoice(invoiceScope);

    if (lineItems.length === 0) {
      throw new InvoiceDeliveryDomainError(
        INVOICE_DELIVERY_DOMAIN_ERROR_CODES.NO_LINE_ITEMS,
        'Add at least one line item before generating or sending the invoice.',
      );
    }

    return lineItems;
  }

  private async requireInvoice(scope: InvoiceScope, invoiceId: string): Promise<InvoiceRecord> {
    const invoice = await this.invoiceRepository.findById(scope, invoiceId);

    if (invoice === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
        'Invoice was not found.',
      );
    }

    this.invoiceLineItemDomainService.assertInvoiceIsActive(invoice);
    return invoice;
  }

  private async logActivity(
    scope: InvoiceScope,
    context: InvoiceApplicationContext,
    command: {
      readonly entityType: string;
      readonly entityId: string;
      readonly type: string;
      readonly title: string;
      readonly description: string;
      readonly metadata: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await this.activityService.createActivity(scope, command, context);
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function toClientScope(scope: InvoiceScope): ClientScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
  };
}
