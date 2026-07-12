/** Frontend authentication utilities — Keycloak OIDC (authorization code + PKCE). */

export const AUTH_CONFIG = {
  keycloakUrl: (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080').replace(/\/$/, ''),
  keycloakRealm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'agencyos',
  keycloakClientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'agencyos-web',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
} as const;

const PKCE_VERIFIER_KEY = 'agencyos_pkce_verifier';
const OIDC_RETURN_TO_KEY = 'agencyos_oidc_return_to';

/** Realm OIDC base path (authorize / token / logout). */
export function getOidcBaseUrl(): string {
  return `${AUTH_CONFIG.keycloakUrl}/realms/${AUTH_CONFIG.keycloakRealm}/protocol/openid-connect`;
}

export function getOidcCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return `${window.location.origin}/auth/callback`;
}

export function getOidcPostLogoutRedirectUri(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return `${window.location.origin}/`;
}

/** True when the client bundle explicitly enables AuthGate / OIDC session. */
export function isAuthExplicitlyEnabled(): boolean {
  if (process.env.AUTH_ENABLED === 'false' || process.env.NEXT_PUBLIC_AUTH_ENABLED === 'false') {
    return false;
  }

  return process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true' || process.env.AUTH_ENABLED === 'true';
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Base64Url(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
}

function randomVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/** Persists PKCE verifier + optional return path, then returns the authorize URL. */
export async function beginLoginRedirect(returnTo?: string): Promise<string> {
  if (!isAuthExplicitlyEnabled()) {
    return returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  }

  const verifier = randomVerifier();
  const challenge = await sha256Base64Url(verifier);

  try {
    window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      window.sessionStorage.setItem(OIDC_RETURN_TO_KEY, returnTo);
    } else {
      window.sessionStorage.removeItem(OIDC_RETURN_TO_KEY);
    }
  } catch {
    // Ignore storage failures; authorize will fail at callback without verifier.
  }

  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.keycloakClientId,
    redirect_uri: getOidcCallbackUrl(),
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return `${getOidcBaseUrl()}/auth?${params.toString()}`;
}

export function consumePkceVerifier(): string | null {
  try {
    const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
    window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    return verifier;
  } catch {
    return null;
  }
}

export function consumeOidcReturnTo(): string {
  try {
    const returnTo = window.sessionStorage.getItem(OIDC_RETURN_TO_KEY);
    window.sessionStorage.removeItem(OIDC_RETURN_TO_KEY);
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      return returnTo;
    }
  } catch {
    // ignore
  }

  return '/';
}

/** Starts interactive Keycloak login (PKCE). No-op redirect home when auth is disabled. */
export async function redirectToLogin(returnTo?: string): Promise<void> {
  if (!isAuthExplicitlyEnabled()) {
    const target =
      returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
    window.location.assign(target);
    return;
  }

  const url = await beginLoginRedirect(returnTo);
  window.location.assign(url);
}

export function getKeycloakLogoutUrl(idTokenHint?: string | null): string {
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.keycloakClientId,
    post_logout_redirect_uri: getOidcPostLogoutRedirectUri(),
  });

  if (idTokenHint) {
    params.set('id_token_hint', idTokenHint);
  }

  return `${getOidcBaseUrl()}/logout?${params.toString()}`;
}
