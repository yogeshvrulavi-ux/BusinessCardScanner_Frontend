import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppLogo } from "@/components/brand/AppLogo";
import { AuthScannerPanel } from "@/components/auth/AuthScannerPanel";
import { NeuralVortexBackground } from "@/components/ui/interactive-neural-vortex-background";
import { useForceLightMode } from "@/hooks/useForceLightMode";

export function SignupShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  useForceLightMode(true);

  return (
    <div className="light flex min-h-svh w-full max-w-[100vw] flex-col overflow-x-hidden bg-background lg:flex-row">
      <section className="relative hidden min-h-[40svh] w-full items-center justify-center overflow-hidden bg-[#070b14] lg:flex lg:min-h-svh lg:w-[40%]">
        <NeuralVortexBackground contained />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,#070b14_75%)]" />
        <div className="relative z-10 px-8 py-10">
          <AuthScannerPanel />
        </div>
      </section>

      <section className="relative flex min-h-svh w-full flex-1 flex-col bg-[#f4f7fb]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-surface opacity-50" />
        <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-10">
          <AppLogo size="md" />
          <Link
            to="/auth/$pathname"
            params={{ pathname: "sign-in" }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </header>
        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-8 sm:px-10">
          <div className="mb-2 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Default plan · Freemium · 1 MB (~10 Cards)
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1e3a5f]">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </div>
  );
}
