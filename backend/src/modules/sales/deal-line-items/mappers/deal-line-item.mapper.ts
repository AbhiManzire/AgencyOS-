import type {
  CreateDealLineItemCommand,
  UpdateDealLineItemCommand,
} from '../services/deal-line-item-application.types';
import { CreateDealLineItemDto } from '../dto/create-deal-line-item.dto';
import { UpdateDealLineItemDto } from '../dto/update-deal-line-item.dto';

export const DealLineItemMapper = {
  toCreateDealLineItemCommand(dto: CreateDealLineItemDto): CreateDealLineItemCommand {
    return {
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      discount: dto.discount,
      tax: dto.tax,
      sortOrder: dto.sortOrder,
    };
  },

  toUpdateDealLineItemCommand(dto: UpdateDealLineItemDto): UpdateDealLineItemCommand {
    return {
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      discount: dto.discount,
      tax: dto.tax,
      sortOrder: dto.sortOrder,
    };
  },
};
