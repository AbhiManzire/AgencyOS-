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
  const authExplicitlyDisabled =
    (process.env.AUTH_ENABLED ?? 'true').trim().toLowerCase() === 'false';
  const issuer = (process.env.KEYCLOAK_ISSUER_URL ?? '').trim();
  const configuredJwksUri = (process.env.KEYCLOAK_JWKS_URI ?? '').trim();
  const audience = process.env.KEYCLOAK_AUDIENCE ?? 'agencyos-api';
  const jwksUri =
    configuredJwksUri ||
    (issuer ? `${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs` : '');

  // Demo / local: AUTH_ENABLED=false skips Keycloak entirely (including production).
  if (authExplicitlyDisabled) {
    return {
      enabled: false,
      nodeEnv,
      issuer,
      audience,
      jwksUri,
    };
  }

  const enabled = jwksUri.length > 0;

  if (nodeEnv === 'production') {
    if (!enabled) {
      throw new Error(
        'Production requires AUTH_ENABLED=true with KEYCLOAK_JWKS_URI or KEYCLOAK_ISSUER_URL configured.',
      );
    }
  } else if (!enabled) {
    throw new Error(
      'KEYCLOAK_JWKS_URI or KEYCLOAK_ISSUER_URL must be configured when AUTH_ENABLED=true (set AUTH_ENABLED=false only for local/demo).',
    );
  }

  return {
    enabled,
    nodeEnv,
    issuer,
    audience,
    jwksUri,
  };
}
