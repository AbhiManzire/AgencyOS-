import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { ListActivitiesQueryDto } from '../dto/list-activities-query.dto';
import { ActivityMapper } from '../mappers/activity.mapper';
import type { ActivityRecord, ActivityScope } from '../repositories/activity.repository.interface';
import type {
  ActivityApplicationContext,
  ActivityTypesCatalog,
} from '../services/activity-application.types';
import { ActivityService } from '../services/activity.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListActivitiesQueryDto,
  ): Promise<ApiSuccessResponse<readonly ActivityRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = ActivityMapper.toListActivitiesQuery(queryDto);
    const result = await this.activityService.listActivities(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get('types')
  getTypes(): ApiSuccessResponse<ActivityTypesCatalog> {
    return successResponse(this.activityService.getActivityTypes());
  }

  @Get(':entityType/:entityId')
  async listByEntity(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query() queryDto: ListActivitiesQueryDto,
  ): Promise<ApiSuccessResponse<readonly ActivityRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = ActivityMapper.toListActivitiesQuery(queryDto);
    const result = await this.activityService.getTimeline(scope, entityType, entityId, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Post()
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateActivityDto,
  ): Promise<ApiSuccessResponse<ActivityRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ActivityMapper.toCreateActivityCommand(dto);
    const activity = await this.activityService.logManualActivity(
      scope,
      {
        entityType: command.entityType,
        entityId: command.entityId,
        type: command.type,
        title: command.title,
        description: command.description,
        metadata: command.metadata,
      },
      context,
    );

    return successResponse(activity);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ActivityScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ActivityApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
