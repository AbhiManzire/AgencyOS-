import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { Public } from '../../../common/decorators/public.decorator';
import { ArchiveClientDto } from '../dto/archive-client.dto';
import { CreateClientDto } from '../dto/create-client.dto';
import { ListClientsQueryDto } from '../dto/list-clients-query.dto';
import { RestoreClientDto } from '../dto/restore-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientMapper } from '../mappers/client.mapper';
import type { ClientRecord } from '../repositories/client.repository.interface';
import type { ClientApplicationContext, ClientScope } from '../services/client-application.types';
import { ClientService } from '../services/client.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateClientDto,
  ): Promise<ApiSuccessResponse<ClientRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ClientMapper.toCreateClientCommand(dto);
    const client = await this.clientService.createClient(scope, command, context);

    return successResponse(client);
  }

  @Get()
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListClientsQueryDto,
  ): Promise<ApiSuccessResponse<readonly ClientRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = ClientMapper.toListClientsQuery(queryDto);
    const result = await this.clientService.listClients(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ClientRecord>> {
    const scope = this.resolveScope(headers);
    const client = await this.clientService.getClient(scope, id);

    return successResponse(client);
  }

  @Patch(':id')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ApiSuccessResponse<ClientRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ClientMapper.toUpdateClientCommand(dto);
    const client = await this.clientService.updateClient(scope, id, command, context);

    return successResponse(client);
  }

  @Post(':id/archive')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ArchiveClientDto,
  ): Promise<ApiSuccessResponse<ClientRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    ClientMapper.toArchiveClientCommand(dto);
    const client = await this.clientService.archiveClient(scope, id, context);

    return successResponse(client);
  }

  @Post(':id/restore')
  async restore(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestoreClientDto,
  ): Promise<ApiSuccessResponse<ClientRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ClientMapper.toRestoreClientCommand(dto);
    const client = await this.clientService.restoreClient(scope, id, command, context);

    return successResponse(client);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ClientScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ClientApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
