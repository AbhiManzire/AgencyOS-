import { Module } from '@nestjs/common';
import { ClientContactsController } from './controllers/client-contacts.controller';
import { ClientsController } from './controllers/clients.controller';
import { ClientContactDomainService } from './domain/client-contact-domain.service';
import { ClientDomainService } from './domain/client-domain.service';
import { CLIENT_CONTACT_REPOSITORY } from './repositories/client-contact.repository.interface';
import { PrismaClientContactRepository } from './repositories/prisma-client-contact.repository';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from './repositories/client.repository.interface';
import { PrismaClientRepository } from './repositories/prisma-client.repository';
import { ClientContactService } from './services/client-contact.service';
import { ClientService } from './services/client.service';

@Module({
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
    {
      provide: CLIENT_CONTACT_REPOSITORY,
      useClass: PrismaClientContactRepository,
    },
    {
      provide: ClientDomainService,
      useFactory: (clientRepository: ClientRepository) => new ClientDomainService(clientRepository),
      inject: [CLIENT_REPOSITORY],
    },
    ClientContactDomainService,
    ClientService,
    ClientContactService,
  ],
  controllers: [ClientsController, ClientContactsController],
  exports: [
    CLIENT_REPOSITORY,
    CLIENT_CONTACT_REPOSITORY,
    ClientDomainService,
    ClientContactDomainService,
    ClientService,
    ClientContactService,
  ],
})
export class ClientsModule {}
