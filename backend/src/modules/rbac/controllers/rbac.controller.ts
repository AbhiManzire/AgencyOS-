import { Controller, Get, Headers } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RBAC_SCOPE_HEADERS } from '../rbac.constants';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import type { RbacScope } from '../rbac.types';

export interface WorkspacePermissionsResponse {
  readonly permissions: readonly string[];
  readonly roles: readonly { id: string; slug: string; name: string }[];
  readonly isSuperAdmin: boolean;
}

@Public()
@Controller('rbac')
export class RbacController {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly roleService: RoleService,
  ) {}

  @Get('me/permissions')
  async getMyPermissions(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<WorkspacePermissionsResponse>> {
    const scope = this.resolveScope(headers);
    const context = await this.permissionService.resolvePermissionContext(scope);

    return successResponse({
      permissions: context.permissions,
      roles: context.roles,
      isSuperAdmin: context.isSuperAdmin,
    });
  }

  @Get('permissions/catalog')
  async listPermissionCatalog(): Promise<
    ApiSuccessResponse<Awaited<ReturnType<RoleService['listPermissionCatalog']>>>
  > {
    const catalog = await this.roleService.listPermissionCatalog();
    return successResponse(catalog);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): RbacScope {
    return {
      tenantId: this.readHeader(headers, RBAC_SCOPE_HEADERS.TENANT),
      workspaceId: this.readHeader(headers, RBAC_SCOPE_HEADERS.WORKSPACE),
      userId: this.readHeader(headers, RBAC_SCOPE_HEADERS.USER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
