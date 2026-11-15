// ============================================================
// MagneticShieldMinigame.tsx — 🧲 Magnetic Shield Vector Alignment
// Interactive aerospace vector deflection radar for Solar Particle Events (SPE).
// Rotate magnetic deflection angle slider (0° to 180°) to match incoming
// solar proton flux. Matching within ±10° achieves Optimal Deflection.
// ============================================================

import { useState, useId } from "react";
import { Shield, Sparkles, AlertTriangle, CheckCircle2, RotateCw } from "lucide-react";
import type { FlightDirectorInterventionResult } from "../../types/intervention";
import { soundEffects } from "../../utils/soundEffects";

interface MagneticShieldMinigameProps {
  onResolve: (result: FlightDirectorInterventionResult) => void;
  disabled?: boolean;
  initialTargetAngle?: number;
}

export default function MagneticShieldMinigame({
  onResolve,
  disabled = false,
  initialTargetAngle,
}: MagneticShieldMinigameProps) {
  const sliderId = useId();

  // Deterministic or seeded default target angle between 35° and 145°
  const [targetAngle] = useState<number>(() => {
    if (typeof initialTargetAngle === "number") return initialTargetAngle;
    return Math.floor(45 + Math.random() * 90); // e.g. 115°
  });

  const [currentAngle, setCurrentAngle] = useState<number>(90);

  const delta = Math.abs(currentAngle - targetAngle);
  const isOptimal = delta <= 10;
  const isNear = delta <= 25 && !isOptimal;

  // Sound feedback on angle change
  const handleAngleChange = (newAngle: number) => {
    if (disabled) return;
    const clamped = Math.max(0, Math.min(180, newAngle));
    setCurrentAngle(clamped);
    soundEffects.playDialTick(clamped - 90);
  };

  const handleCommit = () => {
    if (disabled) return;

    if (isOptimal) {
      soundEffects.playPuzzleSuccess();
      onResolve({
        interventionType: "magnetic_shield",
        status: "success",
        telemetrySummary: `Optimal Deflection Achieved: Vector aligned at ${currentAngle}° (Target: ${targetAngle}°, Δ: ±${delta}°). +20% Shield Efficiency, 0 Radiation Leak.`,
        shieldEfficiencyBonus: 20,
        radiationLeakMSv: 0,
        details: {
          alignedAngle: currentAngle,
          targetAngle,
          delta,
          efficiency: "100%",
        },
      });
    } else {
      soundEffects.playPuzzleFail();
      onResolve({
        interventionType: "magnetic_shield",
        status: "failure",
        telemetrySummary: `Suboptimal Vector: Vector aligned at ${currentAngle}° (Target: ${targetAngle}°, Δ: ±${delta}°). Secondary radiation leak (+1.2 mSv).`,
        shieldEfficiencyBonus: -5,
        radiationLeakMSv: 1.2,
        details: {
          alignedAngle: currentAngle,
          targetAngle,
          delta,
          efficiency: `${Math.max(10, Math.round(100 - delta * 2))}%`,
        },
      });
    }
  };

  // Convert angles to radian coordinates for SVG radar visualization
  // Angles: 0° is East/Right, 90° is North/Top, 180° is West/Left
  const radarRadius = 88;
  const centerX = 120;
  const centerY = 115;

  const getPoint = (angleDeg: number, radius: number) => {
    const rad = (180 - angleDeg) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY - radius * Math.sin(rad),
    };
  };

  const targetPoint = getPoint(targetAngle, radarRadius);
  const currentPoint = getPoint(currentAngle, radarRadius);
  const targetOptimalStart = getPoint(Math.max(0, targetAngle - 10), radarRadius);
  const targetOptimalEnd = getPoint(Math.min(180, targetAngle + 10), radarRadius);

  const statusTone: "accent" | "caution" | "critical" = isOptimal ? "accent" : isNear ? "caution" : "critical";

  return (
    <div className="oc-section" style={{ gap: 16 }}>
      {/* Minigame header */}
      <div className="oc-section__head" style={{ alignItems: "flex-start" }}>
        <div className="oc-section" style={{ gap: 4, flex: "1 1 220px" }}>
          <h3 className="oc-label" style={{ color: "var(--oc-text-1)", margin: 0, flexWrap: "wrap" }}>
            <Shield size={16} aria-hidden="true" />
            <span>Magnetic shield vector alignment</span>
            <span className="oc-chip oc-chip--plain">{"±"}10{"°"} tolerance</span>
          </h3>
          <p className="oc-modal__text">
            Align magnetic deflection angle (0{"°"}{"–"}180{"°"}) to intercept incoming solar proton flux.
          </p>
        </div>

        {/* Live status badge */}
        <span
          className="oc-chip oc-chip--solid"
          data-tone={statusTone}
          role="status"
        >
          {isOptimal ? (
            <>
              <Sparkles size={12} aria-hidden="true" />
              <span>Optimal deflection</span>
            </>
          ) : isNear ? (
            <>
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Aligning ({"Δ"}: {"±"}{delta}{"°"})</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Misaligned ({"Δ"}: {"±"}{delta}{"°"})</span>
            </>
          )}
        </span>
      </div>

      {/* Interactive vector radar HUD */}
      <div className="oc-split">
        {/* Radar graphic */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg
            viewBox="0 0 240 140"
            role="img"
            aria-label={`Radar: incoming flux at ${targetAngle} degrees, deflector at ${currentAngle} degrees`}
            style={{ width: "100%", maxWidth: 260, height: "auto", overflow: "visible", userSelect: "none" }}
          >
            {/* Background arch */}
            <path d="M 32 115 A 88 88 0 0 1 208 115" fill="none" stroke="var(--oc-bg-panel)" strokeWidth="20" strokeLinecap="round" />
            <path
              d="M 32 115 A 88 88 0 0 1 208 115"
              fill="none"
              stroke="var(--oc-line-strong)"
              strokeWidth="2"
              strokeDasharray="4 6"
            />

            {/* Target optimal zone (+-10 deg arc segment) */}
            <path
              d={`M ${targetOptimalStart.x} ${targetOptimalStart.y} A 88 88 0 0 1 ${targetOptimalEnd.x} ${targetOptimalEnd.y}`}
              fill="none"
              stroke="var(--oc-accent)"
              strokeWidth="16"
              strokeOpacity="0.3"
              strokeLinecap="round"
            />

            {/* Incoming proton flux */}
            <g>
              <line
                x1={targetPoint.x}
                y1={targetPoint.y}
                x2={centerX}
                y2={centerY}
                stroke="var(--oc-caution)"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
              <rect
                x={targetPoint.x - 5}
                y={targetPoint.y - 5}
                width="10"
                height="10"
                fill="var(--oc-caution)"
                transform={`rotate(45 ${targetPoint.x} ${targetPoint.y})`}
              />
            </g>

            {/* Deflector field at current user angle */}
            <g>
              <line
                x1={centerX}
                y1={centerY}
                x2={currentPoint.x}
                y2={currentPoint.y}
                stroke="var(--oc-accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="7"
                fill={isOptimal ? "var(--oc-text-1)" : "var(--oc-accent)"}
                stroke="var(--oc-bg-void)"
                strokeWidth="2"
              />
            </g>

            {/* Habitat base at centre */}
            <circle cx={centerX} cy={centerY} r="14" fill="var(--oc-bg-void)" stroke="var(--oc-accent)" strokeWidth="2" />
            <circle cx={centerX} cy={centerY} r="6" fill="var(--oc-accent)" />

            {/* Labels */}
            <text x="24" y="132" fill="var(--oc-text-3)" fontSize="10" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
              180{"°"}
            </text>
            <text x="120" y="20" fill="var(--oc-text-3)" fontSize="10" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
              90{"°"}
            </text>
            <text x="216" y="132" fill="var(--oc-text-3)" fontSize="10" fontFamily="IBM Plex Mono, monospace" textAnchor="middle">
              0{"°"}
            </text>
          </svg>
        </div>

        {/* Dial controls and real-time readout */}
        <div className="oc-section" style={{ gap: 12 }}>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div className="oc-stat" data-tone="caution">
              <span className="oc-stat__k">Incoming SPE flux</span>
              <span className="oc-stat__v">{targetAngle}{"°"}</span>
              <span className="oc-stat__s">Solar proton stream</span>
            </div>
            <div className="oc-stat" data-tone={isOptimal ? "accent" : "neutral"}>
              <span className="oc-stat__k">Deflection angle</span>
              <span className="oc-stat__v">{currentAngle}{"°"}</span>
              <span className="oc-stat__s">Offset: {"±"}{delta}{"°"}</span>
            </div>
          </div>

          {/* Precision dial range slider */}
          <div className="oc-section" style={{ gap: 4 }}>
            <div className="oc-section__head">
              <label htmlFor={sliderId} className="oc-label">
                <RotateCw size={14} aria-hidden="true" />
                <span>Deflector angle</span>
              </label>
              <span className="oc-type-data-s" style={{ color: "var(--oc-text-1)" }}>{currentAngle}{"°"}</span>
            </div>

            <input
              id={sliderId}
              type="range"
              min="0"
              max="180"
              step="1"
              value={currentAngle}
              disabled={disabled}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              aria-label="Magnetic Deflection Vector Angle"
              className="oc-range"
            />

            {/* Quick adjustment steppers */}
            <div className="oc-section__head" style={{ flexWrap: "nowrap" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <button type="button" disabled={disabled} onClick={() => handleAngleChange(currentAngle - 5)} className="oc-btn oc-btn--sm">
                  -5{"°"}
                </button>
                <button type="button" disabled={disabled} onClick={() => handleAngleChange(currentAngle - 1)} className="oc-btn oc-btn--sm">
                  -1{"°"}
                </button>
              </div>
              <span className="oc-readout__code" style={{ textAlign: "center" }}>
                Target {targetAngle}{"°"} ({"±"}10{"°"})
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button type="button" disabled={disabled} onClick={() => handleAngleChange(currentAngle + 1)} className="oc-btn oc-btn--sm">
                  +1{"°"}
                </button>
                <button type="button" disabled={disabled} onClick={() => handleAngleChange(currentAngle + 5)} className="oc-btn oc-btn--sm">
                  +5{"°"}
                </button>
              </div>
            </div>
          </div>

          {/* Action trigger */}
          <button
            type="button"
            disabled={disabled}
            onClick={handleCommit}
            className={`oc-btn oc-btn--block ${isOptimal ? "oc-btn--primary" : ""}`}
            style={{ height: "auto", minHeight: 44, paddingTop: 8, paddingBottom: 8, whiteSpace: "normal" }}
          >
            {isOptimal ? (
              <>
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>Lock optimal deflection vector ({currentAngle}{"°"})</span>
              </>
            ) : (
              <>
                <Shield size={16} aria-hidden="true" />
                <span>Engage deflection vector ({currentAngle}{"°"})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
