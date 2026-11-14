// ============================================================
// PwaNavButton.tsx — Top-bar PWA install / status pill
// Quick access for teachers, students, iPads, and Chromebooks
// ============================================================

import { useState } from "react";
import { Download, Tablet, WifiOff, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import { usePwa } from "../utils/usePwa";
import { soundEffects } from "../utils/soundEffects";
import PwaStatusBanner from "./PwaStatusBanner";

export default function PwaNavButton() {
  const {
    isOnline,
    isInstallable,
    isInstalled,
    isIosOrIpad,
    hasUpdate,
    installApp,
    updateApp,
  } = usePwa();

  const [showIpadGuide, setShowIpadGuide] = useState(false);

  // If update is available, prioritize update button
  if (hasUpdate) {
    return (
      <button
        type="button"
        onClick={() => {
          soundEffects.playButtonClick();
          updateApp();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md border border-cyan-300 animate-pulse transition-all"
        title="New version available. Click to reload."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden sm:inline">Update App</span>
      </button>
    );
  }

  // If offline, show offline badge
  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600/50 text-amber-300 font-mono text-xs font-bold"
        title="Operating in Offline Simulation Mode"
      >
        <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-400" />
        <span className="hidden sm:inline">Offline Mode</span>
      </div>
    );
  }

  // If already installed as standalone
  if (isInstalled) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 font-mono text-[11px] font-semibold"
        title="Running as Installed PWA with Offline Cache"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden lg:inline">Offline Ready</span>
      </div>
    );
  }

  // If Chrome / Android install prompt available
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={async () => {
          soundEffects.playButtonClick();
          await installApp();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-sm border border-cyan-400/40 transition-all hover:scale-105 active:scale-95"
        title="Install Outpost Commander on your Chromebook or tablet"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // If on iOS / iPad Safari
  if (isIosOrIpad) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            soundEffects.playButtonClick();
            setShowIpadGuide(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-700/50 text-cyan-300 font-bold text-xs transition-all hover:scale-105 active:scale-95"
          title="Install on iPad Home Screen"
        >
          <Tablet className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Install on iPad</span>
        </button>

        {showIpadGuide && (
          <div className="relative">
            <PwaStatusBanner compact={false} />
          </div>
        )}
      </>
    );
  }

  // If desktop/tablet where browser hasn't fired beforeinstallprompt yet but offline cache is ready
  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px] font-mono"
      title="PWA Offline Service Worker Registered"
    >
      <Sparkles className="w-3 h-3 text-cyan-400" />
      <span>Classroom PWA</span>
    </div>
  );
}
