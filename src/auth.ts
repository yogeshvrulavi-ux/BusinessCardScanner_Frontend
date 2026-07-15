/**
 * Auth module — backend JWT RBAC system.
 * Re-exports the auth context and configuration for the application.
 */

export { isAuthEnabled } from "@/lib/authConfig";
export { AuthProvider, useAuth, useAuthSafe } from "@/lib/AuthContext";
export type { AuthUser, UserRole } from "@/lib/AuthContext";
