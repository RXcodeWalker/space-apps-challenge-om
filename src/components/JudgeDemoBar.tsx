// ============================================================
// JudgeDemoBar.tsx — Unobtrusive Judge Express Demo Bar
// Provides rapid 3-minute hackathon evaluation shortcuts:
// 1. ⏩ Jump to Sol 9 Crisis (Low battery, active Solar Particle Event)
// 2. 🚨 Trigger Crisis Minigame (15s Shield, Breaker, or Soil Wash)
// 3. 🏆 View Mission Debrief (Interactive SVG chart & STEM certificate)
// 4. 📄 Preview Printable Lab Report (@media print STEM worksheet)
// ============================================================

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FastForward,
  Radio,
  Award,
  FileText,
  Zap,
  ChevronDown,
  Sparkles,
  Sun,
} from "lucide-react";
import { soundEffects } from "../utils/soundEffects";

interface JudgeDemoBarProps {
  isOpen: boolean;
  onToggle: () => void;
  onJumpToSol9: () => void;
  onTriggerMinigame: () => void;
  onViewDebrief: () => void;
  onPreviewLabReport: () => void;
  onOpenSolarTracker?: () => void;
  onOpenPatchDesigner?: () => void;
}

/**
 * Subtle Nav Pill for Header Navigation bars
 */
export function JudgeDemoNavPill({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        soundEffects.playButtonClick();
        onClick();
      }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all shadow-sm group cursor-pointer ${
        isOpen
          ? "bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/50 scale-105"
          : "bg-amber-950/50 hover:bg-amber-900/60 border-amber-500/60 hover:border-amber-400 text-amber-300 shadow-amber-950/40"
      }`}
      title="Judge Express Demo Bar (Hackathon 3-Minute Rapid Evaluation)"
    >
      <Zap className={`w-3.5 h-3.5 ${isOpen ? "text-slate-950" : "text-amber-400 animate-pulse"} group-hover:scale-110 transition-transform`} />
      <span className="font-bold tracking-tight">⚡ Demo / Fast-Forward</span>
      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40 hidden md:inline">
        Judge Bar
      </span>
    </button>
  );
}

export default function JudgeDemoBar({
  isOpen,
  onToggle,
  onJumpToSol9,
  onTriggerMinigame,
  onViewDebrief,
  onPreviewLabReport,
  onOpenSolarTracker,
  onOpenPatchDesigner,
}: JudgeDemoBarProps) {
  // Global keyboard shortcut ('d' or 'D') to toggle drawer if not focused on inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "d" || e.key === "D") {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          onToggle();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);

  return (
    <>
      {/* Floating Collapsed Pill Trigger (when drawer is minimized) */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-40"
        >
          <button
            type="button"
            onClick={() => {
              soundEffects.playButtonClick();
              onToggle();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border-2 border-amber-500/80 hover:border-amber-400 text-amber-300 shadow-2xl shadow-amber-950/60 backdrop-blur-md font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            title="Open Judge Express Demo Bar (Press 'D')"
          >
            <div className="relative">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <span>⚡ Demo / Fast-Forward</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40">
              3-Min Eval
            </span>
          </button>
        </motion.div>
      )}

      {/* Floating High-Contrast Demo Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-2xl z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0A0D18] border-2 border-amber-500/70 rounded-2xl shadow-2xl shadow-black/90 p-4 text-white backdrop-blur-xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
                  <Zap className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>⚡ Judge Express Demo Bar</span>
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase">
                      3-Min Hackathon Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">
                    Jump immediately into any phase of Outpost Commander without playing all 10 Sols.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onToggle();
                  }}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                  title="Minimize Demo Bar (Press 'D')"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 Action Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
              {/* 1. ⏩ Jump to Sol 9 Crisis */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playButtonClick();
                  onJumpToSol9();
                }}
                className="group p-3 rounded-xl bg-gradient-to-br from-red-950/40 to-slate-900/90 hover:from-red-900/50 hover:to-slate-800 border-2 border-red-500/50 hover:border-red-400 transition-all text-left flex items-start gap-3 shadow-md hover:shadow-red-950/50 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform shrink-0 border border-red-500/30">
                  <FastForward className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-black text-white group-hover:text-red-200 transition-colors">
                      ⏩ Jump to Sol 9 Crisis
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-600/50 font-bold uppercase shrink-0">
                      High Stakes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Low battery, brownout alert & active Solar Particle Event incident.
                  </p>
                </div>
              </button>

              {/* 2. 🚨 Trigger Crisis Minigame */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playButtonClick();
                  onTriggerMinigame();
                }}
                className="group p-3 rounded-xl bg-gradient-to-br from-purple-950/40 to-slate-900/90 hover:from-purple-900/50 hover:to-slate-800 border-2 border-purple-500/50 hover:border-purple-400 transition-all text-left flex items-start gap-3 shadow-md hover:shadow-purple-950/50 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform shrink-0 border border-purple-500/30">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-black text-white group-hover:text-purple-200 transition-colors">
                      🚨 Trigger Crisis Minigame
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-600/50 font-bold uppercase shrink-0">
                      15s Triage
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Tactile micro-puzzles: Magnetic Shield, Circuit Breaker, or Soil Wash.
                  </p>
                </div>
              </button>

              {/* 3. 🏆 View Mission Debrief */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playButtonClick();
                  onViewDebrief();
                }}
                className="group p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900/90 hover:from-cyan-900/50 hover:to-slate-800 border-2 border-cyan-500/50 hover:border-cyan-400 transition-all text-left flex items-start gap-3 shadow-md hover:shadow-cyan-950/50 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform shrink-0 border border-cyan-500/30">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-black text-white group-hover:text-cyan-200 transition-colors">
                      🏆 View Mission Debrief
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/50 font-bold uppercase shrink-0">
                      10-Sol SVG
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Interactive SVG chart, AI insights & printable STEM certificate.
                  </p>
                </div>
              </button>

              {/* 4. 📄 Preview Printable Lab Report */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playButtonClick();
                  onPreviewLabReport();
                }}
                className="group p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/90 hover:from-emerald-900/50 hover:to-slate-800 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all text-left flex items-start gap-3 shadow-md hover:shadow-emerald-950/50 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform shrink-0 border border-emerald-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-black text-white group-hover:text-emerald-200 transition-colors">
                      📄 Printable Lab Report
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold uppercase shrink-0">
                      @media print
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Directly preview the NASA flight director STEM lab report & rubric.
                  </p>
                </div>
              </button>

              {/* 5. ☀️ Solar Elevation & Shadow Tracker */}
              {onOpenSolarTracker && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onOpenSolarTracker();
                  }}
                  className="group p-3 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900/90 hover:from-amber-900/50 hover:to-slate-800 border-2 border-amber-500/60 hover:border-amber-400 transition-all text-left flex items-start gap-3 shadow-md hover:shadow-amber-950/50 cursor-pointer sm:col-span-2"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform shrink-0 border border-amber-500/30">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-black text-white group-hover:text-amber-200 transition-colors">
                        ☀️ Solar Elevation & Shadow Tracker (NASA LRO & Curiosity)
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50 font-bold uppercase shrink-0">
                        Orbital Physics
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Inspect Moon 1.5° grazing sun vs Mars 25.2° diurnal arc, 20km crater shadows & Artemis vertical solar masts.
                    </p>
                  </div>
                </button>
              )}

              {/* 6. 🎨 Mission Patch Designer */}
              {onOpenPatchDesigner && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onOpenPatchDesigner();
                  }}
                  className="group p-3 rounded-xl bg-gradient-to-br from-purple-950/50 via-indigo-950/40 to-slate-900/90 hover:from-purple-900/50 hover:to-slate-800 border-2 border-purple-500/60 hover:border-purple-400 transition-all text-left flex items-start gap-3 shadow-md hover:shadow-purple-950/50 cursor-pointer sm:col-span-2"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform shrink-0 border border-purple-500/30">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-black text-white group-hover:text-purple-200 transition-colors">
                        🎨 Mission Patch Designer Studio (Apollo, Artemis & Custom)
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-600/50 font-bold uppercase shrink-0">
                        Vector SVG
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Customize embroidered expedition patch: 4 historic crest shapes, 6 SVG insignia symbols, NASA color schemes, and SVG/PNG export.
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Bottom Footer Tip */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Tip: URL query param <code className="text-amber-300 px-1 py-0.5 rounded bg-black/40 border border-white/10 font-bold">?demo=true</code> auto-opens this bar.</span>
              </span>
              <span className="text-slate-500">Shortcut: Press 'D' to toggle</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
