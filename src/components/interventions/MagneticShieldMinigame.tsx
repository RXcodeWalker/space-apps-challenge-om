// ============================================================
// MagneticShieldMinigame.tsx — 🧲 Magnetic Shield Vector Alignment
// Interactive aerospace vector deflection radar for Solar Particle Events (SPE).
// Rotate magnetic deflection angle slider (0° to 180°) to match incoming
// solar proton flux. Matching within ±10° achieves Optimal Deflection.
// ============================================================

import { useState, useId } from "react";
import { motion } from "framer-motion";
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

  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-black/80 border-2 border-cyan-500/30 shadow-inner">
      {/* Minigame Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Shield className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Magnetic Shield Vector Alignment</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
                ±10° TOLERANCE
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Align magnetic deflection angle (0°–180°) to intercept incoming solar proton flux.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 uppercase transition-all ${
            isOptimal
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-lg shadow-emerald-500/20 animate-pulse"
              : isNear
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
              : "bg-red-500/20 text-red-300 border border-red-500/50"
          }`}
        >
          {isOptimal ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>OPTIMAL DEFLECTION</span>
            </>
          ) : isNear ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>ALIGNING (Δ: ±{delta}°)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
              <span>MISALIGNED (Δ: ±{delta}°)</span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Vector Radar HUD & Particle Stream */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        {/* Radar Graphic */}
        <div className="md:col-span-5 flex justify-center relative">
          <svg
            viewBox="0 0 240 140"
            className="w-full max-w-[240px] h-auto overflow-visible select-none drop-shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            {/* Background Arch */}
            <path
              d="M 32 115 A 88 88 0 0 1 208 115"
              fill="none"
              stroke="#1e293b"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Range markers */}
            <path
              d="M 32 115 A 88 88 0 0 1 208 115"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 6"
            />

            {/* Target Optimal Zone (±10° arc segment) */}
            <path
              d={`M ${targetOptimalStart.x} ${targetOptimalStart.y} A 88 88 0 0 ${
                targetAngle > 90 ? 1 : 1
              } ${targetOptimalEnd.x} ${targetOptimalEnd.y}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="16"
              strokeOpacity="0.35"
              strokeLinecap="round"
            />

            {/* Incoming Proton Flux Particles (Streaming towards center) */}
            <g className="animate-pulse">
              <line
                x1={targetPoint.x}
                y1={targetPoint.y}
                x2={centerX}
                y2={centerY}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
              <circle
                cx={targetPoint.x}
                cy={targetPoint.y}
                r="6"
                fill="#f59e0b"
                className="animate-ping"
                opacity="0.75"
              />
              <circle cx={targetPoint.x} cy={targetPoint.y} r="5" fill="#f59e0b" />
            </g>

            {/* Deflector Field Arc at current user angle */}
            <g>
              <line
                x1={centerX}
                y1={centerY}
                x2={currentPoint.x}
                y2={currentPoint.y}
                stroke={isOptimal ? "#10b981" : "#06b6d4"}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Deflection Shield Magnetic Arc Head */}
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="7"
                fill={isOptimal ? "#10b981" : "#06b6d4"}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-colors duration-150"
              />
            </g>

            {/* Habitat Base at Center */}
            <circle cx={centerX} cy={centerY} r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <circle cx={centerX} cy={centerY} r="6" fill="#38bdf8" />

            {/* Labels */}
            <text x="24" y="130" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
              180°
            </text>
            <text x="120" y="20" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
              90°
            </text>
            <text x="216" y="130" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
              0°
            </text>
          </svg>
        </div>

        {/* Dial Controls & Real-Time Readout */}
        <div className="md:col-span-7 flex flex-col gap-2.5">
          {/* Telemetry Readout Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-black/50 border border-white/10 flex flex-col">
              <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                <span>Incoming SPE Flux</span>
              </span>
              <span className="text-sm font-black text-white">{targetAngle}° Azimuth</span>
              <span className="text-[10px] text-slate-400">Solar Proton Stream</span>
            </div>

            <div
              className={`p-2 rounded-xl border flex flex-col transition-colors ${
                isOptimal
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                  : "bg-black/50 border-white/10 text-cyan-200"
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">Deflection Angle</span>
              <span className="text-sm font-black text-white">{currentAngle}° Azimuth</span>
              <span className="text-[10px] font-mono">
                Offset: <span className={isOptimal ? "text-emerald-400 font-bold" : "text-amber-400"}>±{delta}°</span>
              </span>
            </div>
          </div>

          {/* Precision Dial Range Slider */}
          <div className="flex flex-col gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <label htmlFor={sliderId} className="flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-cyan-400" />
                <span>Magnetic Shield Deflector Angle:</span>
              </label>
              <span className="font-bold text-cyan-300">{currentAngle}°</span>
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
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />

            {/* Quick Adjustment Steppers */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAngleChange(currentAngle - 5)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-mono font-bold"
                >
                  -5°
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAngleChange(currentAngle - 1)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-mono font-bold"
                >
                  -1°
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-500">Target: {targetAngle}° (±10°)</span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAngleChange(currentAngle + 1)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-mono font-bold"
                >
                  +1°
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAngleChange(currentAngle + 5)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-mono font-bold"
                >
                  +5°
                </button>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <motion.button
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.015 }}
            whileTap={{ scale: disabled ? 1 : 0.985 }}
            disabled={disabled}
            onClick={handleCommit}
            className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
              isOptimal
                ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-emerald-900/50 hover:brightness-110"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
            }`}
          >
            {isOptimal ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>LOCK OPTIMAL DEFLECTION VECTOR ({currentAngle}°)</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>ENGAGE DEFLECTION VECTOR ({currentAngle}°)</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
