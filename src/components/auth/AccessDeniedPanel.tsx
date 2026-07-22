import { Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { useAuth } from "@/lib/AuthContext";

export function AccessDeniedPanel() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full min-w-0 max-w-lg rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <AppLogo size="md" />
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-tight text-[#1e3a5f]">
            NameCardScan
          </div>
          <div className="text-[11px] text-muted-foreground">Instant Capture, Sync & Connect</div>
        </div>
      </div>

      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#1e3a5f]">
          Access Denied
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          You don't have permission to access this page.
          {user?.role && (
            <span className="mt-1 block">
              Your role: <strong className="text-foreground">{user.role}</strong>
            </span>
          )}
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/scan"
            className="h-9 rounded-md bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-95"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/auth/$pathname"
            params={{ pathname: "sign-in" }}
            className="inline-flex h-9 items-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Sign in as different user
          </Link>
        </div>
      </div>
    </div>
  );
}
