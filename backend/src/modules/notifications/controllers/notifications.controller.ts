import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import type { NotificationRecord, NotificationScope } from '../notification.types';
import { NotificationService } from '../services/notification.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @RequirePermissions('notifications.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<ApiSuccessResponse<readonly NotificationRecord[]>> {
    const scope = this.resolveScope(headers);
    const recipientUserId = this.resolveUserId(headers);
    const result = await this.notificationService.list(scope, recipientUserId, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get('unread-count')
  @RequirePermissions('notifications.read')
  async unreadCount(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<{ count: number }>> {
    const scope = this.resolveScope(headers);
    const recipientUserId = this.resolveUserId(headers);
    const count = await this.notificationService.unreadCount(scope, recipientUserId);
    return successResponse({ count });
  }

  @Post('read-all')
  @RequirePermissions('notifications.read')
  async markAllRead(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<{ updated: number }>> {
    const scope = this.resolveScope(headers);
    const recipientUserId = this.resolveUserId(headers);
    const result = await this.notificationService.markAllRead(scope, recipientUserId);
    return successResponse(result);
  }

  @Post(':id/read')
  @RequirePermissions('notifications.read')
  async markRead(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<NotificationRecord>> {
    const scope = this.resolveScope(headers);
    const recipientUserId = this.resolveUserId(headers);
    const record = await this.notificationService.markRead(scope, id, recipientUserId);
    return successResponse(record);
  }

  @Delete(':id')
  @RequirePermissions('notifications.read')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<NotificationRecord>> {
    const scope = this.resolveScope(headers);
    const recipientUserId = this.resolveUserId(headers);
    const record = await this.notificationService.archive(scope, id, recipientUserId);
    return successResponse(record);
  }

  @Post()
  @RequirePermissions('notifications.manage')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateNotificationDto,
  ): Promise<ApiSuccessResponse<NotificationRecord>> {
    const scope = this.resolveScope(headers);
    const record = await this.notificationService.create(scope, dto);
    return successResponse(record);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): NotificationScope {
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

  private resolveUserId(headers: Record<string, string | string[] | undefined>): string {
    const userId = this.readHeader(headers, USER_HEADER);
    if (!isUUID(userId)) {
      throw new BadRequestException(`Header "${USER_HEADER}" must be a valid UUID.`);
    }
    return userId;
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
