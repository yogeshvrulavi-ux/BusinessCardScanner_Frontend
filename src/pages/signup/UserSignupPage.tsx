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

export function UserSignupPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!userName.trim()) next.userName = "User name is required.";
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
          role: "USER",
          plan: "FREEMIUM",
          name: userName.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          at: Date.now(),
        }),
      );
      toast.success("User signup saved", {
        description: "Use your invitation email link to finish creating your Freemium account.",
      });
      void navigate({ to: "/register" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SignupShell
      title="User signup"
      subtitle="Join your company to scan cards. Storage is shared under your company's plan."
    >
      <form className="space-y-3" onSubmit={onSubmit}>
        <AuthField
          label="User Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          error={errors.userName}
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
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Back to{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          role selection
        </Link>
      </p>
    </SignupShell>
  );
}
