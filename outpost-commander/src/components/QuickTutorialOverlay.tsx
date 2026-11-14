// ============================================================
// QuickTutorialOverlay.tsx — 3-Step Spotlight Mission Tutorial
// Takes < 15 seconds to complete. Dismissible at any point.
// Steps:
// 1. Shared 100 MW Power Budget
// 2. Live Trade-off Arrows
// 3. NASA Incident Alerts & Telemetry
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Activity,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { soundEffects } from "../utils/soundEffects";

export interface QuickTutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepConfig {
  targetSelector: string;
  badge: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  tip: string;
  accentColor: string;
  borderColor: string;
}

const STEPS: StepConfig[] = [
  {
    targetSelector: '[data-tutorial="power-budget"]',
    badge: "STEP 1 OF 3",
    title: "Shared 100 MW Power Budget",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    description:
      "Every Sol, your outpost generates a fixed 100 MW energy envelope from solar arrays and backup RTGs. Adjust the 3 sliders (or use quick presets) to distribute power without exceeding your budget.",
    tip: "Keep Net Power at 0 MW (balanced) or positive to keep batteries charged!",
    accentColor: "from-amber-500/20 to-blue-500/20",
    borderColor: "border-amber-400/60",
  },
  {
    targetSelector: '[data-tutorial="tradeoff-arrows"]',
    badge: "STEP 2 OF 3",
    title: "Live Trade-off Arrows",
    icon: <Activity className="w-5 h-5 text-cyan-400" />,
    description:
      "Every kilowatt matters! Watch the live directional arrows (▲ / ▼) update in real-time as you slide. Green arrows mean safety and surplus, while red arrows warn of oxygen depletion, crop failures, or radiation leaks.",
    tip: "Check projected deltas before clicking 'Commit Turn'!",
    accentColor: "from-cyan-500/20 to-emerald-500/20",
    borderColor: "border-cyan-400/60",
  },
  {
    targetSelector: '[data-tutorial="incident-alerts"]',
    badge: "STEP 3 OF 3",
    title: "NASA Incident Alerts",
    icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    description:
      "Space is extreme! Solar storms, lunar deep freezes (−173°C), and Mars dust storms trigger mid-mission hazard alerts. You'll make real flight-director directives based on authentic NASA spacecraft data.",
    tip: "Click 'NASA Data' anytime to inspect genuine LRO and Curiosity sensor records.",
    accentColor: "from-rose-500/20 to-blue-500/20",
    borderColor: "border-rose-400/60",
  },
];

export const TUTORIAL_STORAGE_KEY = "outpost_commander_tutorial_seen";

export default function QuickTutorialOverlay({
  isOpen,
  onClose,
}: QuickTutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = STEPS[currentStepIndex];

  // Measure and track target element position
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Smooth scroll target into comfortable view if partially offscreen
      if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step.targetSelector]);

  useEffect(() => {
    if (!isOpen) return;

    updateTargetPosition();
    const handleResizeOrScroll = () => updateTargetPosition();

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    const timeout = setTimeout(updateTargetPosition, 250);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
      clearTimeout(timeout);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  if (!isOpen) return null;

  const handleNext = () => {
    soundEffects.playButtonClick();
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    soundEffects.playButtonClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    soundEffects.playButtonClick();
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    onClose();
  };

  const handleSkip = () => {
    soundEffects.playButtonClick();
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    onClose();
  };

  // Determine ideal position for the tooltip popover
  const hasTarget = targetRect !== null && targetRect.width > 0;
  const isTargetNearBottom = hasTarget && targetRect.top > window.innerHeight * 0.55;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Dark backdrop with smooth fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Spotlight cutout highlight around target */}
      {hasTarget && (
        <motion.div
          key={`spotlight-${currentStepIndex}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="fixed pointer-events-none rounded-2xl border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.45)] z-50"
          style={{
            top: Math.max(8, targetRect.top - 8),
            left: Math.max(8, targetRect.left - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        >
          {/* Subtle pulsating beacon at top-left of target */}
          <span className="absolute -top-3 -right-3 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-cyan-500 text-[11px] font-black font-mono text-slate-950 items-center justify-center">
              {currentStepIndex + 1}
            </span>
          </span>
        </motion.div>
      )}

      {/* Centered or Floating Tooltip Box */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4 z-50">
        <motion.div
          key={`tooltip-${currentStepIndex}`}
          initial={{ opacity: 0, y: isTargetNearBottom ? -15 : 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22 }}
          className={`pointer-events-auto w-full max-w-lg rounded-2xl bg-[#090E1A] border-2 ${step.borderColor} p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-slate-100 relative`}
          style={{
            boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(6,182,212,0.25)",
          }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                {step.icon}
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#06B6D4] uppercase">
                  {step.badge}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Skip Tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Pro Tip Box */}
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-cyan-200">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="text-cyan-300">Commander's Tip:</strong> {step.tip}
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setCurrentStepIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? "w-6 bg-[#06B6D4]"
                      : "w-2 bg-slate-700 hover:bg-slate-600"
                  }`}
                  title={`Jump to Step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-mono font-semibold transition-colors"
              >
                Skip Tutorial
              </button>

              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] hover:brightness-110 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-900/40 transition-all"
              >
                {currentStepIndex < STEPS.length - 1 ? (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Launch Mission!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
