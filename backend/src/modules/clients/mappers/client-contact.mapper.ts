import type {
  CreateClientContactCommand,
  UpdateClientContactCommand,
} from '../services/client-contact-application.types';
import { CreateClientContactDto } from '../dto/create-client-contact.dto';
import { UpdateClientContactDto } from '../dto/update-client-contact.dto';

/** Maps HTTP DTOs to application commands — no business logic. */
export const ClientContactMapper = {
  toCreateClientContactCommand(dto: CreateClientContactDto): CreateClientContactCommand {
    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      jobTitle: dto.jobTitle,
      department: dto.department,
      email: dto.email,
      mobile: dto.mobile,
      phone: dto.phone,
      isPrimary: dto.isPrimary,
      isDecisionMaker: dto.isDecisionMaker,
      isFinance: dto.isFinance,
      isTechnical: dto.isTechnical,
      isProcurement: dto.isProcurement,
      status: dto.status,
    };
  },

  toUpdateClientContactCommand(dto: UpdateClientContactDto): UpdateClientContactCommand {
    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      jobTitle: dto.jobTitle,
      department: dto.department,
      email: dto.email,
      mobile: dto.mobile,
      phone: dto.phone,
      isPrimary: dto.isPrimary,
      isDecisionMaker: dto.isDecisionMaker,
      isFinance: dto.isFinance,
      isTechnical: dto.isTechnical,
      isProcurement: dto.isProcurement,
      status: dto.status,
    };
  },
};
