import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { RbacConfiguration } from '../rbac.configuration';
import { RBAC_CONFIGURATION } from '../rbac.configuration';
import { PERMISSION_CONTEXT_REQUEST_KEY, RBAC_SCOPE_HEADERS } from '../rbac.constants';
import type { ResolvedPermissionContext } from '../repositories/rbac.repository.interface';
import { PermissionService } from '../services/permission.service';
import type { RbacScope } from '../rbac.types';

interface PermissionAwareRequest extends Request {
  [PERMISSION_CONTEXT_REQUEST_KEY]?: ResolvedPermissionContext;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
    @Inject(RBAC_CONFIGURATION)
    private readonly rbacConfiguration: RbacConfiguration,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<readonly string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PermissionAwareRequest>();
    const permissionContext =
      request[PERMISSION_CONTEXT_REQUEST_KEY] ??
      (await this.permissionService.resolvePermissionContext(this.resolveScope(request)));

    request[PERMISSION_CONTEXT_REQUEST_KEY] = permissionContext;

    if (isPublic && !this.rbacConfiguration.enforced) {
      return true;
    }

    if (!this.permissionService.hasAllPermissions(permissionContext, requiredPermissions)) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }

    return true;
  }

  private resolveScope(request: PermissionAwareRequest): RbacScope {
    return {
      tenantId: this.readHeader(request, RBAC_SCOPE_HEADERS.TENANT),
      workspaceId: this.readHeader(request, RBAC_SCOPE_HEADERS.WORKSPACE),
      userId: this.readHeader(request, RBAC_SCOPE_HEADERS.USER),
    };
  }

  private readHeader(request: PermissionAwareRequest, name: string): string {
    const value = request.headers[name.toLowerCase()];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
