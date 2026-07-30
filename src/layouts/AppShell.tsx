import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useRouteContext, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { AuthGate } from "@/components/auth/AuthGate";
import { syncConnectionModeWithNetwork } from "@/lib/connectionMode";
import { isAuthEnabled } from "@/lib/authConfig";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { NetworkOfflineBanner } from "@/components/layout/NetworkOfflineBanner";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ConfirmModalProvider } from "@/components/ui/confirm-modal";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { countPendingSync, maybeAutoSyncWhenOnline } from "@/lib/autoSync";
import { recordLastSyncTime } from "@/lib/syncStatus";
import { loadUserSettings } from "@/lib/settingsStorage";
import { useForceLightMode } from "@/hooks/useForceLightMode";
import { publishOfflineQueueSnapshot } from "@/lib/offlineQueueRegistry";

export function AppShell() {
  const { queryClient } = useRouteContext({ from: "__root__" });
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAuthRoute = pathname.startsWith("/auth");
  const isRegisterRoute = pathname.startsWith("/register");
  const isPublicShellRoute = isAuthRoute || isRegisterRoute;
  const authRequired = isAuthEnabled;

  useForceLightMode(isPublicShellRoute);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPublicShellRoute) return;

    // Do not call router.preloadRoute() here. Concurrent preloads + navigation
    // can evict the cached match mid-flight and crash TanStack Router with
    // `Cannot read properties of undefined (reading '_nonReactive')`.

    const processAutoSync = async () => {
      if (!navigator.onLine) return;

      // Report before auto-sync removes successful items, then reconcile after.
      await publishOfflineQueueSnapshot().catch(() => undefined);

      const prefs = loadUserSettings();
      if (!prefs.autoSyncQueueWhenOnline) return;

      try {
        const pending = await countPendingSync();
        const totalPending = pending.queue;
        if (totalPending === 0) return;

        const showToast = prefs.notificationsEnabled && prefs.queueNotificationsEnabled;
        if (showToast) {
          toast.info(`Syncing ${totalPending} contact(s) to database…`);
        }

        window.dispatchEvent(new CustomEvent("cs-sync-start"));
        try {
          const summary = await maybeAutoSyncWhenOnline();
          if (!summary.ran) return;

          const synced = summary.queueSynced;
          const total = summary.queueTotal;
          if (synced > 0) {
            recordLastSyncTime();
          }
          if (synced > 0 && showToast) {
            const remaining = summary.queueRemaining;
            toast.success(
              remaining > 0
                ? `Synced ${synced} of ${total} contact(s). ${remaining} still pending.`
                : `Synced ${synced} contact(s) to database. Offline queue is empty.`,
            );
          }

          window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
          window.dispatchEvent(new CustomEvent("cs-queue-updated"));
          await publishOfflineQueueSnapshot().catch(() => undefined);
        } finally {
          window.dispatchEvent(new CustomEvent("cs-sync-end"));
        }
      } catch {
        /* auto-sync is best-effort */
        window.dispatchEvent(new CustomEvent("cs-sync-end"));
      }
    };

    const handleOnline = () => {
      syncConnectionModeWithNetwork();
      void processAutoSync();
    };
    const handleOffline = () => {
      syncConnectionModeWithNetwork();
    };

    if (!navigator.onLine) {
      syncConnectionModeWithNetwork();
    } else {
      void processAutoSync();
    }

    const handleConnectionModeChange = (e: Event) => {
      const mode = (e as CustomEvent<"online" | "offline">).detail;
      if (mode === "online" && navigator.onLine) {
        void processAutoSync();
      }
    };

    const reportQueueUpdate = () => {
      if (navigator.onLine) {
        void publishOfflineQueueSnapshot().catch(() => undefined);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("cs-connection-mode-changed", handleConnectionModeChange);
    window.addEventListener("cs-queue-updated", reportQueueUpdate);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("cs-connection-mode-changed", handleConnectionModeChange);
      window.removeEventListener("cs-queue-updated", reportQueueUpdate);
    };
  }, [isPublicShellRoute]);

  if (isPublicShellRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    );
  }

  const appContent = (
    <ConfirmModalProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset className="relative flex min-h-svh flex-1 flex-col bg-transparent">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-surface" />
            <div className="sticky top-0 z-40 shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
              <InstallPrompt />
              <TopBar />
              <NetworkOfflineBanner />
            </div>
            <main className="min-h-0 flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        <CookieConsentBanner />
      </SidebarProvider>
    </ConfirmModalProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {authRequired ? <AuthGate>{appContent}</AuthGate> : appContent}
    </QueryClientProvider>
  );
}
