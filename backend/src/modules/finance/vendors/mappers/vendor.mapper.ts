import { CreateVendorDto } from '../dto/create-vendor.dto';
import { ListVendorsQueryDto } from '../dto/list-vendors-query.dto';
import { RestoreVendorDto } from '../dto/restore-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import type {
  CreateVendorCommand,
  ListVendorsQuery,
  RestoreVendorCommand,
  UpdateVendorCommand,
} from '../services/vendor-application.types';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const VendorMapper = {
  toCreateVendorCommand(dto: CreateVendorDto): CreateVendorCommand {
    return {
      name: dto.name,
      code: dto.code,
      gstin: dto.gstin,
      pan: dto.pan,
      email: dto.email,
      phone: dto.phone,
      contactPerson: dto.contactPerson,
      paymentTermsDays: dto.paymentTermsDays,
      currency: dto.currency,
      notes: dto.notes,
    };
  },

  toUpdateVendorCommand(dto: UpdateVendorDto): UpdateVendorCommand {
    return {
      name: dto.name,
      code: dto.code,
      gstin: dto.gstin,
      pan: dto.pan,
      email: dto.email,
      phone: dto.phone,
      contactPerson: dto.contactPerson,
      paymentTermsDays: dto.paymentTermsDays,
      currency: dto.currency,
      notes: dto.notes,
    };
  },

  toRestoreVendorCommand(_dto: RestoreVendorDto): RestoreVendorCommand {
    return {};
  },

  toListVendorsQuery(dto: ListVendorsQueryDto): ListVendorsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      q: dto.q,
      includeArchived: dto.includeArchived,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },
};
