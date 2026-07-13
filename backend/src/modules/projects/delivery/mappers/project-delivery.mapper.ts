import type {
  CreateProjectFromClientCommand,
  CreateProjectFromDealCommand,
} from '../services/project-delivery-application.types';
import { CreateProjectFromClientDto } from '../dto/create-project-from-client.dto';
import { CreateProjectFromDealDto } from '../dto/create-project-from-deal.dto';

/** Maps HTTP DTOs to application commands — no business logic. */
export const ProjectDeliveryMapper = {
  toCreateFromDealCommand(dto: CreateProjectFromDealDto): CreateProjectFromDealCommand {
    return {
      dealId: dto.dealId,
      templateId: dto.templateId,
      name: dto.name,
      projectManagerUserId: dto.projectManagerUserId,
    };
  },

  toCreateFromClientCommand(dto: CreateProjectFromClientDto): CreateProjectFromClientCommand {
    return {
      clientId: dto.clientId,
      templateId: dto.templateId,
      name: dto.name,
      projectManagerUserId: dto.projectManagerUserId,
      primaryContactId: dto.primaryContactId,
      serviceType: dto.serviceType,
      startDate: dto.startDate,
      targetEndDate: dto.targetEndDate,
    };
  },
};
