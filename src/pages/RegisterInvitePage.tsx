import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppLogo } from "@/components/brand/AppLogo";
import { AuthField } from "@/components/auth/AuthField";
import { AuthScannerPanel } from "@/components/auth/AuthScannerPanel";
import { NeuralVortexBackground } from "@/components/ui/interactive-neural-vortex-background";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEGAL_CONTACT_EMAIL, LEGAL_CONTACT_PHONE, LEGAL_PAGE_URLS } from "@/constants/legalContent";
import { useForceLightMode } from "@/hooks/useForceLightMode";
import {
  acceptInvitation,
  validateInvitationToken,
} from "@/lib/adminApi";
import {
  DEFAULT_USER_SETTINGS,
  TIMEZONE_OPTIONS,
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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [timezone, setTimezone] = useState<string>(DEFAULT_USER_SETTINGS.timezone);

  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const suggestedUsername = useMemo(() => {
    if (!info?.email) return "";
    return info.email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 40) || "";
  }, [info?.email]);

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
        setCompanyName(data.company_name || "");
        setCompanyCode(data.company_code || "");
        setCompanyAddress(data.company_address || "");
        setCompanyPhone(data.company_phone || "");
        setCompanyEmail(data.company_email || "");
        setCompanyWebsite(data.company_website || "");
        setJobTitle(data.role === "ADMIN" ? "Admin" : "Team member");
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
    if (!firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (username.trim() && username.trim().length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    }
    const pwErr = validatePasswordClient(password);
    if (pwErr) nextErrors.password = pwErr;
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";

    if (info.needs_company) {
      if (!companyName.trim()) nextErrors.companyName = "Company name is required.";
      if (!companyCode.trim() || companyCode.trim().length < 2) {
        nextErrors.companyCode = "Company code is required (min 2 characters).";
      }
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await acceptInvitation({
        token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        confirm_password: confirmPassword,
        phone: phone.trim(),
        username: username.trim() || undefined,
        company_name: info.needs_company ? companyName.trim() : undefined,
        company_code: info.needs_company ? companyCode.trim().toUpperCase() : undefined,
        company_address: info.needs_company ? companyAddress.trim() : undefined,
        company_phone: info.needs_company ? companyPhone.trim() : undefined,
        company_email: info.needs_company ? companyEmail.trim() : undefined,
        company_website: info.needs_company ? companyWebsite.trim() : undefined,
      });

      // Seed Settings/Profile local preferences so post-login Settings stays consistent
      const current = loadUserSettings();
      saveUserSettings({
        ...current,
        fullName: `${result.user.first_name} ${result.user.last_name}`.trim(),
        email: result.user.email,
        phone: result.user.phone || phone.trim(),
        company: result.user.company_name || companyName.trim() || info.company_name || current.company,
        role: jobTitle.trim() || roleLabel || current.role,
        timezone: timezone || current.timezone,
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
    <div className="light flex min-h-svh w-full max-w-[100vw] flex-col overflow-x-hidden bg-background lg:min-h-svh lg:flex-row">
      <section className="relative hidden min-h-[45svh] w-full min-w-0 items-center justify-center overflow-hidden bg-[#070b14] lg:flex lg:min-h-svh lg:w-[42%]">
        <NeuralVortexBackground contained />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,#070b14_75%)]" />
        <div className="relative z-10 flex w-full min-w-0 max-w-lg items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
          <AuthScannerPanel />
        </div>
      </section>

      <section className="relative flex min-h-svh w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#f4f7fb] lg:min-h-svh lg:w-[58%]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-surface opacity-50" />
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 max-w-[50%] translate-x-1/4 rounded-full bg-violet-300/15 blur-3xl" />

        <header className="relative z-10 flex shrink-0 justify-end px-5 py-4 sm:px-10 lg:px-14">
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

        <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="w-full min-w-0 max-w-lg sm:max-w-xl">
            <div className="mx-auto w-full rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
              <div className="mb-6 flex items-center gap-3">
                <AppLogo size="md" />
                <div className="leading-tight">
                  <div className="font-display text-lg font-semibold tracking-tight text-[#1e3a5f]">
                    CardScan
                  </div>
                  <div className="text-[11px] text-muted-foreground">Scan · Detect · Extract</div>
                </div>
              </div>

              <div className="mb-6 space-y-1.5">
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#1e3a5f] sm:text-3xl">
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
                  <Button asChild variant="outline" className="h-11 w-full rounded-xl">
                    <Link to="/auth/$pathname" params={{ pathname: "sign-in" }}>
                      Go to sign in
                    </Link>
                  </Button>
                </div>
              )}

              {!loading && info && (
                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <div>
                        <span className="text-muted-foreground">Email</span>
                        <div className="font-medium text-[#1e3a5f]">{info.email}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Role</span>
                        <div className="font-medium text-[#1e3a5f]">{roleLabel}</div>
                      </div>
                      {(info.company_name || !info.needs_company) && (
                        <div>
                          <span className="text-muted-foreground">Organization</span>
                          <div className="font-medium text-[#1e3a5f]">
                            {info.company_name || "Assigned company"}
                          </div>
                        </div>
                      )}
                    </div>
                    {info.expires_at ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Invitation expires {new Date(info.expires_at).toLocaleString()}
                      </p>
                    ) : null}
                  </div>

                  <section className="space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Account
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField
                        label="First name *"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                        error={fieldErrors.firstName}
                      />
                      <AuthField
                        label="Last name *"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoComplete="family-name"
                        error={fieldErrors.lastName}
                      />
                    </div>
                    <AuthField
                      label="Phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      autoComplete="tel"
                    />
                    <AuthField
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={suggestedUsername || "optional"}
                      autoComplete="username"
                      error={fieldErrors.username}
                    />
                    <p className="text-[11px] text-muted-foreground -mt-2">
                      Leave blank to use {suggestedUsername || "your email prefix"} automatically.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Profile preferences
                    </h2>
                    <AuthField
                      label="Job title / display role"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Sales Manager"
                    />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[#1e3a5f]/90">Timezone</label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </section>

                  {info.needs_company && (
                    <section className="space-y-4">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Company
                      </h2>
                      <AuthField
                        label="Company name *"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        error={fieldErrors.companyName}
                      />
                      <AuthField
                        label="Company code *"
                        value={companyCode}
                        onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                        error={fieldErrors.companyCode}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <AuthField
                          label="Company phone"
                          type="tel"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                        />
                        <AuthField
                          label="Company email"
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder={info.email}
                        />
                      </div>
                      <AuthField
                        label="Website"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://"
                      />
                      <AuthField
                        label="Address"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                      />
                    </section>
                  )}

                  <section className="space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Password
                    </h2>
                    <div className="relative">
                      <AuthField
                        label="Password *"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        error={fieldErrors.password}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground -mt-2">{PASSWORD_HINT}</p>
                    <div className="relative">
                      <AuthField
                        label="Confirm password *"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        error={fieldErrors.confirmPassword}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </section>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      "h-12 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow",
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

        <footer className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 text-center text-md text-[#1e3a5f] sm:px-10 lg:px-14">
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
