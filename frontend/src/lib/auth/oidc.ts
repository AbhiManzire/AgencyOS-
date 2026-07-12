import {
  AUTH_CONFIG,
  consumePkceVerifier,
  getOidcBaseUrl,
  getOidcCallbackUrl,
  getKeycloakLogoutUrl,
} from '@/lib/auth/config';
import {
  clearAuthSession,
  getAccessToken,
  getAccessTokenExpiresAt,
  getIdToken,
  getRefreshToken,
  setAuthSession,
  type AuthSessionTokens,
} from '@/lib/auth/access-token';

interface TokenEndpointResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

const REFRESH_SKEW_MS = 60_000;

let refreshInFlight: Promise<string | null> | null = null;

function toSessionTokens(payload: TokenEndpointResponse): AuthSessionTokens {
  if (!payload.access_token) {
    throw new Error(
      payload.error_description ?? payload.error ?? 'Token response missing access_token',
    );
  }

  const expiresInSeconds =
    typeof payload.expires_in === 'number' && payload.expires_in > 0 ? payload.expires_in : 300;

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    idToken: payload.id_token ?? null,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
}

async function postTokenRequest(body: URLSearchParams): Promise<AuthSessionTokens> {
  const response = await fetch(`${getOidcBaseUrl()}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const payload = (await response.json()) as TokenEndpointResponse;

  if (!response.ok) {
    throw new Error(
      payload.error_description ??
        payload.error ??
        `Token request failed (${String(response.status)})`,
    );
  }

  const tokens = toSessionTokens(payload);
  setAuthSession(tokens);
  return tokens;
}

/** Exchanges an authorization code for tokens (PKCE). */
export async function exchangeAuthorizationCode(code: string): Promise<AuthSessionTokens> {
  const verifier = consumePkceVerifier();
  if (!verifier) {
    throw new Error('Missing PKCE verifier — restart sign-in');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: AUTH_CONFIG.keycloakClientId,
    code,
    redirect_uri: getOidcCallbackUrl(),
    code_verifier: verifier,
  });

  return postTokenRequest(body);
}

/** Refreshes the access token using the stored refresh token. */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: AUTH_CONFIG.keycloakClientId,
        refresh_token: refreshToken,
      });

      const tokens = await postTokenRequest(body);
      return tokens.accessToken;
    } catch {
      clearAuthSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Returns a usable access token, refreshing when within skew of expiry.
 * Returns null when refresh fails or no session exists.
 */
export async function ensureFreshAccessToken(skewMs = REFRESH_SKEW_MS): Promise<string | null> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  const expiresAt = getAccessTokenExpiresAt();
  if (expiresAt !== null && Date.now() < expiresAt - skewMs) {
    return accessToken;
  }

  if (!getRefreshToken()) {
    return accessToken;
  }

  return refreshAccessToken();
}

/** Clears local session and redirects to Keycloak end-session (invalidates SSO). */
export function logout(): void {
  const idToken = getIdToken();
  clearAuthSession();
  window.location.assign(getKeycloakLogoutUrl(idToken));
}
