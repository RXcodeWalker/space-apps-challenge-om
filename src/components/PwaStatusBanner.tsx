// ============================================================
// PwaStatusBanner.tsx — Classroom PWA installation & Offline status
// Tailored for school iPads, Chromebooks, and classroom offline usage
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  WifiOff,
  RefreshCw,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Tablet,
  Laptop,
  Sparkles,
} from "lucide-react";
import { usePwa } from "../utils/usePwa";
import { soundEffects } from "../utils/soundEffects";

interface PwaStatusBannerProps {
  compact?: boolean;
}

export default function PwaStatusBanner({ compact = false }: PwaStatusBannerProps) {
  const {
    isOnline,
    isInstallable,
    isInstalled,
    isIosOrIpad,
    hasUpdate,
    installApp,
    updateApp,
  } = usePwa();

  const [isDismissed, setIsDismissed] = useState(false);
  const [showIpadGuide, setShowIpadGuide] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // If dismissed and online without updates or install prompt, render nothing
  if (isDismissed && isOnline && !hasUpdate) {
    return null;
  }

  return (
    <>
      {/* 1. NEW VERSION UPDATE NOTIFICATION */}
      <AnimatePresence>
        {hasUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full bg-gradient-to-r from-blue-700 via-cyan-600 to-blue-700 text-white px-4 py-2.5 shadow-lg border-b border-cyan-300/40 relative z-50 flex items-center justify-between text-xs sm:text-sm font-medium"
          >
            <div className="flex items-center gap-2.5 max-w-7xl mx-auto w-full">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-200 shrink-0" />
              <span>
                <strong>New NASA Mission Update Ready!</strong> Reload to apply latest telemetry and flight enhancements.
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playButtonClick();
                  updateApp();
                }}
                className="ml-auto px-3 py-1 bg-white text-blue-900 rounded-lg font-bold hover:bg-cyan-100 transition-colors shrink-0 shadow-sm"
              >
                Update Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. OFFLINE STATUS INDICATOR BANNER */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-amber-200 px-4 py-2 border-b border-amber-500/40 relative z-40 text-xs font-mono shadow-md"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  <strong>OFFLINE FLIGHT MODE:</strong> No internet connection detected. Outpost local systems, 3D dioramas & life support simulations are 100% operational offline.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOfflineModal(true)}
                className="underline hover:text-white shrink-0 hidden sm:inline"
              >
                System Status
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. INSTALL BANNER (Chromebook, Tablet, or iPad) */}
      <AnimatePresence>
        {!isInstalled && !isDismissed && (isInstallable || isIosOrIpad) && isOnline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`w-full bg-slate-950/95 border-b border-cyan-800/40 backdrop-blur-md px-3 sm:px-6 py-2.5 relative z-30 transition-all ${
              compact ? "text-xs" : "text-xs sm:text-sm"
            }`}
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shrink-0 shadow-md">
                  {isIosOrIpad ? (
                    <Tablet className="w-4 h-4 text-white" />
                  ) : (
                    <Laptop className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      Install Outpost Commander App
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40 text-[10px] font-mono font-semibold uppercase">
                      Classroom Offline PWA
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs hidden sm:block">
                    Add to home screen for school iPads, Chromebooks, and tablets. Runs full-screen with zero Wi-Fi required.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isInstallable && (
                  <button
                    type="button"
                    onClick={async () => {
                      soundEffects.playButtonClick();
                      await installApp();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all border border-cyan-300/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install App</span>
                  </button>
                )}

                {isIosOrIpad && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setShowIpadGuide(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 font-bold text-xs border border-cyan-700/50 transition-all"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span>Install on iPad</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. IPAD INSTALLATION GUIDE MODAL */}
      <AnimatePresence>
        {showIpadGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-cyan-500/50 p-6 shadow-2xl text-slate-100"
            >
              <button
                type="button"
                onClick={() => setShowIpadGuide(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#06B6D4] flex items-center justify-center shadow-lg border border-cyan-300/30">
                  <Tablet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Install on School iPad & Classroom Tablets
                  </h3>
                  <p className="text-xs text-cyan-300 font-mono">
                    Apple Safari Web App Standalone Mode
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                Installing Outpost Commander on your iPad or school tablet lets you play full-screen without address bars, even when disconnected from classroom Wi-Fi:
              </p>

              <div className="space-y-3.5 mb-6">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <span>Tap the Safari Share Button</span>
                      <Share2 className="w-3.5 h-3.5 text-cyan-400 inline" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      At the top right of Safari (or bottom toolbar on iPad mini / iPhone).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <span>Select "Add to Home Screen"</span>
                      <PlusSquare className="w-3.5 h-3.5 text-cyan-400 inline" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Scroll down through the share options until you see the plus square icon.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <span>Tap "Add" & Launch Standalone</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The Outpost Commander mission badge will appear on your iPad home screen. It will load completely offline anytime!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Offline Service Worker Primed</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowIpadGuide(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. OFFLINE STATUS MODAL */}
      <AnimatePresence>
        {showOfflineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500/50 p-6 shadow-2xl text-slate-100"
            >
              <button
                type="button"
                onClick={() => setShowOfflineModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center">
                  <WifiOff className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Offline Mission Readiness
                  </h3>
                  <p className="text-xs text-amber-300 font-mono">
                    Autonomous Outpost Architecture
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Outpost Commander is engineered with an offline-first Service Worker cache. You can run all 10 Sols of simulation, handle space radiation and dust storms, inspect the 3D diorama, listen to mission audio, and generate printable Junior Astronaut certificates completely without Wi-Fi or cellular data.
              </p>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-5 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Simulation Core:</span>
                  <span className="text-emerald-400">100% Client-Side</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>NASA Constants:</span>
                  <span className="text-emerald-400">Embedded LRO/MSL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>3D Habitat Diorama:</span>
                  <span className="text-emerald-400">Cached Three.js</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sound Synthesis:</span>
                  <span className="text-emerald-400">Web Audio API</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOfflineModal(false)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors"
              >
                Close Status
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
