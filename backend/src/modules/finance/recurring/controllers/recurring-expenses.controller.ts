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
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import {
  CreateRecurringDto,
  ListRecurringQueryDto,
  UpdateRecurringDto,
} from '../dto/create-recurring.dto';
import { RecurringMapper } from '../mappers/recurring.mapper';
import type { RecurringExpenseRecord } from '../repositories/recurring.repository.interface';
import type {
  RecurringApplicationContext,
  RecurringScope,
} from '../services/recurring-application.types';
import { RecurringExpenseService } from '../services/recurring.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('recurring-expenses')
export class RecurringExpensesController {
  constructor(private readonly recurringExpenseService: RecurringExpenseService) {}

  @Post()
  @RequirePermissions('finance.recurring.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateRecurringDto,
  ): Promise<ApiSuccessResponse<RecurringExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const row = await this.recurringExpenseService.create(
      scope,
      RecurringMapper.toCreateCommand(dto),
      context,
    );
    return successResponse(row);
  }

  @Get()
  @RequirePermissions('finance.recurring.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListRecurringQueryDto,
  ): Promise<ApiSuccessResponse<readonly RecurringExpenseRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = RecurringMapper.toListQuery(queryDto);
    const result = await this.recurringExpenseService.list(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('finance.recurring.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<RecurringExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const row = await this.recurringExpenseService.get(scope, id);
    return successResponse(row);
  }

  @Patch(':id')
  @RequirePermissions('finance.recurring.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringDto,
  ): Promise<ApiSuccessResponse<RecurringExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const row = await this.recurringExpenseService.update(
      scope,
      id,
      RecurringMapper.toUpdateCommand(dto),
      context,
    );
    return successResponse(row);
  }

  @Delete(':id')
  @RequirePermissions('finance.recurring.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<RecurringExpenseRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const row = await this.recurringExpenseService.archive(scope, id, context);
    return successResponse(row);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): RecurringScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): RecurringApplicationContext {
    return { actorUserId: this.readHeader(headers, USER_HEADER) };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
