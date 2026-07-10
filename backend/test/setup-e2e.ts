import { readTestDatabaseState } from './helpers/test-database-state';

// E2E uses header-based identity; JWT auth is exercised separately in production config.
process.env.AUTH_ENABLED = 'false';
process.env.RBAC_ENFORCED ??= 'false';
process.env.KEYCLOAK_ISSUER_URL ??= 'http://localhost:8080/realms/agencyos';
process.env.KEYCLOAK_JWKS_URI ??=
  'http://localhost:8080/realms/agencyos/protocol/openid-connect/certs';
process.env.KEYCLOAK_AUDIENCE ??= 'agencyos-api';

const testDatabaseState = readTestDatabaseState();

if (testDatabaseState?.databaseUrl) {
  process.env.DATABASE_URL = testDatabaseState.databaseUrl;
} else {
  process.env.DATABASE_URL ??=
    'postgresql://agencyos:agencyos_dev@localhost:5432/agencyos?schema=public';
}
