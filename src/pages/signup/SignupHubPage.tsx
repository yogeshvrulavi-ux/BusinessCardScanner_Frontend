import { Link } from "@tanstack/react-router";
import { Building2, Shield, User } from "lucide-react";

import { SignupShell } from "@/components/subscription/SignupShell";
import { Card } from "@/components/ui/card";

const OPTIONS = [
  {
    to: "/signup/super-admin" as const,
    title: "Super Admin",
    desc: "Create a company workspace on Freemium (20 MB).",
    icon: Building2,
  },
  {
    to: "/signup/admin" as const,
    title: "Admin",
    desc: "Join as company Admin with designation details.",
    icon: Shield,
  },
  {
    to: "/signup/user" as const,
    title: "User",
    desc: "Join as a scanning user under your company.",
    icon: User,
  },
];

export function SignupHubPage() {
  return (
    <SignupShell
      title="Create your NameCardScan account"
      subtitle="Choose your role. Workspaces start on Freemium — upgrade anytime for more storage."
    >
      <div className="grid gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link key={opt.to} to={opt.to} className="block">
              <Card className="flex items-start gap-3 rounded-2xl border-border/60 p-4 shadow-soft transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{opt.title}</div>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already invited?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Open invitation link
        </Link>
      </p>
    </SignupShell>
  );
}
