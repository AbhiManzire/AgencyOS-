import { Body, Controller, Delete, Headers, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { UpdateFollowUpDto } from '../dto/update-followup.dto';
import { FollowUpMapper } from '../mappers/followup.mapper';
import type { FollowUpRecord } from '../repositories/followup.repository.interface';
import type {
  FollowUpApplicationContext,
  FollowUpScope,
} from '../services/followup-application.types';
import { FollowUpService } from '../services/followup.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('followups')
export class FollowUpsController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFollowUpDto,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = FollowUpMapper.toUpdateFollowUpCommand(dto);
    const followUp = await this.followUpService.updateFollowUp(scope, id, command, context);

    return successResponse(followUp);
  }

  @Delete(':id')
  @RequirePermissions('sales.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const followUp = await this.followUpService.deleteFollowUp(scope, id, context);

    return successResponse(followUp);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): FollowUpScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): FollowUpApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
