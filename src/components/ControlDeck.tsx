// ============================================================
// ControlDeck.tsx — Outpost Commander Primary Interactive Deck
// Features:
//  1. Top Telemetry Bar (Sol X of 10, Crew Health, Net Power, NASA Data)
//  2. 3 Large Tactile Power Sliders & Steppers (Life Support, Shield, Reserve)
//  3. Shared 100 MW Power Budget with dynamic pool bar & presets
//  4. Live Consequence Preview with real-time color-coded deltas & arrows
//  5. High-contrast "Commit & Advance Turn" button
// ============================================================
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  Search,
  Radio,
  Eye,
} from "lucide-react";
import AmbientAudioModal from "./AmbientAudioModal";
import EducatorHubModal from "./EducatorHubModal";
import CrewPanel from "./CrewPanel";
import CrewCommsBubble from "./CrewCommsBubble";
import { useAccessibility } from "../utils/AccessibilityContext";
import {
  evaluatePowerAdjustmentDialogue,
  getSolAdvanceDialogue,
  type CommsDialogue,
} from "../data/crewDialogue";
import { soundEffects, useSoundMuted } from "../utils/soundEffects";
import type {
  SubsystemState,
  SubsystemId,
  PowerAllocation,
  CrewState,
} from "../engine/simulationEngine";
import type { MissionEnvironment, TurnEvent } from "../data/nasaConstants";
import {
  TOTAL_TURNS,
  GREENHOUSE_BASELINE_POWER_MW,
  GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW,
  GREENHOUSE_THERMAL_SHOCK_PROGRESS_PENALTY,
  HARVEST_CYCLE_SOLS,
  HARVEST_FOOD_RESERVE_DAYS_BONUS,
  DAILY_CREW_CALORIC_DEMAND,
} from "../data/nasaConstants";
import {
  DIFFICULTY_PRESETS,
  type DifficultyTier,
} from "../data/difficultyTiers";
import type { HistoricScenario } from "../data/scenarioData";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import PwaNavButton from "./PwaNavButton";
import { JudgeDemoNavPill } from "./JudgeDemoBar";

export interface ControlDeckProps {
  environment: MissionEnvironment;
  difficulty?: DifficultyTier;
  missionSeed?: string;
  scenario?: HistoricScenario;
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
  onOpenCrewRoster?: () => void;
  onInspectRootCause?: (type: "brownout" | "life_support" | "radiation_shield") => void;
  onToggleDemoBar?: () => void;
  isDemoBarOpen?: boolean;
  currentEvent?: TurnEvent;
  isProcessing?: boolean;
  children?: React.ReactNode; // Optional slot for OutpostVisualizer
}

export default function ControlDeck({
  environment,
  difficulty = "commander",
  missionSeed,
  scenario,
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
  onOpenCrewRoster,
  onInspectRootCause,
  onToggleDemoBar,
  isDemoBarOpen,
  currentEvent,
  isProcessing = false,
  children,
}: ControlDeckProps) {
  const { t } = useTranslation();
  const [isMuted, toggleMute] = useSoundMuted();
  const { colorblindMode, toggleColorblindMode, tokens, shapes } = useAccessibility();
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [isEducatorHubOpen, setIsEducatorHubOpen] = useState(false);

  // Dynamic Crew Radio Dialogue State
  const [activeDialogue, setActiveDialogue] = useState<CommsDialogue | null>(null);
  const [lastAdjustedChannel, setLastAdjustedChannel] = useState<SubsystemId | undefined>(undefined);
  const lastEvaluatedIdRef = useRef<string | null>(null);
  const lastTurnRef = useRef<number>(-1);

  // 1. Sol Advance Check-In Effect
  useEffect(() => {
    if (lastTurnRef.current !== currentTurn) {
      lastTurnRef.current = currentTurn;
      const solDialogue = getSolAdvanceDialogue(currentTurn, environment, currentEvent, crew);
      setActiveDialogue(solDialogue);
      lastEvaluatedIdRef.current = solDialogue.id;
    }
  }, [currentTurn, environment, currentEvent, crew]);

  // 2. Reactive Power Adjustment Dialogue Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const dialogue = evaluatePowerAdjustmentDialogue({
        allocation,
        lastAdjustedChannel,
        subsystems,
        crew,
        currentTurn,
        effectiveBudgetMW,
        currentEvent,
        environment,
      });

      if (dialogue) {
        if (dialogue.id !== lastEvaluatedIdRef.current) {
          lastEvaluatedIdRef.current = dialogue.id;
          setActiveDialogue(dialogue);
        }
      } else {
        lastEvaluatedIdRef.current = null;
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [
    allocation,
    lastAdjustedChannel,
    subsystems,
    crew,
    currentTurn,
    effectiveBudgetMW,
    currentEvent,
    environment,
  ]);

  const config = DIFFICULTY_PRESETS[difficulty];
  const baselines = config.baselinePowerDemands;

  const totalAllocated =
    allocation.powerGrid +
    allocation.lifeSupport +
    allocation.radiationShielding +
    allocation.foodProduction;
  const netPowerMW = effectiveBudgetMW - totalAllocated;
  const isOverBudget = netPowerMW < 0;

  // Real-time projected deltas before committing
  const projections = useMemo(() => {
    const stressFactor = currentEvent?.lifeSupportStressFactor ?? 1.0;
    const radMultiplier = currentEvent?.radiationSpikeMultiplier ?? 1.0;

    // 1. Life support (O2 & atmospheric loop)
    const lsExcess = Math.max(0, allocation.lifeSupport - baselines.lifeSupport);
    const lsDeficit = Math.max(0, baselines.lifeSupport - allocation.lifeSupport);
    const o2Delta = Math.round(
      (lsExcess * 2 - lsDeficit * 4 * config.oxygenLossRateMultiplier) * stressFactor
    );
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

    // 4. Hydroponic Bay / Food Production & Agronomy
    const ghExcess = Math.max(0, allocation.foodProduction - baselines.foodProduction);
    const ghDeficit = Math.max(0, baselines.foodProduction - allocation.foodProduction);
    const foodHealthDelta = Math.round(
      ghExcess * 1.4 * config.recoveryMultiplier -
        ghDeficit * 2.5 * config.deficitPenaltyMultiplier
    );

    const isThermalShock = allocation.foodProduction < GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW;
    let growthDeltaPercent = 0;
    if (isThermalShock) {
      growthDeltaPercent = -GREENHOUSE_THERMAL_SHOCK_PROGRESS_PENALTY;
    } else if (allocation.foodProduction >= GREENHOUSE_BASELINE_POWER_MW) {
      const baseProgress = 100 / HARVEST_CYCLE_SOLS;
      const powerBoost = Math.min(
        1.35,
        1 + ((allocation.foodProduction - GREENHOUSE_BASELINE_POWER_MW) / GREENHOUSE_BASELINE_POWER_MW) * 0.35
      );
      growthDeltaPercent = Math.round(baseProgress * powerBoost * 10) / 10;
    } else {
      const powerRatio = allocation.foodProduction / GREENHOUSE_BASELINE_POWER_MW;
      growthDeltaPercent = Math.round((100 / HARVEST_CYCLE_SOLS) * powerRatio * 0.7 * 10) / 10;
    }

    const currentCropProgress = crew.cropGrowthProgressPercent ?? 0;
    const projectedCropProgress = Math.max(0, Math.min(100, currentCropProgress + growthDeltaPercent));
    const willHarvest = currentCropProgress + growthDeltaPercent >= 100;

    let harvestStatusText = "Stalled (Thermal Shock ❄️)";
    let solsToHarvest = -1;
    if (willHarvest) {
      harvestStatusText = "Ready this Sol! 🌾";
      solsToHarvest = 0;
    } else if (growthDeltaPercent > 0) {
      solsToHarvest = Math.max(1, Math.ceil((100 - currentCropProgress) / growthDeltaPercent));
      harvestStatusText = `~${solsToHarvest} Sol${solsToHarvest > 1 ? "s" : ""}`;
    }

    const foodDeltaDays = willHarvest
      ? HARVEST_FOOD_RESERVE_DAYS_BONUS - config.foodConsumptionPerTurn
      : -config.foodConsumptionPerTurn;
    const projectedFoodReserveDays = Math.max(
      0,
      Math.min(30, Math.round(((crew.foodReserveDays ?? 15) + foodDeltaDays) * 10) / 10)
    );
    const projectedTotalKcal = Math.round(projectedFoodReserveDays * DAILY_CREW_CALORIC_DEMAND);

    // 5. Crew Morale Projection
    let moraleTrend: "up" | "down" | "flat" = "flat";
    if (lsHealthDelta >= 0 && shieldHealthDelta >= 0 && foodHealthDelta >= 0 && !isOverBudget && !isThermalShock) {
      moraleTrend = "up";
    } else if (lsDeficit > 8 || rsDeficit > 8 || ghDeficit > 8 || isOverBudget || isThermalShock) {
      moraleTrend = "down";
    }

    return {
      o2Delta,
      foodDeltaDays,
      lsHealthDelta,
      shieldHealthDelta,
      projectedDoseMSv,
      gridHealthDelta,
      foodHealthDelta,
      isThermalShock,
      growthDeltaPercent,
      currentCropProgress,
      projectedCropProgress,
      willHarvest,
      solsToHarvest,
      harvestStatusText,
      projectedFoodReserveDays,
      projectedTotalKcal,
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
    crew,
  ]);

  // Tactile slider / stepper helper
  const handleUpdate = useCallback(
    (channel: SubsystemId, newValue: number) => {
      const clamped = Math.max(0, Math.min(effectiveBudgetMW, Math.round(newValue)));
      soundEffects.playSliderClick(clamped);
      setLastAdjustedChannel(channel);
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
      setLastAdjustedChannel(channel);
      handleUpdate(channel, current + delta);
    },
    [allocation, handleUpdate]
  );

  // Quick preset allocations (4-way operational configurations)
  const applyPreset = useCallback(
    (type: "balanced" | "stormDefense" | "harvestPush" | "maxReserves") => {
      soundEffects.playSliderClick(50);
      let target: PowerAllocation;
      if (type === "balanced") {
        setLastAdjustedChannel("lifeSupport");
        target = { powerGrid: 25, lifeSupport: 25, radiationShielding: 25, foodProduction: 25 };
      } else if (type === "stormDefense") {
        setLastAdjustedChannel("radiationShielding");
        target = { powerGrid: 15, lifeSupport: 20, radiationShielding: 55, foodProduction: 10 };
      } else if (type === "harvestPush") {
        setLastAdjustedChannel("foodProduction");
        target = { powerGrid: 15, lifeSupport: 25, radiationShielding: 15, foodProduction: 45 };
      } else {
        setLastAdjustedChannel("powerGrid");
        target = { powerGrid: 50, lifeSupport: 20, radiationShielding: 15, foodProduction: 15 };
      }

      if (effectiveBudgetMW === 100) {
        onAllocationChange(target);
        return;
      }

      // Proportional scale if budget deviates from 100 MW (e.g. storm or eclipse)
      const scale = effectiveBudgetMW / 100;
      let pg = Math.round(target.powerGrid * scale);
      let ls = Math.round(target.lifeSupport * scale);
      let rs = Math.round(target.radiationShielding * scale);
      let fp = Math.round(target.foodProduction * scale);
      const diff = effectiveBudgetMW - (pg + ls + rs + fp);
      fp += diff;
      onAllocationChange({
        powerGrid: Math.max(0, pg),
        lifeSupport: Math.max(0, ls),
        radiationShielding: Math.max(0, rs),
        foodProduction: Math.max(0, fp),
      });
    },
    [effectiveBudgetMW, onAllocationChange]
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 text-slate-100 select-none">
      {/* 1. TOP TELEMETRY BAR */}
      <div
        data-tutorial="incident-alerts"
        className="w-full rounded-2xl bg-[#0B1120] border border-cyan-900/40 p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 relative z-30"
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
              {scenario ? (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono flex items-center gap-1 border shadow-sm"
                  style={{
                    backgroundColor: `${scenario.accentColor}25`,
                    color: scenario.accentColor,
                    borderColor: `${scenario.accentColor}60`,
                  }}
                  title={`NASA Scenario: ${scenario.title} — ${scenario.survivalChallenge}`}
                >
                  <span>{scenario.emoji}</span>
                  <span>{scenario.shortTitle}</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold hidden sm:inline">
                  {environment.id === "lunar_south_pole"
                    ? t("destinations.moon.name")
                    : environment.id === "mars_gale_crater"
                    ? t("destinations.mars.name")
                    : environment.name}
                </span>
              )}
              {missionSeed && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 font-mono font-bold"
                  title="Classroom Mission Seed"
                >
                  #{missionSeed}
                </span>
              )}
            </div>
            <p className="text-sm font-black text-white leading-tight">
              {currentEvent?.id && t(`events.${currentEvent.id}.label`) !== `events.${currentEvent.id}.label`
                ? t(`events.${currentEvent.id}.label`)
                : (currentEvent?.label ?? `Sol ${currentTurn}`)}
            </p>
          </div>
        </div>

        {/* Crew Health & Morale with 4 Specialists */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playButtonClick();
            if (onOpenCrewRoster) {
              onOpenCrewRoster();
            } else {
              setIsCrewModalOpen(true);
            }
          }}
          className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl px-3 py-2 transition-all cursor-pointer text-left group"
          title="Click to view 4 Astronaut Specialists & Morale Dossier"
        >
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-mono text-slate-400 uppercase">
                {t("game.crewMorale")} & {t("game.oxygenBuffer")}
              </p>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/40">
                4 Specialists 👨‍🚀
              </span>
            </div>
            <p className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>{crew.morale}% {t("game.crewMorale")}</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400">{crew.oxygenBufferPercent}% O₂</span>
            </p>
          </div>
        </button>

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
          {/* Subtle Judge Express Demo Bar Pill */}
          {onToggleDemoBar && (
            <JudgeDemoNavPill onClick={onToggleDemoBar} isOpen={isDemoBarOpen} />
          )}

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

          {/* Vision / Accessibility High-Contrast & Colorblind-Safe Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playButtonClick();
              toggleColorblindMode();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              colorblindMode
                ? "bg-sky-950/70 border-sky-400 text-sky-200 shadow-sm shadow-sky-950/50 ring-1 ring-sky-400/40"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-sky-500/40 text-slate-300 hover:text-sky-300"
            }`}
            title={
              colorblindMode
                ? "Vision / Accessibility: Colorblind-Safe Mode ACTIVE (Click to switch to Standard)"
                : "Vision / Accessibility: Enable Colorblind-Safe & High-Contrast Mode"
            }
            aria-pressed={colorblindMode}
            aria-label="Vision and Accessibility: Toggle Colorblind-Safe Mode"
          >
            <Eye className={`w-3.5 h-3.5 ${colorblindMode ? "text-sky-400" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Vision / Accessibility</span>
            {colorblindMode && (
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1 py-0.2 rounded font-mono font-bold">
                {shapes.nominal} SAFE
              </span>
            )}
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

          {/* Crew Radio Comms Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playButtonClick();
              const checkin = getSolAdvanceDialogue(currentTurn, environment, currentEvent, crew);
              setActiveDialogue(checkin);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-all text-xs font-bold"
            title="Check-in with Habitat Crew Radio"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Crew Radio</span>
          </button>

          {/* Educator Hub & NGSS Curriculum Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              soundEffects.playButtonClick();
              setIsEducatorHubOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-600/50 hover:border-amber-400 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-mono font-bold transition-all shadow-sm shadow-amber-950/40 cursor-pointer"
            title="Educator Hub: 45-Min Lesson Plan, NGSS Alignment & Teacher Prompts"
          >
            <span className="text-sm">🍎</span>
            <span className="hidden lg:inline">For Teachers / NGSS</span>
            <span className="lg:hidden">NGSS</span>
          </motion.button>

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

      {/* Dynamic Comic Radio Comms Bubble from Crew Members */}
      {activeDialogue && (
        <div className="w-full">
          <CrewCommsBubble
            dialogue={activeDialogue}
            onDismiss={() => setActiveDialogue(null)}
          />
        </div>
      )}

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
              (Allocated: <strong className="text-white">{totalAllocated} MW</strong>
              {" · "}
              <span
                className={`font-mono font-bold ${
                  isOverBudget
                    ? tokens.dangerText
                    : netPowerMW > 0
                    ? tokens.surplusText
                    : tokens.nominalText
                }`}
              >
                {isOverBudget
                  ? `${shapes.brownout} ${Math.abs(netPowerMW)} MW Deficit`
                  : netPowerMW > 0
                  ? `${shapes.surplus} +${netPowerMW} MW Surplus`
                  : `${shapes.nominal} Balanced`}
              </span>
              )
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
              title="Balanced: 25 Power / 25 ECLSS / 25 Shields / 25 Food"
            >
              ⚖️ Balanced
            </button>
            <button
              type="button"
              onClick={() => applyPreset("stormDefense")}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/60 text-[11px] font-bold text-indigo-300 transition-colors"
              title="Storm Defense: 15 Power / 20 ECLSS / 55 Shields / 10 Food"
            >
              🛡️ Storm Defense
            </button>
            <button
              type="button"
              onClick={() => applyPreset("harvestPush")}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                colorblindMode
                  ? "bg-sky-950/60 border-sky-700/50 hover:bg-sky-900/60 text-sky-300"
                  : "bg-emerald-950/60 border-emerald-700/50 hover:bg-emerald-900/60 text-emerald-300"
              }`}
              title="Harvest Push: 15 Power / 25 ECLSS / 15 Shields / 45 Food"
            >
              🌾 Harvest Push
            </button>
            <button
              type="button"
              onClick={() => applyPreset("maxReserves")}
              className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-700/50 hover:bg-blue-900/60 text-[11px] font-bold text-blue-300 transition-colors"
              title="Maximum Reserves: 50 Power / 20 ECLSS / 15 Shields / 15 Food"
            >
              🔋 Max Reserves
            </button>
          </div>
        </div>

        {/* Dynamic Multi-segment Power Bar */}
        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex shadow-inner">
          {/* Battery / Grid segment */}
          <div
            className="h-full bg-[#1D4ED8] transition-all duration-200"
            style={{
              width: `${Math.min(
                100,
                (allocation.powerGrid / effectiveBudgetMW) * 100
              )}%`,
            }}
            title={`Power Grid: ${allocation.powerGrid} MW`}
          />
          {/* Life Support segment */}
          <div
            className="h-full bg-[#06B6D4] transition-all duration-200"
            style={{
              width: `${Math.min(100, (allocation.lifeSupport / effectiveBudgetMW) * 100)}%`,
            }}
            title={`Life Support (ECLSS): ${allocation.lifeSupport} MW`}
          />
          {/* Shielding segment */}
          <div
            className="h-full bg-[#6366F1] transition-all duration-200"
            style={{
              width: `${Math.min(
                100,
                (allocation.radiationShielding / effectiveBudgetMW) * 100
              )}%`,
            }}
            title={`Shielding: ${allocation.radiationShielding} MW`}
          />
          {/* Food Production segment */}
          <div
            className={`h-full transition-all duration-200 ${
              colorblindMode ? "bg-[#0284c7]" : "bg-emerald-500"
            }`}
            style={{
              width: `${Math.min(
                100,
                (allocation.foodProduction / effectiveBudgetMW) * 100
              )}%`,
            }}
            title={`Food Production (Greenhouse): ${allocation.foodProduction} MW`}
          />
          {/* Over-budget indicator if over */}
          {isOverBudget && (
            <div
              className={`h-full animate-pulse flex-1 ${
                colorblindMode ? "bg-[#f97316]" : "bg-rose-500"
              }`}
              title="OVER BUDGET"
            />
          )}
        </div>

        {/* Over-budget Brownout Warning Banner with "Inspect Root Cause" button */}
        {isOverBudget && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className={`p-3.5 rounded-xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl ${
              colorblindMode
                ? "bg-gradient-to-r from-orange-950/90 via-amber-950/80 to-slate-900 border-orange-500/80 text-orange-200 shadow-orange-950/70"
                : "bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-900 border-red-500/70 text-red-200 shadow-red-950/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-md font-mono font-bold ${
                  colorblindMode
                    ? "bg-orange-500/25 text-orange-300 border-orange-500/50"
                    : "bg-red-500/25 text-red-400 border-red-500/50"
                }`}
              >
                {colorblindMode ? (
                  <span className="text-base">{shapes.brownout}</span>
                ) : (
                  <Zap className="w-5 h-5 animate-bounce" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      colorblindMode ? "text-orange-200" : "text-red-300"
                    }`}
                  >
                    {shapes.brownout} ⚡ BROWNOUT COLLAPSE HAZARD DETECTED
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      colorblindMode
                        ? "bg-orange-900/80 text-orange-100 border border-orange-500/50"
                        : "bg-red-900/70 text-red-200"
                    }`}
                  >
                    {shapes.deficit} {Math.abs(netPowerMW)} MW Deficit
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  Allocating {totalAllocated} MW exceeds generator capacity ({effectiveBudgetMW} MW).
                  Drawing more power than available trips the main bus and triggers system-wide brownouts!
                </p>
              </div>
            </div>

            {onInspectRootCause && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playButtonClick();
                  onInspectRootCause("brownout");
                }}
                className={`px-3.5 py-2 rounded-xl hover:brightness-110 active:scale-95 text-white font-mono font-black text-xs flex items-center gap-2 shadow-lg shrink-0 transition-all border ${
                  colorblindMode
                    ? "bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 border-orange-300/40 shadow-orange-950/70"
                    : "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 border-red-300/40 shadow-red-950/70"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>{shapes.brownout} Inspect Root Cause</span>
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Screen Reader ARIA Live Region for Power Slider Adjustments */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        id="control-deck-aria-live-status"
      >
        {lastAdjustedChannel
          ? `${
              lastAdjustedChannel === "powerGrid"
                ? "Power Grid"
                : lastAdjustedChannel === "lifeSupport"
                ? "Life Support"
                : lastAdjustedChannel === "radiationShielding"
                ? "Radiation Shield"
                : "Hydroponic Bay Food Production"
            } adjusted to ${allocation[lastAdjustedChannel]} Megawatts. Total allocation is ${totalAllocated} of ${effectiveBudgetMW} MW. ${
              isOverBudget
                ? `Hazard: Brownout deficit of ${Math.abs(netPowerMW)} MW.`
                : netPowerMW > 0
                ? `Surplus reserve is ${netPowerMW} MW.`
                : "Power allocation is fully balanced."
            }`
          : `Power allocation: ${totalAllocated} of ${effectiveBudgetMW} MW.`}
      </div>

      {/* 3. FOUR LARGE TACTILE POWER ALLOCATION CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CHANNEL 1: POWER GRID & BATTERY RESERVES */}
        <div className="rounded-2xl bg-[#0B1120] border-2 border-blue-900/50 hover:border-blue-600/60 transition-all p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Battery className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Power Grid</h3>
                  <p className="text-[11px] text-blue-300">Battery & Solar Bus</p>
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
                id="slider-deck-powerGrid"
                type="range"
                min="0"
                max={effectiveBudgetMW}
                step="1"
                value={allocation.powerGrid}
                onChange={(e) => handleUpdate("powerGrid", Number(e.target.value))}
                aria-label="Power Grid and Battery Reserves allocation slider"
                aria-valuenow={allocation.powerGrid}
                aria-valuemin={0}
                aria-valuemax={effectiveBudgetMW}
                aria-valuetext={`Power Grid: ${allocation.powerGrid} MW. Baseline target: ${baselines.powerGrid} MW.`}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              aria-label="Decrease Power Grid by 5 MW"
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5" /> -5 MW
            </button>
            <button
              type="button"
              onClick={() => handleStep("powerGrid", +5)}
              aria-label="Increase Power Grid by 5 MW"
              className="flex-1 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> +5 MW
            </button>
          </div>

          {/* Battery Grid Root Cause Trigger if in low health or overbudget */}
          {onInspectRootCause && (subsystems.powerGrid.health < 45 || isOverBudget) && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onInspectRootCause("brownout");
              }}
              className="mt-2.5 py-1.5 px-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/50 text-amber-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              title="Why is the Power Grid failing? Inspect NASA Power Brownout Root Cause"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspect Power Grid Root Cause</span>
            </button>
          )}
        </div>

        {/* CHANNEL 2: LIFE SUPPORT (ECLSS) */}
        <div className="rounded-2xl bg-[#0B1120] border-2 border-cyan-900/50 hover:border-cyan-500/60 transition-all p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Life Support</h3>
                  <p className="text-[11px] text-cyan-300">O₂ & Water Loop (ECLSS)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#06B6D4]">
                  {allocation.lifeSupport}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">MW</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 bg-white/5 p-2 rounded-xl">
              Baseline demand: <strong>{baselines.lifeSupport} MW</strong>. Powers CO₂ scrubbers and
              closed-loop potable water recovery.
            </p>

            {/* Slider */}
            <div className="mb-4">
              <input
                id="slider-deck-lifeSupport"
                type="range"
                min="0"
                max={effectiveBudgetMW}
                step="1"
                value={allocation.lifeSupport}
                onChange={(e) => handleUpdate("lifeSupport", Number(e.target.value))}
                aria-label="Life Support ECLSS allocation slider"
                aria-valuenow={allocation.lifeSupport}
                aria-valuemin={0}
                aria-valuemax={effectiveBudgetMW}
                aria-valuetext={`Life Support: ${allocation.lifeSupport} MW. Baseline target: ${baselines.lifeSupport} MW.`}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#06B6D4] focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0 MW</span>
                <span className="text-cyan-400 font-bold">{baselines.lifeSupport} MW Target</span>
                <span>{effectiveBudgetMW} MW</span>
              </div>
            </div>
          </div>

          {/* Stepper Buttons for Kids / Tablets */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleStep("lifeSupport", -5)}
              aria-label="Decrease Life Support by 5 MW"
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5" /> -5 MW
            </button>
            <button
              type="button"
              onClick={() => handleStep("lifeSupport", +5)}
              aria-label="Increase Life Support by 5 MW"
              className="flex-1 py-2 rounded-xl bg-[#06B6D4] hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> +5 MW
            </button>
          </div>

          {/* Life Support Root Cause Trigger if in deficit or low health */}
          {onInspectRootCause && (allocation.lifeSupport < baselines.lifeSupport - 4 || subsystems.lifeSupport.health < 45) && (
            <button
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                onInspectRootCause("life_support");
              }}
              className={`mt-2.5 py-1.5 px-2.5 rounded-xl border text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                colorblindMode
                  ? "bg-orange-950/80 hover:bg-orange-900/80 border-orange-500/60 text-orange-200"
                  : "bg-red-950/70 hover:bg-red-900/70 border-red-500/50 text-red-200"
              }`}
              title="Why is Life Support in danger? Inspect NASA ECLSS Root Cause"
            >
              <Search className={`w-3.5 h-3.5 ${colorblindMode ? "text-orange-400" : "text-red-400"}`} />
              <span>{shapes.deficit} Inspect Life Support Root Cause</span>
            </button>
          )}
        </div>

        {/* CHANNEL 3: RADIATION & THERMAL SHIELD */}
        <div className="rounded-2xl bg-[#0B1120] border-2 border-indigo-900/50 hover:border-indigo-500/60 transition-all p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Radiation Shield</h3>
                  <p className="text-[11px] text-indigo-300">Magnetic Field & Regolith</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black font-mono text-indigo-400">
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
                id="slider-deck-radiationShielding"
                type="range"
                min="0"
                max={effectiveBudgetMW}
                step="1"
                value={allocation.radiationShielding}
                onChange={(e) =>
                  handleUpdate("radiationShielding", Number(e.target.value))
                }
                aria-label="Radiation and Thermal Shield allocation slider"
                aria-valuenow={allocation.radiationShielding}
                aria-valuemin={0}
                aria-valuemax={effectiveBudgetMW}
                aria-valuetext={`Radiation Shield: ${allocation.radiationShielding} MW. Baseline target: ${baselines.radiationShielding} MW.`}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0 MW</span>
                <span className="text-indigo-400 font-bold">{baselines.radiationShielding} MW Target</span>
                <span>{effectiveBudgetMW} MW</span>
              </div>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleStep("radiationShielding", -5)}
              aria-label="Decrease Radiation Shielding by 5 MW"
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5" /> -5 MW
            </button>
            <button
              type="button"
              onClick={() => handleStep("radiationShielding", +5)}
              aria-label="Increase Radiation Shielding by 5 MW"
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> +5 MW
            </button>
          </div>
        </div>

        {/* CHANNEL 4: HYDROPONIC BAY / FOOD PRODUCTION */}
        <div
          className={`rounded-2xl bg-[#0B1120] border-2 transition-all p-4 flex flex-col justify-between shadow-xl ${
            colorblindMode
              ? "border-sky-900/50 hover:border-sky-500/60"
              : "border-emerald-900/50 hover:border-emerald-500/60"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    colorblindMode
                      ? "bg-sky-500/20 text-sky-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Hydroponic Bay</h3>
                  <p
                    className={`text-[11px] ${
                      colorblindMode ? "text-sky-300" : "text-emerald-300"
                    }`}
                  >
                    Food Production & Crops
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-xl sm:text-2xl font-black font-mono ${
                    colorblindMode ? "text-[#0284c7] sm:text-sky-400 text-sky-400" : "text-emerald-400"
                  }`}
                >
                  {allocation.foodProduction}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">MW</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3 bg-white/5 p-2 rounded-xl">
              Baseline demand: <strong>{baselines.foodProduction} MW</strong>. Powers LED growth arrays, aeroponic
              nutrient misting, and thermal heaters.
            </p>

            {/* Slider */}
            <div className="mb-4">
              <input
                id="slider-deck-foodProduction"
                type="range"
                min="0"
                max={effectiveBudgetMW}
                step="1"
                value={allocation.foodProduction}
                onChange={(e) => handleUpdate("foodProduction", Number(e.target.value))}
                aria-label="Hydroponic Bay Food Production allocation slider"
                aria-valuenow={allocation.foodProduction}
                aria-valuemin={0}
                aria-valuemax={effectiveBudgetMW}
                aria-valuetext={`Food Production: ${allocation.foodProduction} MW. Baseline target: ${baselines.foodProduction} MW.`}
                className={`w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 ${
                  colorblindMode
                    ? "accent-[#0284c7] focus:ring-sky-400"
                    : "accent-emerald-500 focus:ring-emerald-400"
                }`}
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0 MW</span>
                <span
                  className={`font-bold ${
                    colorblindMode ? "text-sky-400" : "text-emerald-400"
                  }`}
                >
                  {baselines.foodProduction} MW Target
                </span>
                <span>{effectiveBudgetMW} MW</span>
              </div>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleStep("foodProduction", -5)}
              aria-label="Decrease Food Production by 5 MW"
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
            >
              <Minus className="w-3.5 h-3.5" /> -5 MW
            </button>
            <button
              type="button"
              onClick={() => handleStep("foodProduction", +5)}
              aria-label="Increase Food Production by 5 MW"
              className={`flex-1 py-2 rounded-xl active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-md ${
                colorblindMode
                  ? "bg-[#0284c7] hover:bg-sky-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> +5 MW
            </button>
          </div>

          {/* Thermal Shock Alert Badge if < 10 MW */}
          {allocation.foodProduction < GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW && (
            <div
              className={`mt-2.5 py-1.5 px-2.5 rounded-xl border text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse ${
                colorblindMode
                  ? "bg-orange-950/80 border-orange-500/60 text-orange-200"
                  : "bg-rose-950/70 border-rose-500/60 text-rose-300"
              }`}
            >
              <span>{shapes.deficit} ❄️ THERMAL SHOCK RISK (&lt;10 MW)</span>
            </div>
          )}
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

        {/* Delta Badges with Up/Down arrows and Shape Markers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Delta 1: O2 Buffer */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">O₂ Buffer (ECLSS)</p>
              <p className="text-sm font-black text-white mt-0.5 font-mono">
                {projections.o2Delta > 0
                  ? `${shapes.surplus} +${projections.o2Delta}% O₂ Surplus`
                  : projections.o2Delta < 0
                  ? `${shapes.deficit} ${projections.o2Delta}% O₂ Depletion`
                  : `${shapes.nominal} 0% O₂ Stable`}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                ECLSS: {projections.lsHealthDelta >= 0 ? "+" : ""}
                {projections.lsHealthDelta}%
              </p>
            </div>
            <div
              className={`p-2 rounded-xl flex items-center justify-center font-bold ${
                projections.o2Delta > 0
                  ? colorblindMode
                    ? "bg-sky-500/20 text-sky-400"
                    : "bg-cyan-500/20 text-cyan-400"
                  : projections.o2Delta < 0
                  ? colorblindMode
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-rose-500/20 text-rose-400"
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
              <p className="text-sm font-black text-white mt-0.5 font-mono">
                {projections.shieldHealthDelta > 0
                  ? `${shapes.surplus} +${projections.shieldHealthDelta}% Fortified`
                  : projections.shieldHealthDelta < 0
                  ? `${shapes.deficit} ${projections.shieldHealthDelta}% Wear / Breach`
                  : `${shapes.nominal} 0% Stable`}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Dose: ~{projections.projectedDoseMSv} mSv/sol
              </p>
            </div>
            <div
              className={`p-2 rounded-xl flex items-center justify-center font-bold ${
                projections.shieldHealthDelta > 0
                  ? "bg-indigo-500/20 text-indigo-400"
                  : projections.shieldHealthDelta < 0
                  ? colorblindMode
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-rose-500/20 text-rose-400"
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
              <p className="text-sm font-black text-white mt-0.5 font-mono">
                {netPowerMW > 0
                  ? `${shapes.surplus} +${netPowerMW} MW Charging`
                  : netPowerMW < 0
                  ? `${isOverBudget ? shapes.brownout : shapes.deficit} ${netPowerMW} MW Deficit`
                  : `${shapes.nominal} 0 MW Balanced`}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Grid Health: {projections.gridHealthDelta >= 0 ? "+" : ""}
                {projections.gridHealthDelta}%
              </p>
            </div>
            <div
              className={`p-2 rounded-xl flex items-center justify-center font-bold ${
                netPowerMW > 0
                  ? "bg-blue-500/20 text-blue-400"
                  : netPowerMW < 0
                  ? colorblindMode
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-rose-500/20 text-rose-400"
                  : "bg-slate-800 text-slate-400"
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

          {/* Delta 4: Crop Harvest & Food Reserves */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Crop Harvest & Food</p>
              <p className="text-sm font-black text-white mt-0.5 font-mono">
                {projections.isThermalShock
                  ? `${shapes.deficit} ${projections.growthDeltaPercent}% Thermal Shock ❄️`
                  : `${shapes.surplus} +${projections.growthDeltaPercent}% Growth/Sol`}
              </p>
              <p className="text-[10px] text-slate-400">
                Harvest:{" "}
                <strong className={colorblindMode ? "text-sky-300 font-bold" : "text-emerald-300"}>
                  {projections.harvestStatusText}
                </strong>
              </p>
              <p className="text-[9px] text-slate-500 font-mono">
                {projections.projectedFoodReserveDays} Sols (~{projections.projectedTotalKcal.toLocaleString()} kcal)
              </p>
            </div>
            <div
              className={`p-2 rounded-xl flex items-center justify-center font-bold ${
                !projections.isThermalShock && projections.growthDeltaPercent >= 25
                  ? colorblindMode
                    ? "bg-sky-500/20 text-sky-400"
                    : "bg-emerald-500/20 text-emerald-400"
                  : projections.isThermalShock
                  ? colorblindMode
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-rose-500/20 text-rose-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {!projections.isThermalShock && projections.growthDeltaPercent > 0 ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : projections.isThermalShock ? (
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
              <span className={`font-bold ${colorblindMode ? "text-orange-400" : "text-rose-400"}`}>
                {shapes.brownout} Warning: You allocated more than the {effectiveBudgetMW} MW available!
                Reduce power on one system so your grid doesn't brown out.
              </span>
            ) : allocation.foodProduction < GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW ? (
              <span className={`font-bold ${colorblindMode ? "text-orange-400" : "text-rose-400"}`}>
                {shapes.deficit} ❄️ Thermal Shock Hazard! Food Production is under {GREENHOUSE_THERMAL_SHOCK_THRESHOLD_MW} MW.
                Aeroponic crops will freeze and lose 25% growth progress this Sol!
              </span>
            ) : allocation.lifeSupport < baselines.lifeSupport - 4 ? (
              <span className="text-amber-300 font-medium">
                {shapes.deficit} Life Support is under-budget (&lt;{baselines.lifeSupport} MW)! Crew will consume backup oxygen tanks.
              </span>
            ) : allocation.radiationShielding < baselines.radiationShielding - 4 ? (
              <span className="text-amber-300 font-medium">
                {shapes.deficit} Shielding is thin (&lt;{baselines.radiationShielding} MW)! Space radiation will penetrate the habitat.
                {difficulty === "flight_director" && " ⚠️ Low active thermal loop power accelerates structural thermal fatigue!"}
              </span>
            ) : allocation.foodProduction < baselines.foodProduction - 4 ? (
              <span className="text-amber-300 font-medium">
                {shapes.deficit} Food Production is below baseline (&lt;{baselines.foodProduction} MW)! Crop maturity cycle is running at reduced speed.
              </span>
            ) : (
              <span className={`font-medium ${colorblindMode ? "text-sky-300" : "text-emerald-300"}`}>
                {shapes.nominal} Power is well distributed across all 4 subsystems! Systems will hold steady through Sol {currentTurn}.
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

      {/* Dedicated Educator Hub & NGSS Curriculum Modal */}
      <EducatorHubModal
        isOpen={isEducatorHubOpen}
        onClose={() => setIsEducatorHubOpen(false)}
      />

      {/* Astronaut Specialists & Crew Morale Modal */}
      {isCrewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-3xl my-auto">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setIsCrewModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-mono text-xs font-bold border border-slate-700 transition-colors"
              >
                ✕ Close Crew Dossier
              </button>
            </div>
            <CrewPanel crew={crew} />
          </div>
        </div>
      )}
    </div>
  );
}
