// ============================================================
// PerchlorateWashMinigame.tsx — 🧪 Perchlorate Soil Wash Calibration
// Dual slider balancing "Wash Water (Liters)" vs "Catalytic Heat (°C)".
// Students find the sweet spot to cleanse toxic Martian perchlorate salts
// from regolith without boiling away the precious water buffer.
// ============================================================

import { useState, useId } from "react";
import { motion } from "framer-motion";
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

  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-2xl bg-gradient-to-b from-purple-950/30 via-slate-900/60 to-black/80 border-2 border-purple-500/30 shadow-inner">
      {/* Minigame Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Beaker className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Perchlorate Soil Wash Calibration</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30">
                CHEMISTRY SWEET SPOT
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Balance wash water and catalytic heat to cleanse toxic Martian soil without boiling the water buffer.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 uppercase transition-all ${
            isSweetSpot
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-lg shadow-emerald-500/20 animate-pulse"
              : isBoiling
              ? "bg-red-500/20 text-red-300 border border-red-500/60 animate-pulse"
              : "bg-purple-500/20 text-purple-300 border border-purple-500/50"
          }`}
        >
          {isSweetSpot ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>SWEET SPOT LOCKED</span>
            </>
          ) : isBoiling ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
              <span>FLASH BOILING!</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>CALIBRATING</span>
            </>
          )}
        </div>
      </div>

      {/* Chemical Reactor Core Graphic & Physics Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        {/* Reactor Core Vessel SVG */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-black/60 border border-white/10">
          <svg viewBox="0 0 100 120" className="w-24 h-28 overflow-visible select-none">
            {/* Reaction Chamber Outer Tube */}
            <rect
              x="20"
              y="15"
              width="60"
              height="85"
              rx="12"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="3"
            />
            {/* Top Cap */}
            <rect x="30" y="8" width="40" height="8" rx="3" fill="#475569" />

            {/* Chamber Fluid (Height scales with Water, Color with Heat/Cleanliness) */}
            <rect
              x="24"
              y={95 - (washWaterLiters / 100) * 70}
              width="52"
              height={(washWaterLiters / 100) * 70}
              rx="8"
              fill={
                isSweetSpot
                  ? "#10b981"
                  : isBoiling
                  ? "#ef4444"
                  : isTooCold
                  ? "#8b5cf6"
                  : "#06b6d4"
              }
              fillOpacity="0.75"
              className="transition-all duration-300"
            />

            {/* Rising Bubbles / Steam */}
            <circle
              cx="40"
              cy="70"
              r={isBoiling ? "4" : "2"}
              fill="#ffffff"
              opacity="0.6"
              className="animate-bounce"
            />
            <circle
              cx="60"
              cy="55"
              r={isBoiling ? "5" : "2.5"}
              fill="#ffffff"
              opacity="0.8"
              className="animate-ping"
            />

            {/* Heating coils indicator at bottom */}
            <path
              d="M 28 105 L 36 101 L 44 105 L 52 101 L 60 105 L 68 101"
              fill="none"
              stroke={catalyticHeatC > 150 ? "#f97316" : "#475569"}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          <div className="text-[10px] font-mono text-center mt-1">
            <span className="text-slate-400">Soil Purity: </span>
            <span
              className={`font-black ${
                soilPurity > 90 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {soilPurity}%
            </span>
          </div>
        </div>

        {/* Dual Sliders & Sweet Spot Guides */}
        <div className="md:col-span-8 flex flex-col gap-3">
          {/* Slider 1: Wash Water */}
          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <label htmlFor={waterSliderId} className="text-slate-300 flex items-center gap-1.5 font-bold">
                <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Wash Water Buffer (Liters):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-black text-sm ${
                    isWaterOptimal ? "text-emerald-400" : "text-cyan-300"
                  }`}
                >
                  {washWaterLiters} L
                </span>
                <span className="text-[10px] text-slate-500 font-mono">[Target: 40–60L]</span>
              </div>
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
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className={isTooDry ? "text-amber-400 font-bold" : ""}>0L (Dry Brine)</span>
              <span className={isWaterOptimal ? "text-emerald-400 font-bold" : "text-slate-500"}>
                ▲ Sweet Spot: 40–60L
              </span>
              <span className={isTooFlooded ? "text-amber-400 font-bold" : ""}>100L (Buffer Drain)</span>
            </div>
          </div>

          {/* Slider 2: Catalytic Heat */}
          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <label htmlFor={heatSliderId} className="text-slate-300 flex items-center gap-1.5 font-bold">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Catalytic Bed Heat (°C):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-black text-sm ${
                    isHeatOptimal
                      ? "text-emerald-400"
                      : isBoiling
                      ? "text-red-400 animate-pulse"
                      : "text-orange-300"
                  }`}
                >
                  {catalyticHeatC}°C
                </span>
                <span className="text-[10px] text-slate-500 font-mono">[Target: 170–210°C]</span>
              </div>
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
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className={isTooCold ? "text-purple-400 font-bold" : ""}>20°C (Cold)</span>
              <span className={isHeatOptimal ? "text-emerald-400 font-bold" : "text-slate-500"}>
                ▲ Catalysis Window: 170–210°C
              </span>
              <span className={isBoiling ? "text-red-400 font-bold animate-pulse" : ""}>
                &gt;215°C (Flash Boil)
              </span>
            </div>
          </div>

          {/* Real-Time Chemistry Feedback Notice */}
          <div className="text-[11px] font-mono p-2 rounded-lg bg-black/40 border border-white/5">
            {isSweetSpot ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sweet Spot: 99.8% Perchlorates neutralized. Zero water buffer vaporized.</span>
              </span>
            ) : isBoiling ? (
              <span className="text-red-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Critical: Water flash-boiling at {catalyticHeatC}°C! Buffer venting to steam!</span>
              </span>
            ) : isTooCold ? (
              <span className="text-purple-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                <span>Catalyst inactive below 160°C. Increase heat to trigger salt reduction.</span>
              </span>
            ) : isTooDry ? (
              <span className="text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Insufficient wash water (&lt;35L). Soil brine saturated.</span>
              </span>
            ) : (
              <span className="text-slate-300">
                Adjust sliders into the sweet spot window to complete wash cycle.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Commitment Button */}
      <motion.button
        type="button"
        whileHover={{ scale: disabled ? 1 : 1.015 }}
        whileTap={{ scale: disabled ? 1 : 0.985 }}
        disabled={disabled}
        onClick={handleCommit}
        className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
          isSweetSpot
            ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-emerald-900/50 hover:brightness-110"
            : isBoiling
            ? "bg-red-800 text-red-200 border border-red-500/50"
            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10"
        }`}
      >
        {isSweetSpot ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>ENGAGE CATALYTIC WASH CYCLE ({washWaterLiters}L @ {catalyticHeatC}°C)</span>
          </>
        ) : isBoiling ? (
          <>
            <AlertTriangle className="w-4 h-4 text-red-300" />
            <span>OVERHEATED: REDUCE HEAT BELOW 215°C</span>
          </>
        ) : (
          <>
            <Beaker className="w-4 h-4 text-purple-400" />
            <span>CONFIRM SOIL WASH CALIBRATION</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
