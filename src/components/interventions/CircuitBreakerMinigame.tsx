// ============================================================
// CircuitBreakerMinigame.tsx — ⚡ Emergency Circuit Breaker Reroute
// Fast-paced electrical triage for Grid Overloads / Brownouts.
// 4 toggle switches (Life Support, Science Bay, Crew Quarters, Communications).
// Flip off 2 non-essential loads to balance a surging 120 MW grid demand
// safely back below the 100 MW ceiling.
// ============================================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, AlertTriangle, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import type { FlightDirectorInterventionResult } from "../../types/intervention";
import { soundEffects } from "../../utils/soundEffects";

interface CircuitBreakerMinigameProps {
  onResolve: (result: FlightDirectorInterventionResult) => void;
  disabled?: boolean;
}

interface CircuitLoad {
  id: "life_support" | "science_bay" | "crew_quarters" | "comms";
  name: string;
  wattageMW: number;
  isEssential: boolean;
  category: string;
  warningIfCut?: string;
}

const CIRCUIT_LOADS: CircuitLoad[] = [
  {
    id: "life_support",
    name: "Life Support (ECLSS)",
    wattageMW: 45,
    isEssential: true,
    category: "CRITICAL LOAD",
    warningIfCut: "Asphyxiation Hazard: O₂ scrubbers & water recycling offline!",
  },
  {
    id: "science_bay",
    name: "Science Bay Instruments",
    wattageMW: 12,
    isEssential: false,
    category: "NON-ESSENTIAL",
  },
  {
    id: "crew_quarters",
    name: "Crew Quarters & Galley",
    wattageMW: 10,
    isEssential: false,
    category: "NON-ESSENTIAL",
  },
  {
    id: "comms",
    name: "Deep Space Network Comms",
    wattageMW: 53,
    isEssential: true,
    category: "CRITICAL LOAD",
    warningIfCut: "Mission Isolation: NASA Deep Space telemetry lost!",
  },
];

export default function CircuitBreakerMinigame({
  onResolve,
  disabled = false,
}: CircuitBreakerMinigameProps) {
  // All 4 loads start energized (120 MW surge total)
  const [activeSwitches, setActiveSwitches] = useState<Record<string, boolean>>({
    life_support: true,
    science_bay: true,
    crew_quarters: true,
    comms: true,
  });

  const toggleLoad = (loadId: string) => {
    if (disabled) return;
    setActiveSwitches((prev) => {
      const nextState = !prev[loadId];
      soundEffects.playSwitchToggle(nextState);
      return { ...prev, [loadId]: nextState };
    });
  };

  // Compute total load and essential integrity
  const currentDemandMW = CIRCUIT_LOADS.reduce(
    (sum, load) => (activeSwitches[load.id] ? sum + load.wattageMW : sum),
    0
  );

  const gridCeilingMW = 100;
  const isOverCeiling = currentDemandMW > gridCeilingMW;
  const isLifeSupportOffline = !activeSwitches.life_support;
  const isCommsOffline = !activeSwitches.comms;
  const hasCriticalOffline = isLifeSupportOffline || isCommsOffline;

  // Optimal condition: Demand <= 100 MW AND both essential systems remain active!
  const isBalancedAndSafe = !isOverCeiling && !hasCriticalOffline;

  const handleCommit = () => {
    if (disabled) return;

    if (isBalancedAndSafe) {
      soundEffects.playPuzzleSuccess();
      onResolve({
        interventionType: "circuit_breaker",
        status: "success",
        telemetrySummary: `Grid Overload Stabilized: Shed non-essential loads. Surging 120 MW bus balanced to ${currentDemandMW} MW (<100 MW ceiling) with critical life support intact. +15% Grid Health, +10 MW Headroom Bonus.`,
        gridHealthBonus: 15,
        powerDeltaMW: 10,
        details: {
          demandMW: currentDemandMW,
          lifeSupportSafe: !isLifeSupportOffline,
          commsSafe: !isCommsOffline,
        },
      });
    } else {
      soundEffects.playPuzzleFail();
      onResolve({
        interventionType: "circuit_breaker",
        status: "failure",
        telemetrySummary: `Grid Surge Breach: ${
          hasCriticalOffline
            ? "Critical survival systems severed during breaker reroute!"
            : `Bus demand (${currentDemandMW} MW) exceeded 100 MW ceiling, causing main transformer brownout!`
        } (-10% Grid Health, -10 MW Power Penalty).`,
        gridHealthBonus: -10,
        powerDeltaMW: -10,
        details: {
          demandMW: currentDemandMW,
          hasCriticalOffline,
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-gradient-to-b from-amber-950/30 via-slate-900/60 to-black/80 border-2 border-amber-500/30 shadow-inner">
      {/* Minigame Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Emergency Circuit Breaker Reroute</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-500/30">
                100 MW CEILING
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Flip off 2 non-essential loads to balance surging 120 MW demand back below the 100 MW ceiling.
            </p>
          </div>
        </div>

        {/* Live Triage Status */}
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 uppercase transition-all ${
            isBalancedAndSafe
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-lg shadow-emerald-500/20 animate-pulse"
              : hasCriticalOffline
              ? "bg-red-500/20 text-red-300 border border-red-500/60 animate-pulse"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/50"
          }`}
        >
          {isBalancedAndSafe ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>GRID BALANCED ({currentDemandMW} MW)</span>
            </>
          ) : hasCriticalOffline ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-red-300" />
              <span>CRITICAL OFFLINE</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>SURGE: +{currentDemandMW - gridCeilingMW} MW</span>
            </>
          )}
        </div>
      </div>

      {/* Grid Load Telemetry Meter */}
      <div className="bg-black/60 p-3 rounded-xl border border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 flex items-center gap-1.5 font-bold">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Main Distribution Bus Demand:</span>
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`font-black text-sm ${
                isBalancedAndSafe
                  ? "text-emerald-400"
                  : isOverCeiling
                  ? "text-red-400 animate-pulse"
                  : "text-amber-300"
              }`}
            >
              {currentDemandMW} MW
            </span>
            <span className="text-[11px] text-slate-400 font-mono">/ 100 MW Limit</span>
          </div>
        </div>

        {/* Demand Progress Bar with 100 MW Marker */}
        <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
          <motion.div
            initial={false}
            animate={{
              width: `${Math.min(100, (currentDemandMW / 140) * 100)}%`,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`h-full rounded-full transition-colors ${
              isBalancedAndSafe
                ? "bg-gradient-to-r from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/50"
                : isOverCeiling
                ? "bg-gradient-to-r from-amber-500 to-red-500 shadow-md shadow-red-500/50"
                : "bg-gradient-to-r from-cyan-500 to-blue-500"
            }`}
          />

          {/* 100 MW Ceiling Line Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-sm"
            style={{ left: `${(100 / 140) * 100}%` }}
            title="100 MW Operating Ceiling"
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span>0 MW</span>
          <span className="text-red-400 font-bold">▲ 100 MW Overload Ceiling</span>
          <span>140 MW Max Bus</span>
        </div>
      </div>

      {/* 4 Breaker Toggle Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CIRCUIT_LOADS.map((load) => {
          const isEnergized = activeSwitches[load.id];

          return (
            <motion.div
              key={load.id}
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                isEnergized
                  ? load.isEssential
                    ? "bg-slate-900/80 border-cyan-500/40 shadow-sm"
                    : "bg-slate-900/80 border-amber-500/50 shadow-md shadow-amber-950/30"
                  : "bg-black/60 border-slate-700/60 opacity-60"
              }`}
            >
              <div className="flex flex-col gap-0.5 pr-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded uppercase ${
                      load.isEssential
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {load.category}
                  </span>
                  <span className="text-xs font-black text-white">{load.name}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{load.wattageMW} MW</span>
                  <span className="text-[10px] text-slate-400">
                    {isEnergized ? "ONLINE" : "SHED / OFFLINE"}
                  </span>
                </div>
                {!isEnergized && load.isEssential && (
                  <span className="text-[10px] text-red-400 font-bold font-mono">
                    ⚠️ {load.warningIfCut}
                  </span>
                )}
              </div>

              {/* Aerospace Toggle Switch Button */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleLoad(load.id)}
                aria-label={`Toggle ${load.name} breaker switch (${isEnergized ? "Energized" : "Shed"})`}
                className={`relative w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isEnergized
                    ? load.isEssential
                      ? "bg-cyan-600 shadow-md shadow-cyan-600/40"
                      : "bg-amber-500 shadow-md shadow-amber-500/40"
                    : "bg-slate-800 border border-slate-600"
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[9px] font-mono font-black ${
                    isEnergized ? "ml-auto text-slate-900" : "mr-auto text-slate-500"
                  }`}
                >
                  {isEnergized ? "ON" : "OFF"}
                </motion.div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Action Commitment Button */}
      <motion.button
        type="button"
        whileHover={{ scale: disabled ? 1 : 1.015 }}
        whileTap={{ scale: disabled ? 1 : 0.985 }}
        disabled={disabled}
        onClick={handleCommit}
        className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
          isBalancedAndSafe
            ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-emerald-900/50 hover:brightness-110"
            : hasCriticalOffline
            ? "bg-red-800 text-red-200 border border-red-500/50"
            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
        }`}
      >
        {isBalancedAndSafe ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>STABILIZE GRID BUS ({currentDemandMW} MW &lt; 100 MW)</span>
          </>
        ) : hasCriticalOffline ? (
          <>
            <AlertTriangle className="w-4 h-4 text-red-300" />
            <span>WARNING: RESTORE CRITICAL LIFE SUPPORT / COMMS</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 text-amber-400" />
            <span>CONFIRM POWER REROUTE ({currentDemandMW} MW)</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
