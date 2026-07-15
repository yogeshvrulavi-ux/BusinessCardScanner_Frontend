import { getAuthBearerToken, notifyAuthExpired } from "@/lib/authSession";

/**
 * Authenticated fetch for the Python backend.
 * Attaches the JWT access token and retries once after refresh on 401.
 * If refresh fails, triggers auto-logout.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = await getAuthBearerToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  // 401 — attempt token refresh and retry once
  if (response.status === 401 && token) {
    const refreshed = await getAuthBearerToken(true);
    if (refreshed && refreshed !== token) {
      headers.set("Authorization", `Bearer ${refreshed}`);
      response = await fetch(input, { ...init, headers });
    } else {
      // Refresh failed — session is invalid, trigger auto-logout
      notifyAuthExpired();
    }
  }

  return response;
}
