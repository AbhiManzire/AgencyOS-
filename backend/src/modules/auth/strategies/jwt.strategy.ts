import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export interface JwtPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  azp?: string;
  iss?: string;
}

/** Validates JWT access tokens issued by Keycloak via OIDC JWKS. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const issuer = configService.get<string>('auth.keycloakIssuerUrl', '');
    const audience = configService.get<string>('auth.keycloakAudience', 'agencyos-api');
    const configuredJwksUri = configService.get<string>('auth.keycloakJwksUri');
    const jwksUri =
      configuredJwksUri ??
      (issuer ? `${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs` : '');

    if (!jwksUri) {
      throw new Error('KEYCLOAK_JWKS_URI or KEYCLOAK_ISSUER_URL must be configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience,
      issuer: issuer || undefined,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return payload;
  }
}
