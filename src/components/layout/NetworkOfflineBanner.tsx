import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function NetworkOfflineBanner() {
  // SSR and first client paint must match — sync navigator.onLine after mount only.
  const [networkOnline, setNetworkOnline] = useState(true);

  useEffect(() => {
    const sync = () => setNetworkOnline(navigator.onLine);

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (networkOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center gap-2 border-t border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive sm:px-4 md:px-6"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <p className="min-w-0 leading-snug">
        No internet connection. You&apos;re working offline — captures stay on this device until
        you&apos;re back online.
      </p>
    </div>
  );
}
