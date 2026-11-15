// ============================================================
// PerchlorateWashMinigame.tsx — 🧪 Perchlorate Soil Wash Calibration
// Dual slider balancing "Wash Water (Liters)" vs "Catalytic Heat (°C)".
// Students find the sweet spot to cleanse toxic Martian perchlorate salts
// from regolith without boiling away the precious water buffer.
// ============================================================

import { useState, useId } from "react";
import { Droplet, Flame, Sparkles, AlertTriangle, CheckCircle2, Beaker } from "lucide-react";
import type { FlightDirectorInterventionResult } from "../../types/intervention";
import { soundEffects } from "../../utils/soundEffects";

interface PerchlorateWashMinigameProps {
  onResolve: (result: FlightDirectorInterventionResult) => void;
  disabled?: boolean;
}

export default function PerchlorateWashMinigame({
  onResolve,
  disabled = false,
}: PerchlorateWashMinigameProps) {
  const waterSliderId = useId();
  const heatSliderId = useId();

  // Dual Sliders: Wash Water (L) and Catalytic Heat (°C)
  const [washWaterLiters, setWashWaterLiters] = useState<number>(20); // Starts low
  const [catalyticHeatC, setCatalyticHeatC] = useState<number>(60); // Starts cold

  // Science sweet spots:
  // Water: 40L to 60L (sweet spot center: 50L)
  // Heat: 170°C to 210°C (sweet spot center: 190°C, decomposition threshold: 160°C, flash boiling: >215°C)
  const isWaterOptimal = washWaterLiters >= 40 && washWaterLiters <= 60;
  const isHeatOptimal = catalyticHeatC >= 170 && catalyticHeatC <= 210;
  const isSweetSpot = isWaterOptimal && isHeatOptimal;

  const isBoiling = catalyticHeatC > 215;
  const isTooCold = catalyticHeatC < 160;
  const isTooDry = washWaterLiters < 35;
  const isTooFlooded = washWaterLiters > 65;

  // Real-time calculation of soil purity (0 - 100%)
  const calculatePurity = () => {
    let purity = 15;
    if (catalyticHeatC >= 160) {
      const heatFactor = Math.min(1, (catalyticHeatC - 160) / 30);
      purity += heatFactor * 45;
    }
    if (washWaterLiters >= 35) {
      const waterFactor = Math.min(1, (washWaterLiters - 35) / 15);
      purity += waterFactor * 39.8;
    }
    if (isBoiling) {
      // Boiling flashes water off, dropping extraction efficiency
      purity = Math.max(20, purity - 35);
    }
    return Math.min(99.8, Math.round(purity * 10) / 10);
  };

  const soilPurity = calculatePurity();

  const handleWaterChange = (val: number) => {
    if (disabled) return;
    setWashWaterLiters(val);
    soundEffects.playDialTick(val - 50);
  };

  const handleHeatChange = (val: number) => {
    if (disabled) return;
    setCatalyticHeatC(val);
    soundEffects.playDialTick(val - 150);
  };

  const handleCommit = () => {
    if (disabled) return;

    if (isSweetSpot) {
      soundEffects.playPuzzleSuccess();
      onResolve({
        interventionType: "perchlorate_wash",
        status: "success",
        telemetrySummary: `Perchlorate Wash Calibrated: Balanced ${washWaterLiters}L solvent at ${catalyticHeatC}°C. 99.8% Martian soil salts neutralized without boiling water buffer. +15% Life Support Health, +2 Food Days, 0 Water Loss.`,
        lifeSupportDelta: 15,
        foodDaysDelta: 2,
        permanentWaterO2Bonus: 5,
        details: {
          waterLiters: washWaterLiters,
          heatC: catalyticHeatC,
          soilPurityPercent: 99.8,
          waterLostLiters: 0,
        },
      });
    } else {
      soundEffects.playPuzzleFail();
      onResolve({
        interventionType: "perchlorate_wash",
        status: "failure",
        telemetrySummary: `Suboptimal Wash Calibration: ${
          isBoiling
            ? `Excess heat (${catalyticHeatC}°C) caused flash-boiling! 14L water buffer lost to steam!`
            : isTooCold
            ? `Chamber temperature (${catalyticHeatC}°C) too cold to catalyze ClO₄⁻ salts!`
            : "Imbalanced solvent-to-heat ratio left regolith contaminated."
        } (-8% Life Support Health, -1 Food Day).`,
        lifeSupportDelta: -8,
        foodDaysDelta: -1,
        details: {
          waterLiters: washWaterLiters,
          heatC: catalyticHeatC,
          soilPurityPercent: soilPurity,
          waterLostLiters: isBoiling ? 14 : 0,
        },
      });
    }
  };

  const statusTone: "accent" | "caution" | "critical" = isSweetSpot ? "accent" : isBoiling ? "critical" : "caution";
  const fluidColor = isSweetSpot
    ? "var(--oc-accent)"
    : isBoiling
    ? "var(--oc-critical)"
    : isTooCold
    ? "var(--oc-text-2)"
    : "var(--oc-accent-2)";

  return (
    <div className="oc-section" style={{ gap: 16 }}>
      {/* Minigame header */}
      <div className="oc-section__head" style={{ alignItems: "flex-start" }}>
        <div className="oc-section" style={{ gap: 4, flex: "1 1 220px" }}>
          <h3 className="oc-label" style={{ color: "var(--oc-text-1)", margin: 0, flexWrap: "wrap" }}>
            <Beaker size={16} aria-hidden="true" />
            <span>Perchlorate soil wash calibration</span>
            <span className="oc-chip oc-chip--plain">Chemistry sweet spot</span>
          </h3>
          <p className="oc-modal__text">
            Balance wash water and catalytic heat to cleanse toxic Martian soil without boiling the water buffer.
          </p>
        </div>

        {/* Live status badge */}
        <span className={`oc-chip oc-chip--solid ${isBoiling ? "oc-blink" : ""}`} data-tone={statusTone} role="status">
          {isSweetSpot ? (
            <>
              <Sparkles size={12} aria-hidden="true" />
              <span>Sweet spot locked</span>
            </>
          ) : isBoiling ? (
            <>
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Flash boiling!</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Calibrating</span>
            </>
          )}
        </span>
      </div>

      {/* Reactor core graphic and physics gauges */}
      <div className="oc-split oc-split--tight">
        {/* Reactor core vessel SVG */}
        <div className="oc-card" style={{ alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 100 120" role="img" aria-label={`Reactor vessel: ${washWaterLiters} litres at ${catalyticHeatC} degrees Celsius`} style={{ width: 96, height: 112, overflow: "visible", userSelect: "none" }}>
            {/* Reaction chamber outer tube */}
            <rect x="20" y="15" width="60" height="85" rx="2" fill="var(--oc-bg-void)" stroke="var(--oc-text-3)" strokeWidth="3" />
            {/* Top cap */}
            <rect x="30" y="8" width="40" height="8" rx="1" fill="var(--oc-line-strong)" />

            {/* Chamber fluid (height scales with water, colour with state) */}
            <rect
              x="24"
              y={95 - (washWaterLiters / 100) * 70}
              width="52"
              height={(washWaterLiters / 100) * 70}
              rx="1"
              fill={fluidColor}
              fillOpacity="0.8"
              style={{ transition: "all var(--oc-dur-base) var(--oc-ease-out)" }}
            />

            {/* Bubbles / steam */}
            <circle cx="40" cy="70" r={isBoiling ? "4" : "2"} fill="var(--oc-text-1)" opacity="0.6" />
            <circle cx="60" cy="55" r={isBoiling ? "5" : "2.5"} fill="var(--oc-text-1)" opacity="0.8" />

            {/* Heating coils indicator at bottom */}
            <path
              d="M 28 105 L 36 101 L 44 105 L 52 101 L 60 105 L 68 101"
              fill="none"
              stroke={catalyticHeatC > 150 ? "var(--oc-caution)" : "var(--oc-line-strong)"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          <div className="oc-kv" style={{ justifyContent: "center" }}>
            <span>Soil purity</span>
            <span style={{ color: soilPurity > 90 ? "var(--oc-accent)" : "var(--oc-caution)" }}>{soilPurity}%</span>
          </div>
        </div>

        {/* Dual sliders and sweet-spot guides */}
        <div className="oc-section" style={{ gap: 12 }}>
          {/* Slider 1: wash water */}
          <div className="oc-section" style={{ gap: 4 }}>
            <div className="oc-section__head">
              <label htmlFor={waterSliderId} className="oc-label">
                <Droplet size={14} aria-hidden="true" />
                <span>Wash water buffer (liters)</span>
              </label>
              <span className="oc-type-data-s" style={{ color: isWaterOptimal ? "var(--oc-accent)" : "var(--oc-text-1)" }}>
                {washWaterLiters} L <span style={{ color: "var(--oc-text-3)" }}>[target 40{"–"}60 L]</span>
              </span>
            </div>

            <input
              id={waterSliderId}
              type="range"
              min="0"
              max="100"
              step="1"
              value={washWaterLiters}
              disabled={disabled}
              onChange={(e) => handleWaterChange(Number(e.target.value))}
              aria-label="Wash Water Volume in Liters"
              className="oc-range"
            />

            <div className="oc-section__head oc-readout__code" style={{ flexWrap: "wrap", gap: "2px 8px" }}>
              <span style={isTooDry ? { color: "var(--oc-caution)" } : undefined}>0 L (dry brine)</span>
              <span style={{ color: isWaterOptimal ? "var(--oc-accent)" : undefined }}>{"▲"} Sweet spot: 40{"–"}60 L</span>
              <span style={isTooFlooded ? { color: "var(--oc-caution)" } : undefined}>100 L (buffer drain)</span>
            </div>
          </div>

          {/* Slider 2: catalytic heat */}
          <div className="oc-section" style={{ gap: 4 }}>
            <div className="oc-section__head">
              <label htmlFor={heatSliderId} className="oc-label">
                <Flame size={14} aria-hidden="true" />
                <span>Catalytic bed heat ({"°"}C)</span>
              </label>
              <span
                className="oc-type-data-s"
                style={{ color: isHeatOptimal ? "var(--oc-accent)" : isBoiling ? "var(--oc-critical)" : "var(--oc-text-1)" }}
              >
                {catalyticHeatC}{"°"}C <span style={{ color: "var(--oc-text-3)" }}>[target 170{"–"}210{"°"}C]</span>
              </span>
            </div>

            <input
              id={heatSliderId}
              type="range"
              min="20"
              max="300"
              step="1"
              value={catalyticHeatC}
              disabled={disabled}
              onChange={(e) => handleHeatChange(Number(e.target.value))}
              aria-label="Catalytic Bed Heat in Celsius"
              className="oc-range"
            />

            <div className="oc-section__head oc-readout__code" style={{ flexWrap: "wrap", gap: "2px 8px" }}>
              <span style={isTooCold ? { color: "var(--oc-caution)" } : undefined}>20{"°"}C (cold)</span>
              <span style={{ color: isHeatOptimal ? "var(--oc-accent)" : undefined }}>
                {"▲"} Catalysis window: 170{"–"}210{"°"}C
              </span>
              <span style={isBoiling ? { color: "var(--oc-critical)" } : undefined}>&gt;215{"°"}C (flash boil)</span>
            </div>
          </div>

          {/* Real-time chemistry feedback notice */}
          {isSweetSpot ? (
            <div className="oc-note" data-tone="accent" role="status">
              <Sparkles size={16} aria-hidden="true" />
              <span>Sweet spot: 99.8% perchlorates neutralized. Zero water buffer vaporized.</span>
            </div>
          ) : isBoiling ? (
            <div className="oc-note" data-tone="critical" role="status">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>Critical: water flash-boiling at {catalyticHeatC}{"°"}C! Buffer venting to steam!</span>
            </div>
          ) : isTooCold ? (
            <div className="oc-note" data-tone="caution" role="status">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>Catalyst inactive below 160{"°"}C. Increase heat to trigger salt reduction.</span>
            </div>
          ) : isTooDry ? (
            <div className="oc-note" data-tone="caution" role="status">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>Insufficient wash water (&lt;35 L). Soil brine saturated.</span>
            </div>
          ) : (
            <div className="oc-note oc-note--quiet" role="status">
              <span>Adjust sliders into the sweet spot window to complete wash cycle.</span>
            </div>
          )}
        </div>
      </div>

      {/* Action commitment button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleCommit}
        className={`oc-btn oc-btn--block ${isSweetSpot ? "oc-btn--primary" : isBoiling ? "oc-btn--danger" : ""}`}
        style={{ height: "auto", minHeight: 44, paddingTop: 8, paddingBottom: 8, whiteSpace: "normal" }}
      >
        {isSweetSpot ? (
          <>
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>
              Engage catalytic wash cycle ({washWaterLiters} L @ {catalyticHeatC}{"°"}C)
            </span>
          </>
        ) : isBoiling ? (
          <>
            <AlertTriangle size={16} aria-hidden="true" />
            <span>Overheated: reduce heat below 215{"°"}C</span>
          </>
        ) : (
          <>
            <Beaker size={16} aria-hidden="true" />
            <span>Confirm soil wash calibration</span>
          </>
        )}
      </button>
    </div>
  );
}
