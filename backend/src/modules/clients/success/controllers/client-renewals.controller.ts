import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { ClientApplicationContext } from '../../services/client-application.types';
import type { ClientScope } from '../../repositories/client.repository.interface';
import { CreateClientRenewalDto } from '../dto/create-client-renewal.dto';
import { ListClientRenewalsQueryDto } from '../dto/list-client-renewals-query.dto';
import { UpdateClientRenewalDto } from '../dto/update-client-renewal.dto';
import type { ClientRenewalRecord } from '../repositories/client-renewal.repository.interface';
import { ClientRenewalService } from '../services/client-renewal.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('clients/:clientId/renewals')
export class ClientRenewalsController {
  constructor(private readonly renewalService: ClientRenewalService) {}

  @Get()
  @RequirePermissions('clients.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: ListClientRenewalsQueryDto,
  ): Promise<ApiSuccessResponse<readonly ClientRenewalRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.renewalService.listRenewals(scope, clientId, {
      skip: query.skip,
      take: query.take,
      status: query.status,
    });

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 50,
    });
  }

  @Post()
  @RequirePermissions('clients.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateClientRenewalDto,
  ): Promise<ApiSuccessResponse<ClientRenewalRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const renewal = await this.renewalService.createRenewal(
      scope,
      clientId,
      {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency,
        renewalDate: dto.renewalDate,
        reminderDate: dto.reminderDate,
        autoNotify: dto.autoNotify,
        status: dto.status,
      },
      context,
    );
    return successResponse(renewal);
  }

  @Get(':renewalId')
  @RequirePermissions('clients.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('renewalId', ParseUUIDPipe) renewalId: string,
  ): Promise<ApiSuccessResponse<ClientRenewalRecord>> {
    const scope = this.resolveScope(headers);
    const renewal = await this.renewalService.getRenewal(scope, clientId, renewalId);
    return successResponse(renewal);
  }

  @Patch(':renewalId')
  @RequirePermissions('clients.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('renewalId', ParseUUIDPipe) renewalId: string,
    @Body() dto: UpdateClientRenewalDto,
  ): Promise<ApiSuccessResponse<ClientRenewalRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const renewal = await this.renewalService.updateRenewal(
      scope,
      clientId,
      renewalId,
      {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency,
        renewalDate: dto.renewalDate,
        reminderDate: dto.reminderDate,
        autoNotify: dto.autoNotify,
        status: dto.status,
      },
      context,
    );
    return successResponse(renewal);
  }

  @Delete(':renewalId')
  @RequirePermissions('clients.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('renewalId', ParseUUIDPipe) renewalId: string,
  ): Promise<ApiSuccessResponse<ClientRenewalRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const renewal = await this.renewalService.deleteRenewal(scope, clientId, renewalId, context);
    return successResponse(renewal);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ClientScope {
    const tenantId = this.readHeader(headers, TENANT_HEADER);
    const workspaceId = this.readHeader(headers, WORKSPACE_HEADER);

    if (!isUUID(tenantId)) {
      throw new BadRequestException(`Header "${TENANT_HEADER}" must be a valid UUID.`);
    }

    if (!isUUID(workspaceId)) {
      throw new BadRequestException(`Header "${WORKSPACE_HEADER}" must be a valid UUID.`);
    }

    return { tenantId, workspaceId };
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
