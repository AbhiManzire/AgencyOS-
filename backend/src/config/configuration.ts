export default () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const swaggerDefault = nodeEnv === 'production' ? 'false' : 'true';

  return {
    nodeEnv,
    port: parseInt(process.env.PORT ?? '3001', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    database: {
      url: process.env.DATABASE_URL,
    },
    auth: {
      keycloakIssuerUrl: process.env.KEYCLOAK_ISSUER_URL ?? '',
      keycloakAudience: process.env.KEYCLOAK_AUDIENCE ?? 'agencyos-api',
      keycloakJwksUri: process.env.KEYCLOAK_JWKS_URI ?? '',
    },
    cors: {
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    },
    storage: {
      localPath: process.env.STORAGE_LOCAL_PATH ?? 'uploads',
      maxFileSizeBytes: parseInt(
        process.env.STORAGE_MAX_FILE_SIZE_BYTES ?? String(10 * 1024 * 1024),
        10,
      ),
    },
    throttler: {
      ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    },
    swagger: {
      enabled: (process.env.SWAGGER_ENABLED ?? swaggerDefault) === 'true',
    },
  };
};
