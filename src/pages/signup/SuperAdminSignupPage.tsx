import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthField } from "@/components/auth/AuthField";
import { SignupShell } from "@/components/subscription/SignupShell";
import { Button } from "@/components/ui/button";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Needs an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Needs a lowercase letter.";
  if (!/\d/.test(password)) return "Needs a digit.";
  return null;
}

export function SuperAdminSignupPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!companyName.trim()) next.companyName = "Company name is required.";
    if (!adminName.trim()) next.adminName = "Super Admin name is required.";
    if (!email.trim()) next.email = "Email is required.";
    if (!mobile.trim()) next.mobile = "Mobile number is required.";
    const pwErr = validatePassword(password);
    if (pwErr) next.password = pwErr;
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      sessionStorage.setItem(
        "cs-signup-intent",
        JSON.stringify({
          role: "SUPER_ADMIN",
          plan: "FREEMIUM",
          companyName: companyName.trim(),
          name: adminName.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          at: Date.now(),
        }),
      );
      toast.success("Freemium workspace requested", {
        description:
          "Default plan: Freemium (1 MB, ~10 Cards). Complete activation with your secure invitation link, then sign in.",
      });
      void navigate({ to: "/auth/$pathname", params: { pathname: "sign-in" } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SignupShell
      title="Super Admin signup"
      subtitle="Register your company. Default plan is Freemium with 1 MB storage (~10 Cards)."
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <AuthField
          label="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          error={errors.companyName}
          autoComplete="organization"
        />
        <AuthField
          label="Super Admin Name"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          error={errors.adminName}
          autoComplete="name"
        />
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <AuthField
          label="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          error={errors.mobile}
          autoComplete="tel"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full rounded-md bg-gradient-primary shadow-glow" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue on Freemium"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Have an invite?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Accept invitation
        </Link>
      </p>
    </SignupShell>
  );
}
