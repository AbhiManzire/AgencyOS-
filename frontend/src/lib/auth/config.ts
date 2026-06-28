/** Frontend authentication utilities — Keycloak OIDC integration in Sprint 2+. */

export const AUTH_CONFIG = {
  keycloakUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'agencyos',
  keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'agencyos-web',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
} as const;
