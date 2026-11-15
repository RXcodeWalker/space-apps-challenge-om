// ============================================================
// CircuitBreakerMinigame.tsx — ⚡ Emergency Circuit Breaker Reroute
// Fast-paced electrical triage for Grid Overloads / Brownouts.
// 4 toggle switches (Life Support, Science Bay, Crew Quarters, Communications).
// Flip off 2 non-essential loads to balance a surging 120 MW grid demand
// safely back below the 100 MW ceiling.
// ============================================================

import { useState } from "react";
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

  const statusTone: "accent" | "caution" | "critical" = isBalancedAndSafe ? "accent" : hasCriticalOffline ? "critical" : "caution";
  const barColor = isOverCeiling || hasCriticalOffline ? "var(--oc-critical)" : "var(--oc-accent)";

  return (
    <div className="oc-section" style={{ gap: 16 }}>
      {/* Minigame header */}
      <div className="oc-section__head" style={{ alignItems: "flex-start" }}>
        <div className="oc-section" style={{ gap: 4, flex: "1 1 220px" }}>
          <h3 className="oc-label" style={{ color: "var(--oc-text-1)", margin: 0, flexWrap: "wrap" }}>
            <Zap size={16} aria-hidden="true" />
            <span>Emergency circuit breaker reroute</span>
            <span className="oc-chip oc-chip--plain">100 MW ceiling</span>
          </h3>
          <p className="oc-modal__text">
            Flip off 2 non-essential loads to balance surging 120 MW demand back below the 100 MW ceiling.
          </p>
        </div>

        {/* Live triage status */}
        <span className={`oc-chip oc-chip--solid ${statusTone === "critical" ? "oc-blink" : ""}`} data-tone={statusTone} role="status">
          {isBalancedAndSafe ? (
            <>
              <CheckCircle2 size={12} aria-hidden="true" />
              <span>Grid balanced ({currentDemandMW} MW)</span>
            </>
          ) : hasCriticalOffline ? (
            <>
              <ShieldAlert size={12} aria-hidden="true" />
              <span>Critical offline</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Surge: +{currentDemandMW - gridCeilingMW} MW</span>
            </>
          )}
        </span>
      </div>

      {/* Grid load telemetry meter */}
      <div className="oc-section">
        <div className="oc-section__head">
          <span className="oc-label">
            <Cpu size={14} aria-hidden="true" />
            <span>Main distribution bus demand</span>
          </span>
          <span className="oc-type-data-s" style={{ color: isOverCeiling ? "var(--oc-critical)" : "var(--oc-text-1)" }}>
            {currentDemandMW} MW <span style={{ color: "var(--oc-text-3)" }}>/ 100 MW limit</span>
          </span>
        </div>

        <div className="oc-bar oc-bar--thick oc-bar--live" role="meter" aria-valuemin={0} aria-valuemax={140} aria-valuenow={currentDemandMW} aria-label="Bus demand in megawatts">
          <div className="oc-bar__fill" style={{ width: `${Math.min(100, (currentDemandMW / 140) * 100)}%`, background: barColor }} />
          <div className="oc-bar__tick" style={{ left: `${(100 / 140) * 100}%`, background: "var(--oc-text-1)", width: 2 }} title="100 MW operating ceiling" />
        </div>

        <div className="oc-section__head oc-readout__code" style={{ flexWrap: "nowrap" }}>
          <span>0 MW</span>
          <span style={{ color: "var(--oc-critical)", textAlign: "center" }}>{"▲"} 100 MW overload ceiling</span>
          <span>140 MW max</span>
        </div>
      </div>

      {/* 4 breaker toggle switches */}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {CIRCUIT_LOADS.map((load) => {
          const isEnergized = activeSwitches[load.id];

          return (
            <div
              key={load.id}
              className="oc-card"
              data-tone={isEnergized ? (load.isEssential ? "accent" : "caution") : "neutral"}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, opacity: isEnergized ? 1 : 0.8 }}
            >
              <div className="oc-section" style={{ gap: 4, flex: 1 }}>
                <div className="oc-opt__title" style={{ fontSize: 14 }}>
                  <span className="oc-chip" data-tone={load.isEssential ? "accent" : "caution"}>
                    {load.category}
                  </span>
                  <span>{load.name}</span>
                </div>
                <div className="oc-kv">
                  <span style={{ color: "var(--oc-text-1)" }}>{load.wattageMW} MW</span>
                  <span>{isEnergized ? "ONLINE" : "SHED / OFFLINE"}</span>
                </div>
                {!isEnergized && load.isEssential && (
                  <span className="oc-kv" style={{ color: "var(--oc-critical)" }}>
                    {"▲"} {load.warningIfCut}
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleLoad(load.id)}
                aria-pressed={isEnergized}
                aria-label={`Toggle ${load.name} breaker switch (${isEnergized ? "Energized" : "Shed"})`}
                className="oc-btn oc-toggle"
                style={{ flex: "none", minWidth: 72 }}
              >
                <span className="oc-toggle__pip" aria-hidden="true" />
                <span className="oc-btn__label">{isEnergized ? "ON" : "OFF"}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Action commitment button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleCommit}
        className={`oc-btn oc-btn--block ${isBalancedAndSafe ? "oc-btn--primary" : hasCriticalOffline ? "oc-btn--danger" : ""}`}
        style={{ height: "auto", minHeight: 44, paddingTop: 8, paddingBottom: 8, whiteSpace: "normal" }}
      >
        {isBalancedAndSafe ? (
          <>
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Stabilize grid bus ({currentDemandMW} MW &lt; 100 MW)</span>
          </>
        ) : hasCriticalOffline ? (
          <>
            <AlertTriangle size={16} aria-hidden="true" />
            <span>Warning: restore critical life support / comms</span>
          </>
        ) : (
          <>
            <Zap size={16} aria-hidden="true" />
            <span>Confirm power reroute ({currentDemandMW} MW)</span>
          </>
        )}
      </button>
    </div>
  );
}
