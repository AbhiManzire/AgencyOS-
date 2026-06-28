export { ClientsModule } from './clients.module';
export { ClientsController } from './controllers/clients.controller';
export {
  CLIENT_DOMAIN_ERROR_CODES,
  ClientDomainError,
  type ClientDomainErrorCode,
} from './domain/client-domain.errors';
export { ClientDomainService, generateSlug } from './domain/client-domain.service';
export {
  CLIENT_CREATABLE_STATUSES,
  CLIENT_RESTORABLE_STATUSES,
  CLIENT_SOFT_DELETE_RETENTION_DAYS,
  type ArchiveValidationContext,
  type ClientMembershipContext,
  type CreateClientValidationInput,
  type RestoreClientValidationInput,
  type UpdateClientValidationInput,
} from './domain/client-domain.types';
export {
  CLIENT_REPOSITORY,
  type ArchiveClientData,
  type ClientRecord,
  type ClientRepository,
  type ClientScope,
  type CreateClientData,
  type FindByIdOptions,
  type ListClientsParams,
  type ListClientsResult,
  type RestoreClientData,
  type UpdateClientData,
} from './repositories/client.repository.interface';
export { ClientService } from './services/client.service';
export {
  type ClientApplicationContext,
  type CreateClientCommand,
  type GetClientOptions,
  type ListClientsQuery,
  type RestoreClientCommand,
  type UpdateClientCommand,
} from './services/client-application.types';
export { CreateClientDto } from './dto/create-client.dto';
export { UpdateClientDto } from './dto/update-client.dto';
export { ArchiveClientDto } from './dto/archive-client.dto';
export { RestoreClientDto } from './dto/restore-client.dto';
export { ListClientsQueryDto } from './dto/list-clients-query.dto';
export { ClientMapper, type ArchiveClientCommand } from './mappers/client.mapper';
