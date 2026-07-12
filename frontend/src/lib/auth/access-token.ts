const ACCESS_TOKEN_STORAGE_KEY = 'agencyos_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'agencyos_refresh_token';
const ID_TOKEN_STORAGE_KEY = 'agencyos_id_token';
const EXPIRES_AT_STORAGE_KEY = 'agencyos_token_expires_at';

export interface AuthSessionTokens {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly idToken: string | null;
  /** Epoch ms when the access token should be considered expired. */
  readonly expiresAt: number;
}

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value === null || value.length === 0) {
      window.sessionStorage.removeItem(key);
      return;
    }

    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

/** Returns the current OIDC access token when present (browser only). */
export function getAccessToken(): string | null {
  return readStorage(ACCESS_TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return readStorage(REFRESH_TOKEN_STORAGE_KEY);
}

export function getIdToken(): string | null {
  return readStorage(ID_TOKEN_STORAGE_KEY);
}

export function getAccessTokenExpiresAt(): number | null {
  const raw = readStorage(EXPIRES_AT_STORAGE_KEY);
  if (raw === null) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Persists an OIDC token set for API Authorization headers and refresh. */
export function setAuthSession(tokens: AuthSessionTokens): void {
  writeStorage(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  writeStorage(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  writeStorage(ID_TOKEN_STORAGE_KEY, tokens.idToken);
  writeStorage(EXPIRES_AT_STORAGE_KEY, String(tokens.expiresAt));
}

/** @deprecated Prefer setAuthSession — kept for clearAccessToken compatibility. */
export function setAccessToken(token: string | null): void {
  if (token === null || token.length === 0) {
    clearAuthSession();
    return;
  }

  writeStorage(ACCESS_TOKEN_STORAGE_KEY, token);
}

/** Clears the stored OIDC session tokens. */
export function clearAuthSession(): void {
  writeStorage(ACCESS_TOKEN_STORAGE_KEY, null);
  writeStorage(REFRESH_TOKEN_STORAGE_KEY, null);
  writeStorage(ID_TOKEN_STORAGE_KEY, null);
  writeStorage(EXPIRES_AT_STORAGE_KEY, null);
}

/** Clears the stored access token (and full session). */
export function clearAccessToken(): void {
  clearAuthSession();
}

export function hasAuthSession(): boolean {
  const token = getAccessToken();
  return token !== null && token.length > 0;
}
