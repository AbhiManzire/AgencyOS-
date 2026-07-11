import { Controller, Headers, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type {
  RecurringApplicationContext,
  RecurringScope,
  RunDueResult,
} from '../services/recurring-application.types';
import { RecurringRunService } from '../services/recurring.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('recurring')
export class RecurringRunController {
  constructor(private readonly recurringRunService: RecurringRunService) {}

  @Post('run-due')
  @RequirePermissions('finance.recurring.update')
  async runDue(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<RunDueResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.recurringRunService.runDue(scope, context);
    return successResponse(result);
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
