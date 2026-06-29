import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { Public } from '../../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { SendInvoiceEmailDto } from '../dto/send-invoice-email.dto';
import type {
  InvoiceEmailResult,
  InvoicePdfResult,
} from '../delivery/invoice-delivery-application.types';
import { InvoiceDeliveryService } from '../delivery/invoice-delivery.service';
import type {
  InvoiceApplicationContext,
  InvoiceScope,
} from '../services/invoice-application.types';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('invoices')
export class InvoiceDeliveryController {
  constructor(private readonly invoiceDeliveryService: InvoiceDeliveryService) {}

  @Post(':id/pdf')
  @RequirePermissions('invoices.update')
  async generatePdf(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<InvoicePdfResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.invoiceDeliveryService.generatePdf(scope, id, context);

    return successResponse(result);
  }

  @Get(':id/pdf')
  @RequirePermissions('invoices.read')
  async getPdf(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('download') download: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const scope = this.resolveScope(headers);
    const { buffer, file } = await this.invoiceDeliveryService.getPdfBuffer(scope, id);
    const disposition = download === 'true' ? 'attachment' : 'inline';

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(file.originalName)}"`,
    );
    response.send(buffer);
  }

  @Post(':id/email')
  @RequirePermissions('invoices.update')
  async sendEmail(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendInvoiceEmailDto,
  ): Promise<ApiSuccessResponse<InvoiceEmailResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.invoiceDeliveryService.sendEmail(scope, id, dto, context);

    return successResponse(result);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): InvoiceScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): InvoiceApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
