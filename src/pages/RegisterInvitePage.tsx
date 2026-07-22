import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppLogo } from "@/components/brand/AppLogo";
import { AuthField } from "@/components/auth/AuthField";
import { AuthScannerPanel } from "@/components/auth/AuthScannerPanel";
import { NeuralVortexBackground } from "@/components/ui/interactive-neural-vortex-background";
import { Button } from "@/components/ui/button";
import { LEGAL_CONTACT_EMAIL, LEGAL_CONTACT_PHONE, LEGAL_PAGE_URLS } from "@/constants/legalContent";
import { useForceLightMode } from "@/hooks/useForceLightMode";
import {
  acceptInvitation,
  validateInvitationToken,
} from "@/lib/adminApi";
import {
  loadUserSettings,
  saveUserSettings,
} from "@/lib/settingsStorage";
import { cn } from "@/lib/utils";

type InviteInfo = {
  email: string;
  role: string;
  company_name: string;
  company_code: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  needs_company: boolean;
  expires_at: string;
};

const PASSWORD_HINT =
  "At least 8 characters with uppercase, lowercase, a number, and a special character.";

function validatePasswordClient(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password needs a lowercase letter.";
  if (!/\d/.test(password)) return "Password needs a digit.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return "Password needs a special character.";
  }
  return null;
}

export function RegisterInvitePage() {
  useForceLightMode(true);
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" });
  const token = (search.token || "").trim();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token. Open the link from your invitation email.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await validateInvitationToken(token);
        if (cancelled) return;
        setInfo({
          email: data.email,
          role: data.role,
          company_name: data.company_name,
          company_code: data.company_code,
          company_address: data.company_address,
          company_phone: data.company_phone,
          company_email: data.company_email,
          company_website: data.company_website,
          needs_company: data.needs_company,
          expires_at: data.expires_at,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Invalid invitation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const roleLabel = info?.role === "ADMIN" ? "Admin" : info?.role === "USER" ? "User" : info?.role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !info) return;

    const nextErrors: Record<string, string> = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required.";
    const pwErr = validatePasswordClient(password);
    if (pwErr) nextErrors.password = pwErr;
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await acceptInvitation({
        token,
        full_name: fullName.trim(),
        password,
        confirm_password: confirmPassword,
        phone: phone.trim(),
      });

      // Seed Settings/Profile local preferences so post-login Settings stays consistent
      const current = loadUserSettings();
      saveUserSettings({
        ...current,
        fullName: fullName.trim(),
        email: result.user.email,
        phone: result.user.phone || phone.trim(),
        company: result.user.company_name || info.company_name || current.company,
        role: roleLabel || current.role,
      });

      toast.success("Account created. Please sign in.");
      void navigate({
        to: "/auth/$pathname",
        params: { pathname: "sign-in" },
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="light flex h-svh w-full max-w-[100vw] flex-col overflow-hidden bg-background lg:flex-row">
      <section className="relative hidden w-full min-w-0 items-center justify-center overflow-hidden bg-[#070b14] lg:flex lg:h-svh lg:w-[42%]">
        <NeuralVortexBackground contained />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,#070b14_75%)]" />
        <div className="relative z-10 flex w-full min-w-0 max-w-lg items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <AuthScannerPanel />
        </div>
      </section>

      <section className="relative flex h-svh w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#f4f7fb] lg:w-[58%]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-surface opacity-50" />
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 max-w-[50%] translate-x-1/4 rounded-full bg-cyan-300/15 blur-3xl" />

        <header className="relative z-10 flex shrink-0 justify-end px-5 py-3 sm:px-10 lg:px-14">
          <div className="text-right text-sm leading-relaxed">
            <p className="font-medium text-[#1e3a5f]">Need help?</p>
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="block font-medium text-primary hover:text-primary/80">
              {LEGAL_CONTACT_EMAIL}
            </a>
            <a href={`tel:${LEGAL_CONTACT_PHONE}`} className="block font-medium text-primary hover:text-primary/80">
              {LEGAL_CONTACT_PHONE}
            </a>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 overflow-y-auto px-5 py-4 sm:px-10 lg:px-14">
          <div className="m-auto w-full min-w-0 max-w-lg sm:max-w-xl">
            <div className="mx-auto w-full rounded-2xl bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7">
              <div className="mb-5 flex items-center gap-3">
                <AppLogo size="md" />
                <div className="leading-tight">
                  <div className="font-display text-lg font-semibold tracking-tight text-[#1e3a5f]">
                    NameCardScan
                  </div>
                  <div className="text-[11px] text-muted-foreground">Instant Capture, Sync & Connect</div>
                </div>
              </div>

              <div className="mb-5 space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#1e3a5f]">
                  Complete your invitation
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Create your account with your own details and password. Login is only possible
                  after you submit this form — the inviter never sets your password.
                </p>
              </div>

              {loading && (
                <div className="flex flex-col items-center py-14">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Validating invitation…</p>
                </div>
              )}

              {!loading && error && (
                <div className="space-y-4">
                  <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                  <Button asChild variant="outline" className="h-9 w-full rounded-md">
                    <Link to="/auth/$pathname" params={{ pathname: "sign-in" }}>
                      Go to sign in
                    </Link>
                  </Button>
                </div>
              )}

              {!loading && info && (
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <section className="space-y-3.5">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </h2>
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <AuthField
                        label="Full name *"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        error={fieldErrors.fullName}
                      />
                      <AuthField
                        label="Phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        autoComplete="tel"
                      />
                    </div>
                    <AuthField
                      label="Email"
                      type="email"
                      value={info.email}
                      readOnly
                      disabled
                      autoComplete="email"
                    />
                  </section>

                  <section className="space-y-3.5">
                   
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <AuthField
                        label="Password *"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        error={fieldErrors.password}
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
                      />
                      <AuthField
                        label="Confirm password *"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        error={fieldErrors.confirmPassword}
                        trailing={
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            onClick={() => setShowConfirm((v) => !v)}
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                    </div>
                    <p className="-mt-1 text-[11px] text-muted-foreground">{PASSWORD_HINT}</p>
                  </section>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      "h-9 w-full rounded-md bg-gradient-primary text-base font-semibold shadow-glow",
                    )}
                  >
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create account
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already registered?{" "}
                    <Link
                      to="/auth/$pathname"
                      params={{ pathname: "sign-in" }}
                      className="font-medium text-primary hover:text-primary/80"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        <footer className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 text-center text-md text-[#1e3a5f] sm:px-10 lg:px-14">
          <a href={LEGAL_PAGE_URLS.privacy} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Privacy Policy
          </a>
          <span aria-hidden className="text-border">·</span>
          <a href={LEGAL_PAGE_URLS.terms} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Terms &amp; Conditions
          </a>
        </footer>
      </section>
    </div>
  );
}
