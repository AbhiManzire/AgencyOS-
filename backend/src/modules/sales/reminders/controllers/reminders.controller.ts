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
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { ListRemindersQueryDto } from '../dto/list-reminders-query.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';
import { ReminderMapper } from '../mappers/reminder.mapper';
import type { ReminderRecord } from '../repositories/reminder.repository.interface';
import type {
  ReminderApplicationContext,
  ReminderScope,
} from '../services/reminder-application.types';
import { ReminderService } from '../services/reminder.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  @RequirePermissions('sales.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateReminderDto,
  ): Promise<ApiSuccessResponse<ReminderRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ReminderMapper.toCreateReminderCommand(dto);
    const reminder = await this.reminderService.createReminder(scope, command, context);

    return successResponse(reminder);
  }

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListRemindersQueryDto,
  ): Promise<ApiSuccessResponse<readonly ReminderRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = ReminderMapper.toListRemindersQuery(queryDto);
    const result = await this.reminderService.listReminders(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('sales.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ReminderRecord>> {
    const scope = this.resolveScope(headers);
    const reminder = await this.reminderService.getReminder(scope, id);

    return successResponse(reminder);
  }

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReminderDto,
  ): Promise<ApiSuccessResponse<ReminderRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ReminderMapper.toUpdateReminderCommand(dto);
    const reminder = await this.reminderService.updateReminder(scope, id, command, context);

    return successResponse(reminder);
  }

  @Delete(':id')
  @RequirePermissions('sales.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ReminderRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const reminder = await this.reminderService.deleteReminder(scope, id, context);

    return successResponse(reminder);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ReminderScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ReminderApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
