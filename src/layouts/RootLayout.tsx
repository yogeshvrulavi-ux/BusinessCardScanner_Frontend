import { Outlet } from "@tanstack/react-router";

import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/layouts/AppShell";

export function RootLayout() {
  return (
    <AuthProvider>
      <AppShell />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
