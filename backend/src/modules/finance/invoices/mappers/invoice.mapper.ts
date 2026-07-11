import type {
  CreateInvoiceCommand,
  ListInvoicesQuery,
  UpdateInvoiceCommand,
} from '../services/invoice-application.types';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { ListInvoicesQueryDto } from '../dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';

export const InvoiceMapper = {
  toCreateInvoiceCommand(dto: CreateInvoiceDto): CreateInvoiceCommand {
    return {
      clientId: dto.clientId,
      projectId: dto.projectId,
      quoteId: dto.quoteId,
      dealId: dto.dealId,
      invoiceNumber: dto.invoiceNumber,
      status: dto.status,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      currency: dto.currency,
      notes: dto.notes,
      terms: dto.terms,
      taxMode: dto.taxMode,
      discountAmount: dto.discountAmount,
      approvalStatus: dto.approvalStatus,
    };
  },

  toUpdateInvoiceCommand(dto: UpdateInvoiceDto): UpdateInvoiceCommand {
    return {
      clientId: dto.clientId,
      projectId: dto.projectId,
      quoteId: dto.quoteId,
      dealId: dto.dealId,
      invoiceNumber: dto.invoiceNumber,
      status: dto.status,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      currency: dto.currency,
      notes: dto.notes,
      terms: dto.terms,
      taxMode: dto.taxMode,
      discountAmount: dto.discountAmount,
      approvalStatus: dto.approvalStatus,
    };
  },

  toListInvoicesQuery(dto: ListInvoicesQueryDto): ListInvoicesQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      status: dto.status,
      clientId: dto.clientId,
      projectId: dto.projectId,
      quoteId: dto.quoteId,
      includeArchived: dto.includeArchived,
    };
  },
};
