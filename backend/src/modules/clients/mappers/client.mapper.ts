import type {
  CreateClientCommand,
  ListClientsQuery,
  RestoreClientCommand,
  UpdateClientCommand,
} from '../services/client-application.types';
import { ArchiveClientDto } from '../dto/archive-client.dto';
import { CreateClientDto } from '../dto/create-client.dto';
import { ListClientsQueryDto } from '../dto/list-clients-query.dto';
import { RestoreClientDto } from '../dto/restore-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';

/** Transport-layer archive command (application service does not consume this yet). */
export interface ArchiveClientCommand {
  readonly confirmed?: boolean;
}

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const ClientMapper = {
  toCreateClientCommand(dto: CreateClientDto): CreateClientCommand {
    return {
      displayName: dto.displayName,
      slug: dto.slug,
      status: dto.status,
      legalName: dto.legalName,
      industry: dto.industry,
      website: dto.website,
      phone: dto.phone,
      email: dto.email,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      stateRegion: dto.stateRegion,
      postalCode: dto.postalCode,
      countryCode: dto.countryCode,
      ownerUserId: dto.ownerUserId,
      source: dto.source,
      externalReferenceId: dto.externalReferenceId,
      becameClientAt: dto.becameClientAt,
    };
  },

  toUpdateClientCommand(dto: UpdateClientDto): UpdateClientCommand {
    return {
      displayName: dto.displayName,
      slug: dto.slug,
      status: dto.status,
      legalName: dto.legalName,
      industry: dto.industry,
      website: dto.website,
      phone: dto.phone,
      email: dto.email,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      stateRegion: dto.stateRegion,
      postalCode: dto.postalCode,
      countryCode: dto.countryCode,
      ownerUserId: dto.ownerUserId,
      source: dto.source,
      externalReferenceId: dto.externalReferenceId,
      becameClientAt: dto.becameClientAt,
    };
  },

  toArchiveClientCommand(dto: ArchiveClientDto): ArchiveClientCommand {
    return {
      confirmed: dto.confirmed,
    };
  },

  toRestoreClientCommand(dto: RestoreClientDto): RestoreClientCommand {
    return {
      targetStatus: dto.targetStatus,
    };
  },

  toListClientsQuery(dto: ListClientsQueryDto): ListClientsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      status: dto.status,
      includeArchived: dto.includeArchived,
    };
  },
};
