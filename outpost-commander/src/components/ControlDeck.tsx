// ============================================================
// ControlDeck.tsx — Outpost Commander Primary Interactive Deck
// Features:
//  1. Top Telemetry Bar (Sol X of 10, Crew Health, Net Power, NASA Data)
//  2. 3 Large Tactile Power Sliders & Steppers (Life Support, Shield, Reserve)
//  3. Shared 100 MW Power Budget with dynamic pool bar & presets
//  4. Live Consequence Preview with real-time color-coded deltas & arrows
//  5. High-contrast "Commit & Advance Turn" button
// ============================================================
import React, { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Leaf,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Minus as ArrowFlat,
  Database,
  HeartPulse,
  Activity,
  Sparkles,
  ChevronRight,
  Battery,
} from "lucide-react";
import type {
  SubsystemState,
  SubsystemId,
  PowerAllocation,
  CrewState,
} from "../engine/simulationEngine";
import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";
import { TOTAL_TURNS } from "../data/nasaConstants";

export interface ControlDeckProps {
  environment: MissionEnvironment;
  currentTurn: number; // 1 to 10
  totalTurns?: number;
  effectiveBudgetMW: number;
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  allocation: PowerAllocation;
  onAllocationChange: (allocation: PowerAllocation) => void;
  onCommitTurn: () => void;
  onShowNasaData: () => void;
  currentEvent?: TurnEvent;
  isProcessing?: boolean;
  children?: React.ReactNode; // Optional slot for OutpostVisualizer
}

const BASELINES: Record<SubsystemId, number> = {
  powerGrid: 25,
  lifeSupport: 35,
  radiationShielding: 30,
};

export default function ControlDeck({
  environment,
  currentTurn,
  totalTurns = TOTAL_TURNS,
  effectiveBudgetMW,
  subsystems,
  crew,
  allocation,
  onAllocationChange,
  onCommitTurn,
  onShowNasaData,
  currentEvent,
  isProcessing = false,
  children,
}: ControlDeckProps) {
  const totalAllocated =
    allocation.powerGrid + allocation.lifeSupport + allocation.radiationShielding;
  const netPowerMW = effectiveBudgetMW - totalAllocated;
  const isOverBudget = netPowerMW < 0;

  // Real-time projected deltas before committing
  const projections = useMemo(() => {
    const stressFactor = currentEvent?.lifeSupportStressFactor ?? 1.0;
    const radMultiplier = currentEvent?.radiationSpikeMultiplier ?? 1.0;

    // 1. Life support & O2/Food
    const lsExcess = Math.max(0, allocation.lifeSupport - BASELINES.lifeSupport);
    const lsDeficit = Math.max(0, BASELINES.lifeSupport - allocation.lifeSupport);
    const o2Delta = Math.round((lsExcess * 2 - lsDeficit * 4) * stressFactor);
    const foodDeltaDays = Math.round((lsExcess * 0.08 - 1.0) * 10) / 10;
    const lsHealthDelta = Math.round(
      (lsExcess * 1.4 - lsDeficit * 2.5) * (1 / stressFactor)
    );

    // 2. Shielding
    const rsExcess = Math.max(0, allocation.radiationShielding - BASELINES.radiationShielding);
    const rsDeficit = Math.max(0, BASELINES.radiationShielding - allocation.radiationShielding);
    const shieldHealthDelta = Math.round(rsExcess * 1.4 - rsDeficit * 2.5);

    // Projected daily radiation dose
    const currentShieldHealth = Math.max(0, Math.min(100, subsystems.radiationShielding.health + shieldHealthDelta));
    const projectedDoseMSv =
      Math.round(
        environment.baselineDailyRadiationMSv *
          radMultiplier *
          (1 - (currentShieldHealth / 100) * 0.85) *
          100
      ) / 100;

    // 3. Power Grid / Battery
    const pgExcess = Math.max(0, allocation.powerGrid - BASELINES.powerGrid);
    const pgDeficit = Math.max(0, BASELINES.powerGrid - allocation.powerGrid);
    const gridHealthDelta = Math.round(pgExcess * 1.4 - pgDeficit * 2.5);

    // 4. Crew Morale Projection
    let moraleTrend: "up" | "down" | "flat" = "flat";
    if (lsHealthDelta >= 0 && shieldHealthDelta >= 0 && !isOverBudget) {
      moraleTrend = "up";
    } else if (lsDeficit > 8 || rsDeficit > 8 || isOverBudget) {
      moraleTrend = "down";
    }

    return {
      o2Delta,
      foodDeltaDays,
      lsHealthDelta,
      shieldHealthDelta,
      projectedDoseMSv,
      gridHealthDelta,
      moraleTrend,
    };
  }, [
    allocation,
    subsystems,
    currentEvent,
    environment,
    isOverBudget,
  ]);

  // Tactile slider / stepper helper
  const handleUpdate = useCallback(
    (channel: SubsystemId, newValue: number) => {
      const clamped = Math.max(0, Math.min(effectiveBudgetMW, Math.round(newValue)));
      onAllocationChange({
        ...allocation,
        [channel]: clamped,
      });
    },
    [allocation, effectiveBudgetMW, onAllocationChange]
  );

  const handleStep = useCallback(
    (channel: SubsystemId, delta: number) => {
      const current = allocation[channel];
      handleUpdate(channel, current + delta);
    },
    [allocation, handleUpdate]
  );

  // Quick preset allocations
  const applyPreset = useCallback(
    (type: "balanced" | "lifeSupport" | "shield" | "batteries") => {
      let next: PowerAllocation;
      if (type === "balanced") {
        const ls = Math.min(BASELINES.lifeSupport, Math.round(effectiveBudgetMW * 0.38));
        const rs = Math.min(BASELINES.radiationShielding, Math.round(effectiveBudgetMW * 0.34));
        const pg = Math.max(0, effectiveBudgetMW - ls - rs);
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      } else if (type === "lifeSupport") {
        const ls = Math.min(effectiveBudgetMW, 45);
        const rem = effectiveBudgetMW - ls;
        const rs = Math.round(rem * 0.55);
        const pg = rem - rs;
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      } else if (type === "shield") {
        const rs = Math.min(effectiveBudgetMW, 42);
        const rem = effectiveBudgetMW - rs;
        const ls = Math.round(rem * 0.6);
        const pg = rem - ls;
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      } else {
        const pg = Math.min(effectiveBudgetMW, 40);
        const rem = effectiveBudgetMW - pg;
        const ls = Math.round(rem * 0.55);
        const rs = rem - ls;
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      }
      onAllocationChange(next);
    },
    [effectiveBudgetMW, onAllocationChange]
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 text-slate-100 select-none">
      {/* 1. TOP TELEMETRY BAR */}
      <div className="w-full rounded-2xl bg-[#0B1120] border border-cyan-900/40 p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Sol progress */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1D4ED8] to-[#06B6D4] flex items-center justify-center font-black text-white text-base shadow-md">
            S{currentTurn}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#06B6D4] uppercase">
                MISSION SOL {currentTurn} OF {totalTurns}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold hidden sm:inline">
                {environment.name}
              </span>
            </div>
            <p className="text-sm font-black text-white leading-tight">
              {currentEvent?.label ?? `Sol ${currentTurn} Operations`}
            </p>
          </div>
        </div>

        {/* Crew Health & Morale */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase">
              Crew Morale & O₂
            </p>
            <p className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>{crew.morale}% Morale</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400">{crew.oxygenBufferPercent}% O₂</span>
            </p>
          </div>
        </div>

        {/* Net Power Telemetry */}
        <div
          className={`flex items-center gap-3 border rounded-xl px-3 py-2 ${
            isOverBudget
              ? "bg-rose-950/60 border-rose-500/60 text-rose-300"
              : netPowerMW === 0
              ? "bg-slate-900/80 border-slate-800 text-slate-300"
              : "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg ${
              isOverBudget
                ? "bg-rose-500/30 text-rose-400"
                : "bg-cyan-500/20 text-cyan-400"
            }`}
          >
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">
              Net Power Balance
            </p>
            <p className="text-xs sm:text-sm font-black font-mono">
              {isOverBudget ? (
                <span className="text-rose-400">
                  OVERLOAD: {netPowerMW} MW
                </span>
              ) : netPowerMW === 0 ? (
                <span className="text-slate-200">100% BALANCED</span>
              ) : (
                <span className="text-emerald-400">+{netPowerMW} MW RESERVE</span>
              )}
            </p>
          </div>
        </div>

        {/* NASA Data Button */}
        <button
          type="button"
          onClick={onShowNasaData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-xs font-bold"
          title="Inspect Real NASA Science Instrument Data"
        >
          <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>NASA Data</span>
        </button>
      </div>

      {/* Optional Child Slot (e.g. OutpostVisualizer Cross-Section) */}
      {children && <div className="w-full">{children}</div>}

      {/* 2. POWER BUDGET POOL BAR & PRESET BUTTONS */}
      <div className="w-full rounded-2xl bg-[#0B1120] border border-cyan-900/40 p-4 shadow-xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase text-slate-400">
              Shared Power Budget:
            </span>{" "}
            <span className="text-base font-black font-mono text-white">
              {effectiveBudgetMW} MW Available
            </span>
            <span className="text-xs text-slate-400 ml-2">
              (Allocated: <strong className="text-white">{totalAllocated} MW</strong>)
            </span>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-500 mr-1 hidden sm:inline">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset("balanced")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 transition-colors"
            >
              ⚖️ Balanced
            </button>
            <button
              type="button"
              onClick={() => applyPreset("lifeSupport")}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/50 hover:bg-emerald-900/60 text-[11px] font-bold text-emerald-300 transition-colors"
            >
              🌱 Life Support Boost
            </button>
            <button
              type="button"
              onClick={() => applyPreset("shield")}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-700/50 hover:bg-cyan-900/60 text-[11px] font-bold text-cyan-300 transition-colors"
            >
              🛡️ Storm Shield
            </button>
            <button
              type="button"
              onClick={() => applyPreset("batteries")}
              className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-700/50 hover:bg-blue-900/60 text-[11px] font-bold text-blue-300 transition-colors"
            >
              🔋 Max Reserves
            </button>
          </div>
        </div>

        {/* Dynamic Multi-segment Power Bar */}
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex shadow-inner">
          {/* Life Support segment */}
          <div
            className="h-full bg-emerald-500 transition-all duration-200"
            style={{
              width: `${Math.min(100, (allocation.lifeSupport / effectiveBudgetMW) * 100)}%`,
            }}
            title={`Life Support: ${allocation.lifeSupport} MW`}
          />
          {/* Shielding segment */}
          <div
            className="h-full bg-[#06B6D4] transition-all duration-200"
            style={{
              width: `${Math.min(
                100,
                (allocation.radiationShielding / effectiveBudgetMW) * 100
              )}%`,
            }}
            title={`Shielding: ${allocation.radiationShielding} MW`}
          />
          {/* Battery / Grid segment */}
          <div
            className="h-full bg-[#1D4ED8] transition-all duration-200"
            style={{
              width: `${Math.min(
                100,
                (allocation.powerGrid / effectiveBudgetMW) * 100
              )}%`,
            }}
            title={`Battery / Grid: ${allocation.powerGrid} MW`}
          />
          {/* Over-budget indicator if over */}
          {isOverBudget && (
            <div className="h-full bg-rose-500 animate-pulse flex-1" title="OVER BUDGET" />
          )}
        </div>
      </div>

      {/* 3. THREE LARGE TACTILE POWER ALLOCATION CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CHANNEL 1: LIFE SUPPORT */}
        <div className="rounded-2xl bg-[#0B1120] border-2 border-emerald-900/50 hover:border-emerald-600/60 transition-all p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Life Support</h3>
                  <p className="text-[11px] text-emerald-300">O₂, Water & Crops</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  {allocation.lifeSupport}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">MW</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 bg-white/5 p-2 rounded-xl">
              Baseline demand: <strong>35 MW</strong>. Keeps oxygen flowing and
              hydroponic plants healthy.
            </p>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={effectiveBudgetMW}
                step="1"
                value={allocation.lifeSupport}
                onChange={(e) => handleUpdate("lifeSupport", Number(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0 MW</span>
                <span className="text-emerald-400 font-bold">35 MW Target</span>
                <span>{effectiveBudgetMW} MW</span>
              </div>
            </div>
          </div>

          {/* Stepper Buttons for Kids / Tablets */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleStep("lifeSupport", -5)}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5" /> -5 MW
            </button>
            <button
              type="button"
              onClick={() => handleStep("lifeSupport", +5)}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> +5 MW
            </button>
          </div>
        </div>

        {/* CHANNEL 2: RADIATION & THERMAL SHIELD */}
        <div className="rounded-2xl bg-[#0B1120] border-2 border-cyan-900/50 hover:border-cyan-500/60 transition-all p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Radiation Shield</h3>
                  <p className="text-[11px] text-cyan-300">Force-Field & Water Wall</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#06B6D4]">
                  {allocation.radiationShielding}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">MW</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 bg-white/5 p-2 rounded-xl">
              Baseline demand: <strong>30 MW</strong>. Repels cosmic rays, solar flares,
              and extreme cold.
            </p>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={effectiveBudgetMW}
                step="1"
                value={allocation.radiationShielding}
                onChange={(e) =>
                  handleUpdate("radiationShielding", Number(e.target.value))
                }
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#06B6D4] focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0 MW</span>
                <span className="text-cyan-400 font-bold">30 MW Target</span>
                <span>{effectiveBudgetMW} MW</span>
              </div>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleStep("radiationShielding", -5)}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5" /> -5 MW
            </button>
            <button
              type="button"
              onClick={() => handleStep("radiationShielding", +5)}
              className="flex-1 py-2 rounded-xl bg-[#06B6D4] hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> +5 MW
            </button>
          </div>
        </div>

        {/* CHANNEL 3: BATTERY CHARGING & GRID RESERVE */}
        <div className="rounded-2xl bg-[#0B1120] border-2 border-blue-900/50 hover:border-blue-600/60 transition-all p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Battery className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Battery Reserves</h3>
                  <p className="text-[11px] text-blue-300">Solar Array & Backup RTG</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-blue-400">
                  {allocation.powerGrid}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">MW</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 bg-white/5 p-2 rounded-xl">
              Baseline demand: <strong>25 MW</strong>. Charges backup cells for dust
              storms and eclipses.
            </p>

            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={effectiveBudgetMW}
                step="1"
                value={allocation.powerGrid}
                onChange={(e) => handleUpdate("powerGrid", Number(e.target.value))}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#1D4ED8] focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0 MW</span>
                <span className="text-blue-400 font-bold">25 MW Target</span>
                <span>{effectiveBudgetMW} MW</span>
              </div>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleStep("powerGrid", -5)}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5" /> -5 MW
            </button>
            <button
              type="button"
              onClick={() => handleStep("powerGrid", +5)}
              className="flex-1 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> +5 MW
            </button>
          </div>
        </div>
      </div>

      {/* 4. LIVE CONSEQUENCE PREVIEW (Trade-off projection before advancing) */}
      <div className="w-full rounded-2xl bg-[#0B1120] border-2 border-cyan-800/40 p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#06B6D4]" />
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#06B6D4]">
              LIVE CONSEQUENCE PREVIEW (Projected Turn Deltas)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Real-time trade-off feedback
          </span>
        </div>

        {/* Delta Badges with Up/Down arrows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Delta 1: O2 & Food */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">O₂ & Food Buffer</p>
              <p className="text-sm font-black text-white mt-0.5">
                {projections.o2Delta > 0
                  ? `+${projections.o2Delta}% O₂ Surplus`
                  : projections.o2Delta < 0
                  ? `${projections.o2Delta}% O₂ Depletion`
                  : "0% O₂ Stable"}
              </p>
              <p className="text-[10px] text-slate-400">
                Food: {projections.foodDeltaDays >= 0 ? "+" : ""}
                {projections.foodDeltaDays} days/sol
              </p>
            </div>
            <div
              className={`p-2 rounded-xl flex items-center justify-center ${
                projections.o2Delta > 0
                  ? "bg-emerald-500/20 text-emerald-400"
                  : projections.o2Delta < 0
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {projections.o2Delta > 0 ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : projections.o2Delta < 0 ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowFlat className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Delta 2: Shield Integrity & Radiation Dose */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Shield Integrity</p>
              <p className="text-sm font-black text-white mt-0.5">
                {projections.shieldHealthDelta > 0
                  ? `+${projections.shieldHealthDelta}% Fortified`
                  : projections.shieldHealthDelta < 0
                  ? `${projections.shieldHealthDelta}% Wear / Breach`
                  : "0% Stable"}
              </p>
              <p className="text-[10px] text-slate-400">
                Dose: ~{projections.projectedDoseMSv} mSv/sol
              </p>
            </div>
            <div
              className={`p-2 rounded-xl flex items-center justify-center ${
                projections.shieldHealthDelta > 0
                  ? "bg-cyan-500/20 text-cyan-400"
                  : projections.shieldHealthDelta < 0
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {projections.shieldHealthDelta > 0 ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : projections.shieldHealthDelta < 0 ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowFlat className="w-5 h-5" />
              )}
            </div>
          </div>

          {/* Delta 3: Net Power & Batteries */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Battery & Grid</p>
              <p className="text-sm font-black text-white mt-0.5">
                {netPowerMW > 0
                  ? `+${netPowerMW} MW Charging`
                  : netPowerMW < 0
                  ? `${netPowerMW} MW Deficit`
                  : "0 MW Balanced"}
              </p>
              <p className="text-[10px] text-slate-400">
                Grid Health: {projections.gridHealthDelta >= 0 ? "+" : ""}
                {projections.gridHealthDelta}%
              </p>
            </div>
            <div
              className={`p-2 rounded-xl flex items-center justify-center ${
                netPowerMW >= 0
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {netPowerMW > 0 ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : netPowerMW < 0 ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowFlat className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>

        {/* 10-Second Kid Takeaway Note */}
        <div className="text-xs text-slate-300 bg-white/5 rounded-xl p-3 border border-white/5 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isOverBudget ? (
              <span className="text-rose-400 font-bold">
                Warning: You allocated more than the {effectiveBudgetMW} MW available!
                Reduce power on one system so your grid doesn't brown out.
              </span>
            ) : allocation.lifeSupport < 25 ? (
              <span className="text-amber-300">
                Life Support is low! Your crew will breathe through backup tanks and
                crops will wilt.
              </span>
            ) : allocation.radiationShielding < 20 ? (
              <span className="text-amber-300">
                Shielding is thin! The crew will absorb extra space radiation this sol.
              </span>
            ) : (
              <span className="text-emerald-300">
                Power is well distributed! Systems will hold steady through Sol {currentTurn}.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 5. COMMIT & ADVANCE TURN BUTTON */}
      <div className="w-full flex items-center justify-end pt-2">
        <motion.button
          type="button"
          onClick={onCommitTurn}
          disabled={isProcessing}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base sm:text-lg tracking-wide flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/50 ${
            isOverBudget
              ? "bg-amber-600 hover:bg-amber-500 text-white border border-amber-300/40"
              : "bg-gradient-to-r from-[#1D4ED8] via-blue-600 to-[#06B6D4] hover:brightness-110 text-white border border-cyan-300/40"
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⚙️</span>
              Simulating Sol {currentTurn}...
            </span>
          ) : (
            <>
              <span>Commit & Advance to Sol {currentTurn < totalTurns ? currentTurn + 1 : "Evaluation"}</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
