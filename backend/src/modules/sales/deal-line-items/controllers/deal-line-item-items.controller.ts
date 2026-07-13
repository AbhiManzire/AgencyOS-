import { Body, Controller, Delete, Headers, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { UpdateDealLineItemDto } from '../dto/update-deal-line-item.dto';
import { DealLineItemMapper } from '../mappers/deal-line-item.mapper';
import type { DealLineItemRecord } from '../repositories/deal-line-item.repository.interface';
import type {
  DealLineItemApplicationContext,
  DealLineItemScope,
} from '../services/deal-line-item-application.types';
import { DealLineItemService } from '../services/deal-line-item.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('deal-line-items')
export class DealLineItemItemsController {
  constructor(private readonly dealLineItemService: DealLineItemService) {}

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealLineItemDto,
  ): Promise<ApiSuccessResponse<DealLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = DealLineItemMapper.toUpdateDealLineItemCommand(dto);
    const lineItem = await this.dealLineItemService.updateLineItem(scope, id, command, context);
    return successResponse(lineItem);
  }

  @Delete(':id')
  @RequirePermissions('sales.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<DealLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const lineItem = await this.dealLineItemService.deleteLineItem(scope, id, context);
    return successResponse(lineItem);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): DealLineItemScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): DealLineItemApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
