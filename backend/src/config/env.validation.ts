/** Validates process environment at ConfigModule bootstrap. */
export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  const nodeEnv = readString(config, 'NODE_ENV') || 'development';
  const errors: string[] = [];

  const databaseUrl = readString(config, 'DATABASE_URL');
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (nodeEnv === 'production') {
    const authEnabled = readString(config, 'AUTH_ENABLED', 'true').toLowerCase() !== 'false';
    const rbacEnforced = readString(config, 'RBAC_ENFORCED') === 'true';
    const corsOrigin = readString(config, 'CORS_ORIGIN');
    const issuer = readString(config, 'KEYCLOAK_ISSUER_URL');
    const jwksUri = readString(config, 'KEYCLOAK_JWKS_URI');

    if (!authEnabled) {
      errors.push('AUTH_ENABLED=false is not allowed in production');
    }

    if (!rbacEnforced) {
      errors.push('RBAC_ENFORCED=true is required in production');
    }

    if (!corsOrigin || /localhost|127\.0\.0\.1/i.test(corsOrigin)) {
      errors.push('CORS_ORIGIN must be a non-localhost origin in production');
    }

    if (!issuer && !jwksUri) {
      errors.push('KEYCLOAK_ISSUER_URL or KEYCLOAK_JWKS_URI is required in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return config;
}

function readString(config: Record<string, unknown>, key: string, fallback = ''): string {
  const fromConfig = config[key];
  if (typeof fromConfig === 'string') {
    return fromConfig.trim();
  }

  const fromEnv = process.env[key];
  if (typeof fromEnv === 'string') {
    return fromEnv.trim();
  }

  return fallback;
}
