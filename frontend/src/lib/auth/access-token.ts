const ACCESS_TOKEN_STORAGE_KEY = 'agencyos_access_token';

/** Returns the current OIDC access token when present (browser only). */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persists an OIDC access token for API Authorization headers. */
export function setAccessToken(token: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (token === null || token.length === 0) {
      window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

/** Clears the stored access token. */
export function clearAccessToken(): void {
  setAccessToken(null);
}
