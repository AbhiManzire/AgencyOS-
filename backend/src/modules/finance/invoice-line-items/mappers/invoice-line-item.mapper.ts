import type {
  CreateInvoiceLineItemCommand,
  UpdateInvoiceLineItemCommand,
} from '../services/invoice-line-item-application.types';
import { CreateInvoiceLineItemDto } from '../dto/create-invoice-line-item.dto';
import { UpdateInvoiceLineItemDto } from '../dto/update-invoice-line-item.dto';

export const InvoiceLineItemMapper = {
  toCreateInvoiceLineItemCommand(dto: CreateInvoiceLineItemDto): CreateInvoiceLineItemCommand {
    return {
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unitPrice,
      discount: dto.discount,
      tax: dto.tax,
      sortOrder: dto.sortOrder,
    };
  },

  toUpdateInvoiceLineItemCommand(dto: UpdateInvoiceLineItemDto): UpdateInvoiceLineItemCommand {
    return {
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unitPrice,
      discount: dto.discount,
      tax: dto.tax,
      sortOrder: dto.sortOrder,
    };
  },
};
