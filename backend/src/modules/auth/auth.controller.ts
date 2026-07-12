import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from './strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  agencyUserId?: string;
}

/**
 * Authentication endpoints — JWT validation via JwtAuthGuard.
 * Login / logout / refresh are handled by Keycloak OIDC on the frontend.
 */
@Controller('auth')
export class AuthController {
  @Get('me')
  me(@Req() request: AuthenticatedRequest): {
    user: JwtPayload & { agencyUserId?: string };
  } {
    if (!request.user) {
      throw new UnauthorizedException();
    }

    return {
      user: {
        ...request.user,
        agencyUserId: request.agencyUserId,
      },
    };
  }
}
