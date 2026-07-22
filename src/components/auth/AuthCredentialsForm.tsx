import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/AuthContext";
import { AppLogo } from "@/components/brand/AppLogo";
import { AuthField } from "@/components/auth/AuthField";
import { resolvePostAuthPath } from "@/components/auth/AuthGate";
import { invalidateContactsDirectory } from "@/lib/contactsDirectory";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in";

const signInSchema = z.object({
  identifier: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean().optional(),
});

type SignInValues = z.infer<typeof signInSchema>;

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (/failed to fetch|networkerror|name not resolved|err_name_not_resolved/i.test(msg)) {
      return "Cannot reach the server. Please check your connection and try again.";
    }
    return msg;
  }
  if (error && typeof error === "object") {
    const record = error as { message?: string; detail?: string | { message?: string } };
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.detail === "object" && record.detail?.message) return record.detail.message;
    if (record.message) return record.message;
  }
  return "Something went wrong. Please try again.";
}

export function AuthCredentialsForm({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "", rememberMe: true },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate({ to: resolvePostAuthPath(user.role), replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const onSignIn = async (values: SignInValues) => {
    setSubmitting(true);
    setLoginError("");
    try {
      await login(values.identifier.trim(), values.password);
      invalidateContactsDirectory();
      toast.success("Welcome back!");
    } catch (error) {
      const message = extractErrorMessage(error);
      setLoginError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

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

      <div className="mb-7 space-y-1.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1e3a5f] sm:text-3xl">
          Welcome back
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in to continue scanning and syncing contacts.
        </p>
      </div>

      {loginError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loginError}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={signInForm.handleSubmit(onSignIn)} noValidate>
        <AuthField
          label="Email or Username"
          type="text"
          autoComplete="username"
          placeholder="you@company.com"
          error={signInForm.formState.errors.identifier?.message}
          {...signInForm.register("identifier")}
        />

        <AuthField
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          error={signInForm.formState.errors.password?.message}
          trailing={
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...signInForm.register("password")}
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              {...signInForm.register("rememberMe")}
            />
            Remember me
          </label>
          <Link
            to="/auth/$pathname"
            params={{ pathname: "forgot-password" }}
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton loading={submitting} label="Log in" />
      </form>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "mt-1 flex h-11 w-full items-center justify-center rounded-md bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all",
        "hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </button>
  );
}
