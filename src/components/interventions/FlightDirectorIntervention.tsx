// ============================================================
// FlightDirectorIntervention.tsx — 15-Second Flight Director Interventions
// Fast-paced tactile micro-puzzles teaching real NASA engineering triage
// under pressure, complete with 15-second countdown, Web Audio ticking,
// accessible Auto-Resolve / Skip for young cadets, and dynamic telemetry.
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
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

        // Timer expired: only report 0 here. Side effects (parent setState, audio) must not run
        // inside a state updater; the expiry effect below handles them exactly once.
        if (next <= 0) {
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

  // Fire the timeout exactly once when the countdown reaches zero.
  useEffect(() => {
    if (timeLeft <= 0 && isTimerRunning && localResult === null) {
      stopTimer();
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isTimerRunning, localResult]);

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

  const resultTone: "accent" | "neutral" | "critical" =
    localResult === null
      ? "accent"
      : localResult.status === "success"
      ? "accent"
      : localResult.status === "skipped"
      ? "neutral"
      : "critical";
  const timerTone: "accent" | "caution" | "critical" = isUrgentTime ? "critical" : isWarningTime ? "caution" : "accent";
  const barTone = localResult !== null ? resultTone : timerTone;
  const barColor =
    barTone === "critical"
      ? "var(--oc-critical)"
      : barTone === "caution"
      ? "var(--oc-caution)"
      : barTone === "neutral"
      ? "var(--oc-text-2)"
      : "var(--oc-accent)";

  const deltaChip = (label: string, value: number, suffix: string, key: string) => (
    <span key={key} className="oc-chip" data-tone={value > 0 ? "accent" : value === 0 ? "neutral" : "critical"}>
      {label}: {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );

  return (
    <div className="oc-card" data-tone={localResult !== null ? resultTone : "critical"}>
      {/* Top banner: intervention title and cadet skip button */}
      <div className="oc-section__head">
        <div className="oc-opt__title" style={{ fontSize: 14 }}>
          <span className="oc-chip oc-chip--solid" data-tone="critical">
            <Radio size={12} aria-hidden="true" />
            15-sec flight intervention
          </span>
          <span className="oc-label">Tactical engineering triage</span>
        </div>

        {localResult !== null ? (
          <button
            type="button"
            onClick={handleReset}
            className="oc-btn oc-btn--sm"
            title="Practice or retry this micro-puzzle"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Retry triage</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Auto-resolve or skip the 15-second flight director micro-puzzle without penalty. Suitable for younger cadets ages 7 to 9 and screen readers."
            className="oc-btn oc-btn--sm"
            style={{ height: "auto", minHeight: 32, paddingTop: 6, paddingBottom: 6, whiteSpace: "normal", textAlign: "center" }}
          >
            <FastForward size={14} aria-hidden="true" />
            <span>Auto-resolve / skip (Cadet mode)</span>
          </button>
        )}
      </div>

      {/* 15-second countdown */}
      <div className="oc-section" data-tone={barTone}>
        <div className="oc-section__head">
          <span className="oc-label" style={{ color: "var(--oc-text-1)" }}>
            <Timer size={16} aria-hidden="true" style={{ color: barColor }} />
            Critical triage window
          </span>
          <span
            className={`oc-type-data-l ${isUrgentTime && localResult === null ? "oc-blink" : ""}`}
            style={{ color: localResult !== null ? "var(--oc-text-3)" : barColor }}
            role="timer"
            aria-live="off"
          >
            {localResult !== null ? "TRIAGE CLOSED" : `${timeLeft.toFixed(1)}s`}
            <span className="oc-readout__unit"> / 15.0s</span>
          </span>
        </div>
        <div className="oc-bar oc-bar--thick oc-bar--live">
          <div
            className="oc-bar__fill"
            style={{ width: `${localResult !== null ? 100 : progressPercent}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Dynamic active micro-puzzle component */}
      {localResult === null ? (
        <div key="active-minigame" style={{ width: "100%" }}>
          {interventionType === "magnetic_shield" && (
            <MagneticShieldMinigame onResolve={handleResolve} disabled={timeLeft <= 0} />
          )}
          {interventionType === "circuit_breaker" && (
            <CircuitBreakerMinigame onResolve={handleResolve} disabled={timeLeft <= 0} />
          )}
          {interventionType === "perchlorate_wash" && (
            <PerchlorateWashMinigame onResolve={handleResolve} disabled={timeLeft <= 0} />
          )}
        </div>
      ) : (
        /* Completed intervention outcome */
        <div key="outcome-card" className="oc-note" data-tone={resultTone} style={{ flexDirection: "column" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start", width: "100%" }}>
            {localResult.status === "success" ? (
              <CheckCircle2 size={20} aria-hidden="true" style={{ flex: "none", color: "var(--tone)" }} />
            ) : localResult.status === "skipped" ? (
              <Activity size={20} aria-hidden="true" style={{ flex: "none", color: "var(--tone)" }} />
            ) : (
              <AlertTriangle size={20} aria-hidden="true" style={{ flex: "none", color: "var(--tone)" }} />
            )}
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div className="oc-label" style={{ color: "var(--oc-text-1)", alignItems: "flex-start" }}>
                {localResult.status === "success"
                  ? "Flight Director intervention: optimal triage verified"
                  : localResult.status === "skipped"
                  ? "Flight Director intervention: auto-resolved (Cadet mode)"
                  : "Flight Director intervention: triage suboptimal / breached"}
              </div>
              <p className="oc-modal__text" style={{ marginTop: 4 }}>
                {localResult.telemetrySummary}
              </p>
            </div>
            <span className="oc-chip oc-chip--solid" data-tone={resultTone}>
              {localResult.status}
            </span>
          </div>

          {/* Live telemetry impact badges */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              paddingTop: 8,
              width: "100%",
              borderTop: "1px solid var(--oc-line)",
            }}
          >
            <span className="oc-label__meta" style={{ marginLeft: 0 }}>
              Dynamic telemetry:
            </span>
            {localResult.shieldEfficiencyBonus !== undefined &&
              deltaChip("Shielding", localResult.shieldEfficiencyBonus, "%", "shield")}
            {localResult.radiationLeakMSv !== undefined && (
              <span className="oc-chip" data-tone={localResult.radiationLeakMSv === 0 ? "accent" : "critical"}>
                Radiation leak: {localResult.radiationLeakMSv} mSv
              </span>
            )}
            {localResult.gridHealthBonus !== undefined &&
              deltaChip("Grid health", localResult.gridHealthBonus, "%", "grid")}
            {localResult.powerDeltaMW !== undefined &&
              deltaChip("Power headroom", localResult.powerDeltaMW, " MW", "power")}
            {localResult.lifeSupportDelta !== undefined &&
              deltaChip("Life support", localResult.lifeSupportDelta, "%", "ls")}
            {localResult.foodDaysDelta !== undefined &&
              deltaChip("Food reserves", localResult.foodDaysDelta, " days", "food")}
            {localResult.status === "skipped" && (
              <span style={{ color: "var(--oc-text-3)", fontStyle: "italic" }}>
                Standard directive telemetry preserved.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
