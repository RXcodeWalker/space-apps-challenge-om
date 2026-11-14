// ============================================================
// usePwa.ts — Hook for PWA installation, offline state & updates
// Engineered for school iPads, Chromebooks, and classroom setups
// ============================================================

import { useState, useEffect, useCallback } from "react";
import * as serviceWorkerRegistration from "../serviceWorkerRegistration";

export interface PwaState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isIosOrIpad: boolean;
  isOfflineReady: boolean;
  hasUpdate: boolean;
  installApp: () => Promise<boolean>;
  updateApp: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwa(): PwaState {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosOrIpad, setIsIosOrIpad] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorkerRegistration, setWaitingWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Online / Offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 2. Standalone detection (iPad, Android, ChromeOS)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isStandaloneParam = new URLSearchParams(window.location.search).get("source") === "pwa";
      return isStandaloneMedia || isIosStandalone || isStandaloneParam;
    };
    setIsInstalled(checkStandalone());

    // 3. iOS / iPadOS detection
    const userAgent = window.navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(userAgent);
    // iPad on iOS 13+ reports as MacIntel with touch points
    const isIpadOS =
      window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
    setIsIosOrIpad(isIos || isIpadOS);

    // 4. Chrome / Chromebook / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("[Outpost Commander PWA] App successfully installed!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Register Service Worker with callbacks
    serviceWorkerRegistration.register({
      onSuccess: () => {
        setIsOfflineReady(true);
      },
      onOfflineReady: () => {
        setIsOfflineReady(true);
      },
      onUpdate: (registration) => {
        setHasUpdate(true);
        setWaitingWorkerRegistration(registration);
      },
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[Outpost Commander PWA] Install prompt error:", err);
      return false;
    }
  }, [deferredPrompt]);

  const updateApp = useCallback(() => {
    if (waitingWorkerRegistration) {
      serviceWorkerRegistration.skipWaitingAndReload(waitingWorkerRegistration);
    } else {
      window.location.reload();
    }
  }, [waitingWorkerRegistration]);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    isIosOrIpad,
    isOfflineReady,
    hasUpdate,
    installApp,
    updateApp,
  };
}
