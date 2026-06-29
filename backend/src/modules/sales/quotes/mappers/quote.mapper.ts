import type {
  CreateQuoteCommand,
  ListQuotesQuery,
  UpdateQuoteCommand,
} from '../services/quote-application.types';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { ListQuotesQueryDto } from '../dto/list-quotes-query.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';

export const QuoteMapper = {
  toCreateQuoteCommand(dto: CreateQuoteDto): CreateQuoteCommand {
    return {
      dealId: dto.dealId,
      clientId: dto.clientId,
      quoteNumber: dto.quoteNumber,
      title: dto.title,
      status: dto.status,
      validUntil: dto.validUntil,
      currency: dto.currency,
      totalAmount: dto.totalAmount,
      notes: dto.notes,
    };
  },

  toUpdateQuoteCommand(dto: UpdateQuoteDto): UpdateQuoteCommand {
    return {
      dealId: dto.dealId,
      clientId: dto.clientId,
      quoteNumber: dto.quoteNumber,
      title: dto.title,
      status: dto.status,
      validUntil: dto.validUntil,
      currency: dto.currency,
      totalAmount: dto.totalAmount,
      notes: dto.notes,
    };
  },

  toListQuotesQuery(dto: ListQuotesQueryDto): ListQuotesQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      status: dto.status,
      dealId: dto.dealId,
      clientId: dto.clientId,
      includeArchived: dto.includeArchived,
    };
  },
};
