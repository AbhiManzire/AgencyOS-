export const AUTH_CONFIGURATION = Symbol('AUTH_CONFIGURATION');

export interface AuthConfiguration {
  readonly enabled: boolean;
  readonly nodeEnv: string;
  readonly issuer: string;
  readonly audience: string;
  readonly jwksUri: string;
}

/** Resolves Keycloak auth settings from environment variables. */
export function resolveAuthConfigurationFromEnv(): AuthConfiguration {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const issuer = (process.env.KEYCLOAK_ISSUER_URL ?? '').trim();
  const configuredJwksUri = (process.env.KEYCLOAK_JWKS_URI ?? '').trim();
  const audience = process.env.KEYCLOAK_AUDIENCE ?? 'agencyos-api';
  const jwksUri =
    configuredJwksUri ||
    (issuer ? `${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs` : '');
  const enabled = jwksUri.length > 0;

  if (!enabled && nodeEnv === 'production') {
    throw new Error('KEYCLOAK_JWKS_URI or KEYCLOAK_ISSUER_URL must be configured in production');
  }

  return {
    enabled,
    nodeEnv,
    issuer,
    audience,
    jwksUri,
  };
}
