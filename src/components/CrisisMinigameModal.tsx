// ============================================================
// CrisisMinigameModal.tsx — 15-Second Tactical Intervention Tester
// Allows hackathon judges to immediately launch & test all 3 NASA
// micro-puzzles: Magnetic Shield Deflector, Circuit Breaker Reroute,
// and Perchlorate Soil Wash Calibration with full audio & dynamic telemetry.
// ============================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  Zap,
  Beaker,
  Radio,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import FlightDirectorIntervention from "./interventions/FlightDirectorIntervention";
import { SAMPLE_CRISIS_INCIDENTS } from "../utils/judgeDemoData";
import type { FlightDirectorInterventionResult, InterventionType } from "../types/intervention";
import { soundEffects } from "../utils/soundEffects";

interface CrisisMinigameModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: InterventionType;
}

export default function CrisisMinigameModal({
  isOpen,
  onClose,
  initialType = "magnetic_shield",
}: CrisisMinigameModalProps) {
  const [activeType, setActiveType] = useState<InterventionType>(initialType);
  const [resetNonce, setResetNonce] = useState<number>(0);
  const [latestResult, setLatestResult] = useState<FlightDirectorInterventionResult | null>(null);

  if (!isOpen) return null;

  const currentIncident = SAMPLE_CRISIS_INCIDENTS[activeType];

  const handleSwitchType = (type: InterventionType) => {
    soundEffects.playButtonClick();
    setActiveType(type);
    setLatestResult(null);
    setResetNonce((n) => n + 1);
  };

  const handleRestartTimer = () => {
    soundEffects.playButtonClick();
    setLatestResult(null);
    setResetNonce((n) => n + 1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-md">
        {/* Backdrop dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-transparent"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#0A0E1A] border-2 border-red-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-red-950/60 z-10 overflow-hidden text-white"
        >
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-[10px] font-mono font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-sm animate-pulse">
                  <Radio className="w-3 h-3 text-white" />
                  <span>15-SEC TACTICAL TRIAGE</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  Judge Express Sandbox
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span>Flight Director Emergency Interventions</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fast-paced tactile micro-puzzles teaching real NASA engineering triage under pressure.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
              title="Close Sandbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Minigame Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-4">
            {/* 1. Magnetic Shield */}
            <button
              type="button"
              onClick={() => handleSwitchType("magnetic_shield")}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                activeType === "magnetic_shield"
                  ? "bg-cyan-950/70 border-cyan-400 text-white shadow-lg shadow-cyan-950/50"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className={`p-2 rounded-xl ${activeType === "magnetic_shield" ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-400"}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">🧲 Magnetic Shield</p>
                <p className="text-[10px] font-mono text-cyan-400/90 truncate">Solar Particle Vector</p>
              </div>
            </button>

            {/* 2. Circuit Breaker */}
            <button
              type="button"
              onClick={() => handleSwitchType("circuit_breaker")}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                activeType === "circuit_breaker"
                  ? "bg-amber-950/70 border-amber-400 text-white shadow-lg shadow-amber-950/50"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className={`p-2 rounded-xl ${activeType === "circuit_breaker" ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">⚡ Circuit Breaker</p>
                <p className="text-[10px] font-mono text-amber-400/90 truncate">120 MW Grid Reroute</p>
              </div>
            </button>

            {/* 3. Soil Wash */}
            <button
              type="button"
              onClick={() => handleSwitchType("perchlorate_wash")}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                activeType === "perchlorate_wash"
                  ? "bg-emerald-950/70 border-emerald-400 text-white shadow-lg shadow-emerald-950/50"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div className={`p-2 rounded-xl ${activeType === "perchlorate_wash" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                <Beaker className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">🧪 Perchlorate Wash</p>
                <p className="text-[10px] font-mono text-emerald-400/90 truncate">Toxic Salt Removal</p>
              </div>
            </button>
          </div>

          {/* Incident Context Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                  {currentIncident.nasaScience.instrument}
                </span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentIncident.nasaScience.mission}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-100">{currentIncident.headline}</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentIncident.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRestartTimer}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700 hover:border-cyan-400 transition-all"
              title="Reset 15-Second Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset 15s</span>
            </button>
          </div>

          {/* Interactive 15-Second Intervention Component */}
          <div className="relative">
            <FlightDirectorIntervention
              key={`${activeType}-${resetNonce}`}
              incident={currentIncident}
              onInterventionComplete={(res) => setLatestResult(res)}
              activeResult={latestResult}
            />
          </div>

          {/* Bottom Controls */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Features sub-second Web Audio countdown ticking and Cadet mode auto-resolve.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all border border-slate-700"
            >
              Done Testing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
