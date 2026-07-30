import { HeadContent, Scripts } from "@tanstack/react-router";

/**
 * Inline bootstrap runs before React hydrates so `beforeinstallprompt` is never missed.
 * The deferred event is adopted later by `registerNameCardScanPwa()` / `getDeferredInstallPrompt()`.
 */
const PWA_INSTALL_BOOTSTRAP = `(function(){try{window.__ncsDeferredInstallPrompt=window.__ncsDeferredInstallPrompt||null;window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__ncsDeferredInstallPrompt=e;window.dispatchEvent(new CustomEvent("cs-pwa-install-available"));});window.addEventListener("appinstalled",function(){window.__ncsDeferredInstallPrompt=null;window.dispatchEvent(new CustomEvent("cs-pwa-install-gone"));});}catch(e){}})();`;

export function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // Theme bootstrap script may set style.colorScheme / .dark before hydrate.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("cs-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light"}}catch(e){}})();`,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: PWA_INSTALL_BOOTSTRAP }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
