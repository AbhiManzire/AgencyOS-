import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from './strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Authentication scaffold — validates JWT via JwtAuthGuard.
 * Full identity lifecycle is delegated to Keycloak (see Tech Stack §8).
 */
@Controller('auth')
export class AuthController {
  @Get('me')
  me(@Req() request: AuthenticatedRequest): { user: JwtPayload } {
    if (!request.user) {
      throw new UnauthorizedException();
    }

    return { user: request.user };
  }
}
