export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
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
});
