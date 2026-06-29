import type {
  CreateDealCommand,
  ListDealsQuery,
  UpdateDealCommand,
} from '../services/deal-application.types';
import { CreateDealDto } from '../dto/create-deal.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';

export const DealMapper = {
  toCreateDealCommand(dto: CreateDealDto): CreateDealCommand {
    return {
      clientId: dto.clientId,
      contactId: dto.contactId,
      title: dto.title,
      value: dto.value,
      currency: dto.currency,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      stage: dto.stage,
    };
  },

  toUpdateDealCommand(dto: UpdateDealDto): UpdateDealCommand {
    return {
      clientId: dto.clientId,
      contactId: dto.contactId,
      title: dto.title,
      value: dto.value,
      currency: dto.currency,
      expectedCloseDate: dto.expectedCloseDate,
      ownerUserId: dto.ownerUserId,
      stage: dto.stage,
    };
  },

  toListDealsQuery(dto: ListDealsQueryDto): ListDealsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      stage: dto.stage,
      ownerUserId: dto.ownerUserId,
      clientId: dto.clientId,
      includeArchived: dto.includeArchived,
    };
  },
};
