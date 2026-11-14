// ============================================================
// serviceWorkerRegistration.ts — PWA Service Worker lifecycle
// Handles registration, updates, offline status & classroom caching
// ============================================================

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
};

export function register(config?: Config): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = "/sw.js";

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("[Outpost Commander PWA] Service Worker registered:", registration.scope);

        // Check if an updated service worker is already waiting
        if (registration.waiting) {
          if (config?.onUpdate) {
            config.onUpdate(registration);
          }
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log("[Outpost Commander PWA] New version installed and waiting.");
                if (config?.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // Content cached for offline use
                console.log("[Outpost Commander PWA] Offline cache primed. Outpost ready for classroom use!");
                if (config?.onSuccess) {
                  config.onSuccess(registration);
                }
                if (config?.onOfflineReady) {
                  config.onOfflineReady();
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn("[Outpost Commander PWA] Service Worker registration failed:", error);
      });
  });
}

export function unregister(): void {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export function skipWaitingAndReload(registration?: ServiceWorkerRegistration): void {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
  // Reload once new service worker takes over
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}
