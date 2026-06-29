import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PERMISSION_CONTEXT_REQUEST_KEY, RBAC_SCOPE_HEADERS } from '../rbac.constants';
import type { ResolvedPermissionContext } from '../repositories/rbac.repository.interface';
import { PermissionService } from '../services/permission.service';
import type { RbacScope } from '../rbac.types';

interface PermissionAwareRequest extends Request {
  [PERMISSION_CONTEXT_REQUEST_KEY]?: ResolvedPermissionContext;
}

/** Resolves workspace-scoped permissions once per request for downstream guards and handlers. */
@Injectable()
export class PermissionContextMiddleware implements NestMiddleware {
  constructor(private readonly permissionService: PermissionService) {}

  async use(
    request: PermissionAwareRequest,
    _response: Response,
    next: NextFunction,
  ): Promise<void> {
    const scope = this.resolveScope(request);

    if (
      scope.tenantId.length === 0 ||
      scope.workspaceId.length === 0 ||
      scope.userId.length === 0
    ) {
      next();
      return;
    }

    request[PERMISSION_CONTEXT_REQUEST_KEY] =
      await this.permissionService.resolvePermissionContext(scope);

    next();
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
