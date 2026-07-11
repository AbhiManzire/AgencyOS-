import type {
  ConvertDealToInvoiceCommand,
  CreateDealCommand,
  ListDealsQuery,
  UpdateDealCommand,
} from '../services/deal-application.types';
import { ConvertDealToInvoiceDto } from '../dto/convert-deal-to-invoice.dto';
import { CreateDealDto } from '../dto/create-deal.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';

export const DealMapper = {
  toCreateDealCommand(dto: CreateDealDto): CreateDealCommand {
    return {
      clientId: dto.clientId,
      contactId: dto.contactId,
      leadId: dto.leadId,
      title: dto.title,
      value: dto.value,
      currency: dto.currency,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      stage: dto.stage,
      service: dto.service,
      probability: dto.probability,
      priority: dto.priority,
    };
  },

  toUpdateDealCommand(dto: UpdateDealDto): UpdateDealCommand {
    return {
      clientId: dto.clientId,
      contactId: dto.contactId,
      leadId: dto.leadId,
      title: dto.title,
      value: dto.value,
      currency: dto.currency,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      stage: dto.stage,
      service: dto.service,
      probability: dto.probability,
      priority: dto.priority,
    };
  },

  toListDealsQuery(dto: ListDealsQueryDto): ListDealsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      q: dto.q,
      stage: dto.stage,
      priority: dto.priority,
      ownerUserId: dto.ownerUserId,
      clientId: dto.clientId,
      leadId: dto.leadId,
      probabilityMin: dto.probabilityMin,
      probabilityMax: dto.probabilityMax,
      includeArchived: dto.includeArchived,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },

  toConvertDealToInvoiceCommand(dto: ConvertDealToInvoiceDto): ConvertDealToInvoiceCommand {
    return {
      projectId: dto.projectId,
      quoteId: dto.quoteId,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      notes: dto.notes,
    };
  },
};
