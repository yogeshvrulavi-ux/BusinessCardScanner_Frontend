/**
 * Auth session bridge — provides token access outside React components.
 * The AuthProvider updates these module-level refs so apiFetch can use them.
 */

let _getAccessToken: (() => string | null) | null = null;
let _refreshAccessToken: (() => Promise<string | null>) | null = null;
let _onAuthExpired: (() => void) | null = null;

/** Register the token accessors from AuthProvider (called once on mount). */
export function registerAuthSessionBridge(accessors: {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onAuthExpired: () => void;
}): void {
  _getAccessToken = accessors.getAccessToken;
  _refreshAccessToken = accessors.refreshAccessToken;
  _onAuthExpired = accessors.onAuthExpired;
}

/** Get the current bearer token for API requests. */
export async function getAuthBearerToken(forceRefresh = false): Promise<string | null> {
  if (!_getAccessToken) return null;

  if (!forceRefresh) {
    return _getAccessToken();
  }

  // Force refresh — use the refresh flow
  if (_refreshAccessToken) {
    return _refreshAccessToken();
  }

  return _getAccessToken();
}

/** Clear cached token (compat — now handled by AuthContext). */
export function clearAuthTokenCache(): void {
  // No-op — token cache is managed by AuthContext
}

/** Notify that auth has expired (triggers logout in AuthContext). */
export function notifyAuthExpired(): void {
  if (_onAuthExpired) _onAuthExpired();
}
