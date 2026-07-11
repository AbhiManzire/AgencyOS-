import { Module } from '@nestjs/common';
import { ClientContactsController } from './controllers/client-contacts.controller';
import { ClientTagsController } from './controllers/client-tags.controller';
import { ClientsController } from './controllers/clients.controller';
import { ClientContactDomainService } from './domain/client-contact-domain.service';
import { ClientDomainService } from './domain/client-domain.service';
import { CLIENT_CONTACT_REPOSITORY } from './repositories/client-contact.repository.interface';
import { PrismaClientContactRepository } from './repositories/prisma-client-contact.repository';
import { CLIENT_TAG_REPOSITORY } from './repositories/client-tag.repository.interface';
import { PrismaClientTagRepository } from './repositories/prisma-client-tag.repository';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from './repositories/client.repository.interface';
import { PrismaClientRepository } from './repositories/prisma-client.repository';
import { ClientContactService } from './services/client-contact.service';
import { ClientTagService } from './services/client-tag.service';
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
      provide: CLIENT_TAG_REPOSITORY,
      useClass: PrismaClientTagRepository,
    },
    {
      provide: ClientDomainService,
      useFactory: (clientRepository: ClientRepository) => new ClientDomainService(clientRepository),
      inject: [CLIENT_REPOSITORY],
    },
    ClientContactDomainService,
    ClientService,
    ClientContactService,
    ClientTagService,
  ],
  controllers: [ClientsController, ClientContactsController, ClientTagsController],
  exports: [
    CLIENT_REPOSITORY,
    CLIENT_CONTACT_REPOSITORY,
    CLIENT_TAG_REPOSITORY,
    ClientDomainService,
    ClientContactDomainService,
    ClientService,
    ClientContactService,
    ClientTagService,
  ],
})
export class ClientsModule {}
