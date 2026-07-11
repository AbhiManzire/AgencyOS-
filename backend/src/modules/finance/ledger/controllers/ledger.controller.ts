import { Controller, Get, Headers, Query } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { ListLedgerQueryDto } from '../dto/list-ledger-query.dto';
import { LedgerMapper } from '../mappers/ledger.mapper';
import type { LedgerEntryRecord } from '../repositories/ledger-entry.repository.interface';
import type { LedgerScope } from '../services/ledger-application.types';
import { LedgerService } from '../services/ledger.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @RequirePermissions('finance.ledger.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListLedgerQueryDto,
  ): Promise<ApiSuccessResponse<readonly LedgerEntryRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = LedgerMapper.toListQuery(queryDto);
    const result = await this.ledgerService.listEntries(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): LedgerScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
