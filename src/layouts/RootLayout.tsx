import { useEffect } from "react";

import { AuthProvider } from "@/lib/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/layouts/AppShell";
import { registerNameCardScanPwa } from "@/lib/pwa";

export function RootLayout() {
  // Register on every shell (including auth) so SW + install capture are never skipped.
  useEffect(() => {
    registerNameCardScanPwa();
  }, []);

  return (
    <AuthProvider>
      <AppShell />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
