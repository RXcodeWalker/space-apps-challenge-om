// ============================================================
// FlightDirectorIntervention.tsx — 15-Second Flight Director Interventions
// Fast-paced tactile micro-puzzles teaching real NASA engineering triage
// under pressure, complete with 15-second countdown, Web Audio ticking,
// accessible Auto-Resolve / Skip for young cadets, and dynamic telemetry.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FastForward,
  Activity,
  Radio,
} from "lucide-react";
import type { IncidentCard } from "../../data/incidentCards";
import {
  type FlightDirectorInterventionResult,
  type InterventionType,
  getIncidentInterventionType,
} from "../../types/intervention";
import { soundEffects } from "../../utils/soundEffects";
import MagneticShieldMinigame from "./MagneticShieldMinigame";
import CircuitBreakerMinigame from "./CircuitBreakerMinigame";
import PerchlorateWashMinigame from "./PerchlorateWashMinigame";

interface FlightDirectorInterventionProps {
  incident: IncidentCard;
  onInterventionComplete: (result: FlightDirectorInterventionResult) => void;
  activeResult?: FlightDirectorInterventionResult | null;
}

export default function FlightDirectorIntervention({
  incident,
  onInterventionComplete,
  activeResult: externalResult,
}: FlightDirectorInterventionProps) {
  const interventionType: InterventionType = getIncidentInterventionType(incident);

  const TOTAL_DURATION_SEC = 15;
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_DURATION_SEC);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [localResult, setLocalResult] = useState<FlightDirectorInterventionResult | null>(
    externalResult || null
  );

  const lastTickedSecondRef = useRef<number>(TOTAL_DURATION_SEC);
  const intervalRef = useRef<number | null>(null);

  // Sync external result
  useEffect(() => {
    if (externalResult) {
      setLocalResult(externalResult);
      setIsTimerRunning(false);
    }
  }, [externalResult]);

  // Clean timer on unmount
  const stopTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTimerRunning(false);
  }, []);

  // Timer loop with sub-second accuracy and 1-second audio tick
  useEffect(() => {
    if (!isTimerRunning || localResult !== null) return;

    lastTickedSecondRef.current = Math.ceil(timeLeft);

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        const currentSecond = Math.ceil(next);

        // Play audio tick whenever a whole second elapses
        if (currentSecond < lastTickedSecondRef.current && next > 0) {
          lastTickedSecondRef.current = currentSecond;
          soundEffects.playCountdownTick(next <= 4.0);
        }

        // Timer expired
        if (next <= 0) {
          stopTimer();
          handleTimeout();
          return 0;
        }

        return Math.round(next * 10) / 10;
      });
    }, 100);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimerRunning, localResult, stopTimer, timeLeft]);

  // Handle Timeout Event (15 seconds expired)
  const handleTimeout = () => {
    soundEffects.playPuzzleFail();
    let timeoutSummary = "";
    let timeoutResult: FlightDirectorInterventionResult;

    if (interventionType === "magnetic_shield") {
      timeoutSummary =
        "15-Second Window Expired: Magnetic deflection vector unaligned before solar proton wave impact. Secondary radiation leak (+1.2 mSv).";
      timeoutResult = {
        interventionType,
        status: "failure",
        telemetrySummary: timeoutSummary,
        shieldEfficiencyBonus: -5,
        radiationLeakMSv: 1.2,
      };
    } else if (interventionType === "circuit_breaker") {
      timeoutSummary =
        "15-Second Window Expired: Distribution bus remained surging at 120 MW! Main transformer breaker tripped (-10% Grid Health, -10 MW Power Penalty).";
      timeoutResult = {
        interventionType,
        status: "failure",
        telemetrySummary: timeoutSummary,
        gridHealthBonus: -10,
        powerDeltaMW: -10,
      };
    } else {
      timeoutSummary =
        "15-Second Window Expired: Chemical reactor wash cycle incomplete. Regolith salts remained partially active (-8% Life Support Health).";
      timeoutResult = {
        interventionType,
        status: "failure",
        telemetrySummary: timeoutSummary,
        lifeSupportDelta: -8,
        foodDaysDelta: -1,
      };
    }

    setLocalResult(timeoutResult);
    onInterventionComplete(timeoutResult);
  };

  // Handle Manual Minigame Resolution (Success or Failure)
  const handleResolve = (res: FlightDirectorInterventionResult) => {
    stopTimer();
    setLocalResult(res);
    onInterventionComplete(res);
  };

  // Handle Automatic "Auto-Resolve / Skip" (Cadet Mode / Screen Readers)
  const handleSkip = () => {
    stopTimer();
    soundEffects.playButtonClick();

    const skippedResult: FlightDirectorInterventionResult = {
      interventionType,
      status: "skipped",
      telemetrySummary:
        "Flight Director Triage Auto-Resolved: Baseline automated stabilization applied with zero penalty. Standard flight directive telemetry active.",
    };

    setLocalResult(skippedResult);
    onInterventionComplete(skippedResult);
  };

  // Handle Reset / Retry
  const handleReset = () => {
    soundEffects.playButtonClick();
    setTimeLeft(TOTAL_DURATION_SEC);
    lastTickedSecondRef.current = TOTAL_DURATION_SEC;
    setLocalResult(null);
    setIsTimerRunning(true);
  };

  // Visual formatting for countdown progress
  const progressPercent = (timeLeft / TOTAL_DURATION_SEC) * 100;
  const isUrgentTime = timeLeft <= 4.0;
  const isWarningTime = timeLeft <= 8.0 && !isUrgentTime;

  return (
    <div className="w-full flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0B0F1A] to-slate-950 border-2 border-cyan-500/40 p-4 shadow-xl relative overflow-hidden">
      {/* Background Tech Watermark */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Emergency Intervention Title & Cadet Skip Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-md bg-red-600 text-[10px] font-mono font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-sm animate-pulse">
            <Radio className="w-3 h-3 text-white" />
            <span>15-SEC FLIGHT INTERVENTION</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            Tactical Engineering Triage
          </span>
        </div>

        {/* Automatic Auto-Resolve / Skip Button (for Younger Cadets & Screen Readers) */}
        <div className="flex items-center gap-2">
          {localResult !== null ? (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
              title="Practice or retry this micro-puzzle"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Retry Triage</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Auto-resolve or skip the 15-second flight director micro-puzzle without penalty. Suitable for younger cadets ages 7 to 9 and screen readers."
              className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-800/60 text-cyan-300 hover:text-cyan-100 text-xs font-mono font-bold flex items-center gap-1.5 border border-cyan-500/40 transition-all hover:scale-102"
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-300" />
              <span>Auto-Resolve / Skip (Cadet Mode)</span>
            </button>
          )}
        </div>
      </div>

      {/* 15-Second Countdown Bar */}
      <div className="bg-black/60 p-2.5 rounded-xl border border-white/10 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Timer
              className={`w-4 h-4 ${
                isUrgentTime
                  ? "text-red-400 animate-spin"
                  : isWarningTime
                  ? "text-amber-400"
                  : "text-cyan-400"
              }`}
            />
            <span>CRITICAL TRIAGE WINDOW:</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`font-mono font-black text-sm tracking-widest ${
                localResult !== null
                  ? "text-slate-400"
                  : isUrgentTime
                  ? "text-red-400 animate-pulse text-base"
                  : isWarningTime
                  ? "text-amber-300"
                  : "text-cyan-300"
              }`}
            >
              {localResult !== null ? "TRIAGE CLOSED" : `${timeLeft.toFixed(1)}s`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">/ 15.0s</span>
          </div>
        </div>

        {/* Animated Countdown Progress Bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
          <motion.div
            initial={false}
            animate={{ width: `${localResult !== null ? 100 : progressPercent}%` }}
            transition={{ ease: "linear", duration: 0.1 }}
            className={`h-full rounded-full transition-colors ${
              localResult !== null
                ? localResult.status === "success"
                  ? "bg-emerald-500 shadow-md shadow-emerald-500/50"
                  : localResult.status === "skipped"
                  ? "bg-cyan-500"
                  : "bg-red-500"
                : isUrgentTime
                ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 shadow-lg shadow-red-500/50 animate-pulse"
                : isWarningTime
                ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                : "bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-md shadow-cyan-500/50"
            }`}
          />
        </div>
      </div>

      {/* Dynamic Active Micro-Puzzle Component */}
      <AnimatePresence mode="wait">
        {localResult === null ? (
          <motion.div
            key="active-minigame"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            {interventionType === "magnetic_shield" && (
              <MagneticShieldMinigame
                onResolve={handleResolve}
                disabled={timeLeft <= 0}
              />
            )}
            {interventionType === "circuit_breaker" && (
              <CircuitBreakerMinigame
                onResolve={handleResolve}
                disabled={timeLeft <= 0}
              />
            )}
            {interventionType === "perchlorate_wash" && (
              <PerchlorateWashMinigame
                onResolve={handleResolve}
                disabled={timeLeft <= 0}
              />
            )}
          </motion.div>
        ) : (
          /* Completed Intervention Outcome Card */
          <motion.div
            key="outcome-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border-2 flex flex-col gap-3 ${
              localResult.status === "success"
                ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40"
                : localResult.status === "skipped"
                ? "bg-cyan-950/30 border-cyan-500/50 shadow-md"
                : "bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {localResult.status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : localResult.status === "skipped" ? (
                  <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wide">
                    {localResult.status === "success"
                      ? "Flight Director Intervention: Optimal Triage Verified!"
                      : localResult.status === "skipped"
                      ? "Flight Director Intervention: Auto-Resolved (Cadet Mode)"
                      : "Flight Director Intervention: Triage Suboptimal / Breached"}
                  </h4>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                    {localResult.telemetrySummary}
                  </p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                  localResult.status === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : localResult.status === "skipped"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-red-500/20 text-red-300 border border-red-500/40"
                }`}
              >
                {localResult.status}
              </span>
            </div>

            {/* Live Telemetry Impact Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10 text-[11px] font-mono">
              <span className="text-slate-400 font-bold uppercase">Dynamic Telemetry:</span>

              {localResult.shieldEfficiencyBonus !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    localResult.shieldEfficiencyBonus > 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  Shielding: {localResult.shieldEfficiencyBonus > 0 ? "+" : ""}
                  {localResult.shieldEfficiencyBonus}%
                </span>
              )}

              {localResult.radiationLeakMSv !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    localResult.radiationLeakMSv === 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  Radiation Leak: {localResult.radiationLeakMSv} mSv
                </span>
              )}

              {localResult.gridHealthBonus !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    localResult.gridHealthBonus > 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  Grid Health: {localResult.gridHealthBonus > 0 ? "+" : ""}
                  {localResult.gridHealthBonus}%
                </span>
              )}

              {localResult.powerDeltaMW !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    localResult.powerDeltaMW > 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  Power Headroom: {localResult.powerDeltaMW > 0 ? "+" : ""}
                  {localResult.powerDeltaMW} MW
                </span>
              )}

              {localResult.lifeSupportDelta !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    localResult.lifeSupportDelta > 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  Life Support: {localResult.lifeSupportDelta > 0 ? "+" : ""}
                  {localResult.lifeSupportDelta}%
                </span>
              )}

              {localResult.foodDaysDelta !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    localResult.foodDaysDelta > 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  Food Reserves: {localResult.foodDaysDelta > 0 ? "+" : ""}
                  {localResult.foodDaysDelta} Days
                </span>
              )}

              {localResult.status === "skipped" && (
                <span className="text-slate-400 italic">
                  Standard directive telemetry preserved.
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
