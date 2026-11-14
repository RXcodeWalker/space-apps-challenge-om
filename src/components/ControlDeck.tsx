// ============================================================
// ControlDeck.tsx — Outpost Commander Primary Interactive Deck
// Features:
//  1. Top Telemetry Bar (Sol X of 10, Crew Health, Net Power, NASA Data)
//  2. 3 Large Tactile Power Sliders & Steppers (Life Support, Shield, Reserve)
//  3. Shared 100 MW Power Budget with dynamic pool bar & presets
//  4. Live Consequence Preview with real-time color-coded deltas & arrows
//  5. High-contrast "Commit & Advance Turn" button
// ============================================================
import React, { useState, useMemo, useCallback } from "react";
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
  Volume2,
  VolumeX,
  HelpCircle,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import AmbientAudioModal from "./AmbientAudioModal";
import { soundEffects, useSoundMuted } from "../utils/soundEffects";
import type {
  SubsystemState,
  SubsystemId,
  PowerAllocation,
  CrewState,
} from "../engine/simulationEngine";
import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";
import { TOTAL_TURNS } from "../data/nasaConstants";
import {
  DIFFICULTY_PRESETS,
  type DifficultyTier,
} from "../data/difficultyTiers";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import PwaNavButton from "./PwaNavButton";

export interface ControlDeckProps {
  environment: MissionEnvironment;
  difficulty?: DifficultyTier;
  currentTurn: number; // 1 to 10
  totalTurns?: number;
  effectiveBudgetMW: number;
  subsystems: Record<SubsystemId, SubsystemState>;
  crew: CrewState;
  allocation: PowerAllocation;
  onAllocationChange: (allocation: PowerAllocation) => void;
  onCommitTurn: () => void;
  onShowNasaData: () => void;
  onOpenTutorial?: () => void;
  currentEvent?: TurnEvent;
  isProcessing?: boolean;
  children?: React.ReactNode; // Optional slot for OutpostVisualizer
}

export default function ControlDeck({
  environment,
  difficulty = "commander",
  currentTurn,
  totalTurns = TOTAL_TURNS,
  effectiveBudgetMW,
  subsystems,
  crew,
  allocation,
  onAllocationChange,
  onCommitTurn,
  onShowNasaData,
  onOpenTutorial,
  currentEvent,
  isProcessing = false,
  children,
}: ControlDeckProps) {
  const { t } = useTranslation();
  const [isMuted, toggleMute] = useSoundMuted();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const config = DIFFICULTY_PRESETS[difficulty];
  const baselines = config.baselinePowerDemands;

  const totalAllocated =
    allocation.powerGrid + allocation.lifeSupport + allocation.radiationShielding;
  const netPowerMW = effectiveBudgetMW - totalAllocated;
  const isOverBudget = netPowerMW < 0;

  // Real-time projected deltas before committing
  const projections = useMemo(() => {
    const stressFactor = currentEvent?.lifeSupportStressFactor ?? 1.0;
    const radMultiplier = currentEvent?.radiationSpikeMultiplier ?? 1.0;

    // 1. Life support & O2/Food
    const lsExcess = Math.max(0, allocation.lifeSupport - baselines.lifeSupport);
    const lsDeficit = Math.max(0, baselines.lifeSupport - allocation.lifeSupport);
    const o2Delta = Math.round(
      (lsExcess * 2 - lsDeficit * 4 * config.oxygenLossRateMultiplier) * stressFactor
    );
    const foodDeltaDays =
      Math.round((lsExcess * 0.08 - config.foodConsumptionPerTurn) * 10) / 10;
    const lsHealthDelta = Math.round(
      (lsExcess * 1.4 * config.recoveryMultiplier -
        lsDeficit * 2.5 * config.deficitPenaltyMultiplier) *
        (1 / stressFactor)
    );

    // 2. Shielding
    const rsExcess = Math.max(0, allocation.radiationShielding - baselines.radiationShielding);
    const rsDeficit = Math.max(0, baselines.radiationShielding - allocation.radiationShielding);
    const shieldHealthDelta = Math.round(
      rsExcess * 1.4 * config.recoveryMultiplier -
        rsDeficit * 2.5 * config.deficitPenaltyMultiplier
    );

    // Projected daily radiation dose
    const currentShieldHealth = Math.max(
      0,
      Math.min(100, subsystems.radiationShielding.health + shieldHealthDelta)
    );
    const projectedDoseMSv =
      Math.round(
        environment.baselineDailyRadiationMSv *
          radMultiplier *
          config.radiationDamageMultiplier *
          (1 - (currentShieldHealth / 100) * 0.85) *
          100
      ) / 100;

    // 3. Power Grid / Battery
    const pgExcess = Math.max(0, allocation.powerGrid - baselines.powerGrid);
    const pgDeficit = Math.max(0, baselines.powerGrid - allocation.powerGrid);
    const gridHealthDelta = Math.round(
      pgExcess * 1.4 * config.recoveryMultiplier -
        pgDeficit * 2.5 * config.deficitPenaltyMultiplier
    );

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
    baselines,
    config,
  ]);

  // Tactile slider / stepper helper
  const handleUpdate = useCallback(
    (channel: SubsystemId, newValue: number) => {
      const clamped = Math.max(0, Math.min(effectiveBudgetMW, Math.round(newValue)));
      soundEffects.playSliderClick(clamped);
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
      soundEffects.playSliderClick(current + delta);
      handleUpdate(channel, current + delta);
    },
    [allocation, handleUpdate]
  );

  // Quick preset allocations
  const applyPreset = useCallback(
    (type: "balanced" | "lifeSupport" | "shield" | "batteries") => {
      soundEffects.playSliderClick(50);
      let next: PowerAllocation;
      if (type === "balanced") {
        const ls = Math.min(baselines.lifeSupport, Math.round(effectiveBudgetMW * 0.38));
        const rs = Math.min(baselines.radiationShielding, Math.round(effectiveBudgetMW * 0.34));
        const pg = Math.max(0, effectiveBudgetMW - ls - rs);
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      } else if (type === "lifeSupport") {
        const ls = Math.min(effectiveBudgetMW, baselines.lifeSupport + 12);
        const rem = effectiveBudgetMW - ls;
        const rs = Math.round(rem * 0.55);
        const pg = Math.max(0, rem - rs);
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      } else if (type === "shield") {
        const rs = Math.min(effectiveBudgetMW, baselines.radiationShielding + 14);
        const rem = effectiveBudgetMW - rs;
        const ls = Math.round(rem * 0.6);
        const pg = Math.max(0, rem - ls);
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      } else {
        const pg = Math.min(effectiveBudgetMW, baselines.powerGrid + 14);
        const rem = effectiveBudgetMW - pg;
        const ls = Math.round(rem * 0.55);
        const rs = Math.max(0, rem - ls);
        next = { lifeSupport: ls, radiationShielding: rs, powerGrid: pg };
      }
      onAllocationChange(next);
    },
    [effectiveBudgetMW, onAllocationChange, baselines]
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 text-slate-100 select-none">
      {/* 1. TOP TELEMETRY BAR */}
      <div
        data-tutorial="incident-alerts"
        className="w-full rounded-2xl bg-[#0B1120] border border-cyan-900/40 p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3"
      >
        {/* Sol progress */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1D4ED8] to-[#06B6D4] flex items-center justify-center font-black text-white text-base shadow-md">
            S{currentTurn}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#06B6D4] uppercase">
                {t("game.solIndicator", { current: currentTurn, total: totalTurns })}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono flex items-center gap-1"
                style={{
                  backgroundColor: `${config.accentColor}25`,
                  color: config.accentColor,
                  border: `1px solid ${config.accentColor}50`,
                }}
              >
                <span>{config.emoji}</span>
                <span>{t(`difficulties.${difficulty}.title`)}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold hidden sm:inline">
                {t(`destinations.${environment.id === "lunar_south_pole" ? "moon" : "mars"}.name`)}
              </span>
            </div>
            <p className="text-sm font-black text-white leading-tight">
              {currentEvent?.id && t(`events.${currentEvent.id}.label`) !== `events.${currentEvent.id}.label`
                ? t(`events.${currentEvent.id}.label`)
                : (currentEvent?.label ?? `Sol ${currentTurn}`)}
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
              {t("game.crewMorale")} & {t("game.oxygenBuffer")}
            </p>
            <p className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>{crew.morale}% {t("game.crewMorale")}</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400">{crew.oxygenBufferPercent}% O₂</span>
            </p>
          </div>
        </div>

        {/* Strict 500 mSv NASA Career Limit (Flight Director mode) */}
        {difficulty === "flight_director" && (
          <div className="flex items-center gap-2.5 bg-amber-950/40 border border-amber-600/40 rounded-xl px-3 py-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-amber-300 uppercase tracking-tight">
                {t("game.safeLimit", { limit: 500 })}
              </p>
              <p className="text-xs sm:text-sm font-black font-mono text-white">
                <span
                  className={
                    crew.careerRadiationExposureMSv > 500
                      ? "text-red-400 animate-pulse"
                      : crew.careerRadiationExposureMSv > 400
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                >
                  {crew.careerRadiationExposureMSv.toFixed(1)}
                </span>
                <span className="text-slate-400 font-normal"> / 500 mSv</span>
              </p>
            </div>
          </div>
        )}

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
              {t("game.powerBudget")}
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

        <div className="flex items-center gap-2">
          {/* PWA Install / Classroom Offline Pill */}
          <PwaNavButton />

          {/* Multi-Language Selector */}
          <LanguageSelector compact />

          {/* Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              isMuted
                ? "bg-rose-950/40 border-rose-600/40 text-rose-300 hover:bg-rose-900/40"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300"
            }`}
            title={isMuted ? "Audio Muted (Click to Unmute)" : "Audio Active (Click to Mute)"}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline">{isMuted ? t("common.muted") : t("common.sound")}</span>
          </button>

          {/* Procedural Space Audio Synthesizer Deck Modal Trigger */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playButtonClick();
              setIsAudioModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-700/50 hover:border-cyan-400 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 text-xs font-mono font-bold transition-all shadow-sm shadow-cyan-950/50"
            title="Acoustic Telemetry & Procedural Audio Deck"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden md:inline">{t("common.ambientAudio") || "Ambient Audio"}</span>
          </button>

          {/* Tutorial / Help Button */}
          {onOpenTutorial && (
            <button
              type="button"
              onClick={onOpenTutorial}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-xs font-bold"
              title="Launch 3-Step Mission Tutorial"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="hidden sm:inline">{t("common.howToPlay")}</span>
            </button>
          )}

          {/* NASA Data Button */}
          <button
            type="button"
            onClick={onShowNasaData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-xs font-bold"
            title="Inspect Real NASA Science Instrument Data"
          >
            <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>{t("common.nasaData")}</span>
          </button>
        </div>
      </div>

      {/* Optional Child Slot (e.g. OutpostVisualizer Cross-Section) */}
      {children && <div className="w-full">{children}</div>}

      {/* 2. POWER BUDGET POOL BAR & PRESET BUTTONS */}
      <div
        data-tutorial="power-budget"
        className="w-full rounded-2xl bg-[#0B1120] border border-cyan-900/40 p-4 shadow-xl flex flex-col gap-3"
      >
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
              Baseline demand: <strong>{baselines.lifeSupport} MW</strong>. Keeps oxygen flowing and
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
                <span className="text-emerald-400 font-bold">{baselines.lifeSupport} MW Target</span>
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
              Baseline demand: <strong>{baselines.radiationShielding} MW</strong>. Repels cosmic rays, solar flares,
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
                <span className="text-cyan-400 font-bold">{baselines.radiationShielding} MW Target</span>
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
              Baseline demand: <strong>{baselines.powerGrid} MW</strong>. Charges backup cells for dust
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
                <span className="text-blue-400 font-bold">{baselines.powerGrid} MW Target</span>
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
      <div
        data-tutorial="tradeoff-arrows"
        className="w-full rounded-2xl bg-[#0B1120] border-2 border-cyan-800/40 p-4 sm:p-5 shadow-2xl flex flex-col gap-4"
      >
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

        {/* Real-time Guidance / Takeaway Note */}
        <div className="text-xs text-slate-300 bg-white/5 rounded-xl p-3 border border-white/5 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isOverBudget ? (
              <span className="text-rose-400 font-bold">
                Warning: You allocated more than the {effectiveBudgetMW} MW available!
                Reduce power on one system so your grid doesn't brown out.
              </span>
            ) : allocation.lifeSupport < baselines.lifeSupport - 4 ? (
              <span className="text-amber-300">
                Life Support is under-budget (&lt;{baselines.lifeSupport} MW)! Crew will consume backup oxygen tanks and crops will wilt.
              </span>
            ) : allocation.radiationShielding < baselines.radiationShielding - 4 ? (
              <span className="text-amber-300">
                Shielding is thin (&lt;{baselines.radiationShielding} MW)! Space radiation will penetrate the habitat.
                {difficulty === "flight_director" && " ⚠️ Low active thermal loop power accelerates structural thermal fatigue!"}
              </span>
            ) : (
              <span className="text-emerald-300">
                Power is well distributed! Systems will hold steady through Sol {currentTurn}.
                {difficulty === "flight_director" && " Thermal loop active; fatigue minimized."}
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
              {t("game.simulating")}
            </span>
          ) : (
            <>
              <span>{t("game.lockInAllocation", { sol: currentTurn })}</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>

      {/* Procedural Space Audio Synthesizer Deck Modal */}
      <AmbientAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        environmentName={environment.name}
      />
    </div>
  );
}
