import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RBAC_SCOPE_HEADERS } from '../../rbac/rbac.constants';
import type { JwtPayload } from '../strategies/jwt.strategy';
import { IdentityResolutionService } from '../services/identity-resolution.service';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  agencyUserId?: string;
}

/**
 * When JWT auth is enabled, maps Keycloak `sub` → AgencyOS `User.id` and binds
 * `x-user-id` so controllers and RBAC cannot be spoofed via client identity headers.
 */
@Injectable()
export class BindJwtIdentityGuard implements CanActivate {
  constructor(private readonly identityResolution: IdentityResolutionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return true;
    }

    const subject = user.sub.trim();
    if (subject.length === 0) {
      return true;
    }

    const identity = await this.identityResolution.resolveByKeycloakSubject(subject);
    request.agencyUserId = identity.userId;
    request.headers[RBAC_SCOPE_HEADERS.USER] = identity.userId;

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
