import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateClientContactDto } from '../dto/create-client-contact.dto';
import { UpdateClientContactDto } from '../dto/update-client-contact.dto';
import { ClientContactMapper } from '../mappers/client-contact.mapper';
import type { ClientContactRecord } from '../repositories/client-contact.repository.interface';
import type { ClientScope } from '../repositories/client.repository.interface';
import type { ClientContactApplicationContext } from '../services/client-contact-application.types';
import { ClientContactService } from '../services/client-contact.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('clients/:clientId/contacts')
export class ClientContactsController {
  constructor(private readonly clientContactService: ClientContactService) {}

  @Get()
  @RequirePermissions('clients.contacts.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<ApiSuccessResponse<readonly ClientContactRecord[]>> {
    const scope = this.resolveScope(headers);
    const contacts = await this.clientContactService.listContacts(scope, clientId);

    return successResponse(contacts);
  }

  @Post()
  @RequirePermissions('clients.contacts.manage')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateClientContactDto,
  ): Promise<ApiSuccessResponse<ClientContactRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ClientContactMapper.toCreateClientContactCommand(dto);
    const contact = await this.clientContactService.createContact(
      scope,
      clientId,
      command,
      context,
    );

    return successResponse(contact);
  }

  @Patch(':contactId')
  @RequirePermissions('clients.contacts.manage')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateClientContactDto,
  ): Promise<ApiSuccessResponse<ClientContactRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ClientContactMapper.toUpdateClientContactCommand(dto);
    const contact = await this.clientContactService.updateContact(
      scope,
      clientId,
      contactId,
      command,
      context,
    );

    return successResponse(contact);
  }

  @Delete(':contactId')
  @RequirePermissions('clients.contacts.manage')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ): Promise<ApiSuccessResponse<ClientContactRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const contact = await this.clientContactService.deleteContact(
      scope,
      clientId,
      contactId,
      context,
    );

    return successResponse(contact);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ClientScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ClientContactApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
