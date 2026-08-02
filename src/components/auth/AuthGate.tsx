import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth, type UserRole } from "@/lib/AuthContext";

function resolvePostAuthPath(role?: UserRole): string {
  if (typeof window === "undefined") return "/scan";
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo");
  if (redirectTo?.startsWith("/") && !redirectTo.startsWith("/auth")) {
    return redirectTo;
  }
  return "/scan";
}

type AuthGateProps = {
  children: React.ReactNode;
  /** Optional: restrict access to specific roles. */
  allowedRoles?: UserRole[];
};

/** Blocks protected routes until auth is resolved; redirects unauthorized users. */
export function AuthGate({ children, allowedRoles }: AuthGateProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    const redirectTo = `${pathname}${searchStr}`;
    navigate({
      to: "/auth/$pathname",
      params: { pathname: "sign-in" },
      search: { redirectTo },
      replace: true,
    });
  }, [isLoading, isAuthenticated, pathname, searchStr, navigate]);

  // Redirect to access-denied if role not permitted
  useEffect(() => {
    if (isLoading || !isAuthenticated || !allowedRoles || !user) return;
    if (!allowedRoles.includes(user.role)) {
      navigate({ to: "/auth/$pathname", params: { pathname: "access-denied" }, replace: true });
    }
  }, [isLoading, isAuthenticated, allowedRoles, user, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role before rendering
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

export { resolvePostAuthPath };
