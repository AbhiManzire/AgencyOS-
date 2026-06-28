import { Module } from '@nestjs/common';
import { ClientsController } from './controllers/clients.controller';
import { ClientDomainService } from './domain/client-domain.service';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from './repositories/client.repository.interface';
import { PrismaClientRepository } from './repositories/prisma-client.repository';
import { ClientService } from './services/client.service';

@Module({
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
    {
      provide: ClientDomainService,
      useFactory: (clientRepository: ClientRepository) => new ClientDomainService(clientRepository),
      inject: [CLIENT_REPOSITORY],
    },
    ClientService,
  ],
  controllers: [ClientsController],
  exports: [CLIENT_REPOSITORY, ClientDomainService, ClientService],
})
export class ClientsModule {}
