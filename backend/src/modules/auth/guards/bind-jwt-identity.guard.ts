import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RBAC_SCOPE_HEADERS } from '../../rbac/rbac.constants';
import type { JwtPayload } from '../strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * When JWT auth is enabled, binds the authenticated subject to x-user-id
 * so controllers and RBAC cannot be spoofed via client identity headers.
 */
@Injectable()
export class BindJwtIdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return true;
    }

    const subject = user.sub.trim();
    if (subject.length === 0) {
      return true;
    }

    request.headers[RBAC_SCOPE_HEADERS.USER] = subject;

    const tenantClaim = user.agencyos_tenant_id?.trim();
    if (tenantClaim) {
      request.headers[RBAC_SCOPE_HEADERS.TENANT] = tenantClaim;
    }

    const workspaceClaim = user.agencyos_workspace_id?.trim();
    if (workspaceClaim) {
      request.headers[RBAC_SCOPE_HEADERS.WORKSPACE] = workspaceClaim;
    }

    return true;
  }
}
