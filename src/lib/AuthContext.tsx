import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAuthApiBase } from "@/lib/authConfig";
import { registerAuthSessionBridge } from "@/lib/authSession";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  company_id: string | null;
};

type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

type LoginResponse = TokenPair & { user: AuthUser };

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
};

type AuthContextValue = AuthState & {
  login: (identifier: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  refetchProfile: () => Promise<void>;
};

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                    */
/* ------------------------------------------------------------------ */

const LS_ACCESS = "cs_access_token";
const LS_REFRESH = "cs_refresh_token";
const LS_USER = "cs_auth_user";

function storeTokens(access: string, refresh: string) {
  try {
    localStorage.setItem(LS_ACCESS, access);
    localStorage.setItem(LS_REFRESH, refresh);
  } catch { /* storage full or blocked */ }
}

function storeUser(user: AuthUser) {
  try { localStorage.setItem(LS_USER, JSON.stringify(user)); } catch { /* */ }
}

function loadStoredAuth(): { access: string | null; refresh: string | null; user: AuthUser | null } {
  try {
    const access = localStorage.getItem(LS_ACCESS);
    const refresh = localStorage.getItem(LS_REFRESH);
    const userRaw = localStorage.getItem(LS_USER);
    const user = userRaw ? JSON.parse(userRaw) as AuthUser : null;
    return { access, refresh, user };
  } catch {
    return { access: null, refresh: null, user: null };
  }
}

function clearStoredAuth() {
  try {
    localStorage.removeItem(LS_ACCESS);
    localStorage.removeItem(LS_REFRESH);
    localStorage.removeItem(LS_USER);
  } catch { /* */ }
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

function authUrl(path: string): string {
  return `${getAuthApiBase()}${path}`;
}

async function apiLogin(identifier: string, password: string): Promise<LoginResponse> {
  const res = await fetch(authUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    let detail: { code?: string; message?: string } | string = "";
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? "";
    } catch { /* */ }

    const msg = typeof detail === "object"
      ? detail.message || `Login failed (${res.status})`
      : detail || `Login failed (${res.status})`;
    throw new Error(msg);
  }

  return res.json();
}

async function apiRefreshToken(refreshToken: string): Promise<TokenPair> {
  const res = await fetch(authUrl("/api/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Refresh failed");
  }

  return res.json();
}

async function apiLogout(refreshToken: string): Promise<void> {
  try {
    await fetch(authUrl("/api/auth/logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch { /* best-effort */ }
}

async function apiGetProfile(accessToken: string): Promise<AuthUser> {
  const res = await fetch(authUrl("/api/profile"), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  const data = await res.json();
  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    role: data.role,
    company_id: data.company_id || null,
  };
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | null>(null);

/** Global refresh lock — prevents concurrent refresh calls. */
let globalRefreshPromise: Promise<string | null> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    isRefreshing: false,
  });

  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  /* ── Set auth state ────────────────────────────────────────────── */
  const setAuth = useCallback((user: AuthUser | null, accessToken: string | null, refreshToken?: string) => {
    accessTokenRef.current = accessToken;
    if (refreshToken) refreshTokenRef.current = refreshToken;
    if (user) storeUser(user);
    if (accessToken && refreshToken) storeTokens(accessToken, refreshToken);
    if (!user) clearStoredAuth();

    setState({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading: false,
      isRefreshing: false,
    });
  }, []);

  /* ── Refresh access token ──────────────────────────────────────── */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Prevent concurrent refreshes
    if (globalRefreshPromise) return globalRefreshPromise;

    const rt = refreshTokenRef.current;
    if (!rt) return null;

    globalRefreshPromise = (async () => {
      try {
        setState((s) => ({ ...s, isRefreshing: true }));
        const tokens = await apiRefreshToken(rt);
        accessTokenRef.current = tokens.access_token;
        refreshTokenRef.current = tokens.refresh_token;
        storeTokens(tokens.access_token, tokens.refresh_token);
        setState((s) => ({
          ...s,
          accessToken: tokens.access_token,
          isRefreshing: false,
        }));
        return tokens.access_token;
      } catch {
        // Refresh failed — force logout
        clearStoredAuth();
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          isRefreshing: false,
        });
        return null;
      } finally {
        globalRefreshPromise = null;
      }
    })();

    return globalRefreshPromise;
  }, []);

  /* ── Login ─────────────────────────────────────────────────────── */
  const login = useCallback(async (identifier: string, password: string): Promise<LoginResponse> => {
    const result = await apiLogin(identifier, password);
    setAuth(result.user, result.access_token, result.refresh_token);
    return result;
  }, [setAuth]);

  /* ── Logout ────────────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    const rt = refreshTokenRef.current;
    if (rt) await apiLogout(rt);
    setAuth(null, null);
  }, [setAuth]);

  /* ── Get current access token (for apiFetch) ───────────────────── */
  const getAccessToken = useCallback((): string | null => {
    return accessTokenRef.current;
  }, []);

  /* ── Role checks ───────────────────────────────────────────────── */
  const hasRole = useCallback((...roles: UserRole[]): boolean => {
    const userRole = state.user?.role;
    if (!userRole) return false;
    return roles.includes(userRole);
  }, [state.user?.role]);

  const hasPermission = useCallback((_permission: string): boolean => {
    // SuperAdmin has all permissions; for others, rely on backend enforcement
    if (state.user?.role === "SUPER_ADMIN") return true;
    return true; // Frontend doesn't block; backend enforces
  }, [state.user?.role]);

  /* ── Refetch profile from backend ──────────────────────────────── */
  const refetchProfile = useCallback(async () => {
    const at = accessTokenRef.current;
    if (!at) return;
    try {
      const profile = await apiGetProfile(at);
      setState((s) => ({ ...s, user: profile }));
      storeUser(profile);
    } catch { /* profile fetch is best-effort */ }
  }, []);

  /* ── Register session bridge for apiFetch ──────────────────────── */
  useEffect(() => {
    registerAuthSessionBridge({
      getAccessToken,
      refreshAccessToken,
      onAuthExpired: () => {
        clearStoredAuth();
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          isRefreshing: false,
        });
      },
    });
  }, [getAccessToken, refreshAccessToken]);

  /* ── Auto-login on mount (restore session) ─────────────────────── */
  useEffect(() => {
    const restore = async () => {
      const stored = loadStoredAuth();
      if (!stored.access || !stored.refresh) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      accessTokenRef.current = stored.access;
      refreshTokenRef.current = stored.refresh;

      // Try to use stored access token (may still be valid)
      if (stored.user) {
        setState({
          user: stored.user,
          accessToken: stored.access,
          isAuthenticated: true,
          isLoading: false,
          isRefreshing: false,
        });
      }

      // Attempt a refresh to validate session and get fresh token
      try {
        const tokens = await apiRefreshToken(stored.refresh);
        accessTokenRef.current = tokens.access_token;
        refreshTokenRef.current = tokens.refresh_token;
        storeTokens(tokens.access_token, tokens.refresh_token);

        // Re-fetch profile to get latest user info
        const profile = await apiGetProfile(tokens.access_token);
        setAuth(profile, tokens.access_token, tokens.refresh_token);
      } catch {
        // Session expired — clear and require login
        clearStoredAuth();
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        setState({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          isRefreshing: false,
        });
      }
    };

    restore();
  }, [setAuth]);

  /* ── Context value ─────────────────────────────────────────────── */
  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      getAccessToken,
      refreshAccessToken,
      hasRole,
      hasPermission,
      refetchProfile,
    }),
    [state, login, logout, getAccessToken, refreshAccessToken, hasRole, hasPermission, refetchProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to access the auth context. Throws if used outside AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Safe version — returns null if outside provider. */
export function useAuthSafe(): AuthContextValue | null {
  return useContext(AuthContext);
}
