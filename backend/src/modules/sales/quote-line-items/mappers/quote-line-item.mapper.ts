import type {
  CreateQuoteLineItemCommand,
  UpdateQuoteLineItemCommand,
} from '../services/quote-line-item-application.types';
import { CreateQuoteLineItemDto } from '../dto/create-quote-line-item.dto';
import { UpdateQuoteLineItemDto } from '../dto/update-quote-line-item.dto';

export const QuoteLineItemMapper = {
  toCreateQuoteLineItemCommand(dto: CreateQuoteLineItemDto): CreateQuoteLineItemCommand {
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

  toUpdateQuoteLineItemCommand(dto: UpdateQuoteLineItemDto): UpdateQuoteLineItemCommand {
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
